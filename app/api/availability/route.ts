import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOverlap, getBookingWindow } from "@/lib/availability";
import { createNotification } from "@/lib/notifications";
import type { CreateSlotPayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSlotPayload;
    const { userId, date, startTime, endTime } = body;

    if (!userId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Normalise to UTC midnight so the date is timezone-stable
    const slotDate = new Date(date);
    slotDate.setUTCHours(0, 0, 0, 0);

    // Reject if outside the 2-week booking window
    const { start: windowStart, end: windowEnd } = getBookingWindow();
    if (slotDate < windowStart || slotDate > windowEnd) {
      return NextResponse.json(
        { error: "Slot must be within the current or next week" },
        { status: 400 }
      );
    }

    // Overlap check — fetch existing slots for this user on the same date
    const existing = await prisma.availabilitySlot.findMany({
      where: { userId, date: slotDate },
    });

    if (hasOverlap(existing, startTime, endTime)) {
      return NextResponse.json(
        { error: "This slot overlaps with an existing one" },
        { status: 409 }
      );
    }

    // validTo = end of the slot date (UTC)
    const validTo = new Date(slotDate);
    validTo.setUTCHours(23, 59, 59, 999);

    const slot = await prisma.availabilitySlot.create({
      data: { userId, date: slotDate, startTime, endTime, validTo },
    });

    // Notify seekers watching this Auror — deduplicate: skip if an unread NEW_SLOT
    // notification for this auror was sent to the same seeker in the last 30 min.
    const watchers = await prisma.slotWatchlist.findMany({
      where: { aurorId: userId },
      select: { seekerId: true },
    });

    if (watchers.length > 0) {
      const aurorProfile = await prisma.profile.findUnique({ where: { userId } });
      const aurorName = aurorProfile?.name ?? "An Auror";
      const slotLabel = `${startTime}–${endTime} on ${slotDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;

      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

      await Promise.all(
        watchers.map(async ({ seekerId }) => {
          const recent = await prisma.notification.findFirst({
            where: {
              userId: seekerId,
              type: "NEW_SLOT",
              isRead: false,
              createdAt: { gte: thirtyMinAgo },
              message: { contains: aurorName },
            },
          });
          if (!recent) {
            await createNotification(
              seekerId,
              "New slot available",
              `${aurorName} just opened a slot: ${slotLabel}.`,
              "NEW_SLOT"
            );
          }
        })
      );
    }

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("[availability POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
