import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        seeker: { select: { id: true, role: true, profile: { select: { name: true } } } },
        auror:  { select: { id: true, role: true, profile: { select: { name: true } } } },
        availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("[booking GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as
      | { action: "complete" | "cancel"; seekerId: string }
      | { action: "mark_read"; userId: string };

    if (!body.action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ── mark_read ────────────────────────────────────────────────────────────
    if (body.action === "mark_read") {
      const { userId } = body;
      const isSeeker = booking.seekerId === userId;
      const isAuror  = booking.aurorId  === userId;
      if (!isSeeker && !isAuror) {
        return NextResponse.json({ error: "Not a participant" }, { status: 403 });
      }
      await prisma.booking.update({
        where: { id },
        data: isSeeker ? { seekerLastReadAt: new Date() } : { aurorLastReadAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    // ── complete / cancel ────────────────────────────────────────────────────
    const { seekerId } = body as { action: "complete" | "cancel"; seekerId: string };
    if (!seekerId) {
      return NextResponse.json({ error: "seekerId is required" }, { status: 400 });
    }
    if (booking.seekerId !== seekerId) {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }
    if (booking.status !== "scheduled") {
      return NextResponse.json({ error: "Booking is no longer scheduled" }, { status: 409 });
    }

    const newStatus = body.action === "complete" ? "completed" : "cancelled";
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: newStatus },
    });

    // ── Notify auror when a session is cancelled ─────────────────────────────
    if (newStatus === "cancelled") {
      const cancelBody = body as {
        action: "cancel";
        seekerId: string;
        reason?: string;
        reasonNote?: string;
      };
      const reason = cancelBody.reason ?? "unspecified";

      const seekerProfile = await prisma.profile.findUnique({
        where: { userId: seekerId },
        select: { name: true },
      });
      const seekerName = seekerProfile?.name ?? "A seeker";

      const reasonMessages: Record<string, string> = {
        auror_no_show:       `${seekerName} reported that you didn't show up for the scheduled session.`,
        seeker_no_show:      `${seekerName} was unable to attend the session.`,
        scheduling_conflict: `${seekerName} reported a scheduling conflict.`,
        technical_issue:     `${seekerName} reported a technical issue with the session.`,
        rescheduled:         `${seekerName} noted the session was rescheduled elsewhere.`,
        broken_link:         `${seekerName} reported the meeting link was missing or broken.`,
        other:               `${seekerName} reported an issue with the session.`,
      };

      const message =
        reasonMessages[reason] ?? `${seekerName} marked the session as not completed.`;

      await createNotification(
        booking.aurorId,
        "Session not completed",
        message,
        "SESSION_CANCELLED"
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[booking PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
