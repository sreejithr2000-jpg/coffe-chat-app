import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRequestLimit } from "@/lib/requestLimits";
import { getBookingWindow, slotMinutes, DURATION_OPTIONS } from "@/lib/availability";
import { createNotification } from "@/lib/notifications";
import type { CreateRequestPayload } from "@/types";

const VALID_SESSION_TYPES = ["coffee", "mock"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRequestPayload;
    const { seekerId, aurorId, availabilitySlotId, questions, sessionType, duration } = body;

    // ── Basic presence checks ─────────────────────────────────────────────────
    if (!seekerId || !aurorId || !availabilitySlotId || !sessionType || !duration) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // ── Session type validation ───────────────────────────────────────────────
    if (!VALID_SESSION_TYPES.includes(sessionType)) {
      return NextResponse.json(
        { error: "sessionType must be 'coffee' or 'mock'" },
        { status: 400 }
      );
    }

    // ── Duration validation ───────────────────────────────────────────────────
    const allowedDurations: readonly number[] = DURATION_OPTIONS[sessionType];
    if (!allowedDurations.includes(duration)) {
      return NextResponse.json(
        { error: `Invalid duration for ${sessionType}. Allowed: ${allowedDurations.join(", ")} min` },
        { status: 400 }
      );
    }

    // ── Questions ─────────────────────────────────────────────────────────────
    const validQuestions = questions.filter((q) => q.trim().length > 0);
    if (validQuestions.length < 3) {
      return NextResponse.json(
        { error: "At least 3 questions are required" },
        { status: 400 }
      );
    }

    // ── Seeker role check ─────────────────────────────────────────────────────
    const seeker = await prisma.user.findUnique({ where: { id: seekerId } });
    if (!seeker || seeker.role !== "SEEKER") {
      return NextResponse.json(
        { error: "Only Seekers can send requests" },
        { status: 403 }
      );
    }

    // ── Request limits ────────────────────────────────────────────────────────
    const limit = await checkRequestLimit(seekerId);
    if (!limit.allowed) {
      const isWeekly = limit.reason === "weekly_limit";
      return NextResponse.json(
        {
          error: isWeekly
            ? "You've reached your weekly request limit."
            : "You've reached your monthly request limit.",
          limitReason: limit.reason,
          weeklyUsed: limit.weeklyUsed,
          weeklyLimit: limit.weeklyLimit,
          monthlyUsed: limit.monthlyUsed,
        },
        { status: 429 }
      );
    }

    // ── Slot validation ───────────────────────────────────────────────────────
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: availabilitySlotId },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    // Slot must be within the booking window
    const { start: windowStart, end: windowEnd } = getBookingWindow();
    if (slot.date < windowStart || slot.date > windowEnd) {
      return NextResponse.json(
        { error: "This slot is outside the booking window (current + next week)" },
        { status: 400 }
      );
    }

    // Slot must not be expired
    const now = new Date();
    if (slot.validTo < now) {
      return NextResponse.json(
        { error: "This slot is no longer available" },
        { status: 400 }
      );
    }

    // Duration must fit inside the slot
    const available = slotMinutes(slot);
    if (duration > available) {
      return NextResponse.json(
        { error: `Selected duration (${duration} min) exceeds slot length (${available} min)` },
        { status: 400 }
      );
    }

    // ── Overbooking prevention ────────────────────────────────────────────────
    const existingBooking = await prisma.booking.findFirst({
      where: {
        availabilitySlotId,
        status: "scheduled",
      },
    });
    if (existingBooking) {
      return NextResponse.json(
        { error: "This slot is already booked" },
        { status: 409 }
      );
    }

    // ── Duplicate request check ───────────────────────────────────────────────
    const existingRequest = await prisma.request.findFirst({
      where: {
        seekerId,
        availabilitySlotId,
        status: { in: ["pending", "accepted"] },
      },
    });
    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have an active request for this slot" },
        { status: 409 }
      );
    }

    // ── Create request ────────────────────────────────────────────────────────
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const req = await prisma.request.create({
      data: {
        seekerId,
        aurorId,
        availabilitySlotId,
        status: "pending",
        questions: validQuestions,
        sessionType,
        duration,
        expiresAt,
      },
    });

    // Notify the Auror of the new incoming request (non-blocking)
    const seekerProfile = await prisma.profile.findUnique({ where: { userId: seekerId } });
    const seekerName = seekerProfile?.name ?? "A seeker";
    const sessionLabel = sessionType === "coffee" ? "coffee chat" : "mock interview";
    await createNotification(
      aurorId,
      "New session request",
      `${seekerName} wants to book a ${sessionLabel} with you.`,
      "REQUEST_RECEIVED"
    );

    return NextResponse.json(req, { status: 201 });
  } catch (error) {
    console.error("[request POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
