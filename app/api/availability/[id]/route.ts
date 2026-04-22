import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingWindow } from "@/lib/availability";
import type { EnrichedSlot, SlotStatus } from "@/types";

type Params = { params: Promise<{ id: string }> };

/**
 * GET  /api/availability/[userId]?seekerId=xxx  → fetch slots for an Auror
 *   Includes slotStatus + isMyRequest so the booking page can show
 *   availability state BEFORE the seeker fills any form fields.
 *
 *   slotStatus:
 *     "available" — no active (pending/accepted) request on this slot
 *     "pending"   — at least one pending request exists (slot is soft-locked)
 *     "accepted"  — an accepted request / confirmed booking exists (hard-locked)
 *
 *   Rejected / withdrawn / expired requests do NOT lock the slot.
 *
 * DELETE /api/availability/[id]  → delete a specific slot
 */

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: userId } = await params;
    const seekerId = new URL(request.url).searchParams.get("seekerId") ?? undefined;
    const now = new Date();
    const { end: windowEnd } = getBookingWindow();

    const rawSlots = await prisma.availabilitySlot.findMany({
      where: {
        userId,
        date: { lte: windowEnd },
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        requests: {
          where: { status: { in: ["pending", "accepted"] } },
          select: { id: true, seekerId: true, status: true },
        },
      },
    });

    const enriched: EnrichedSlot[] = rawSlots.map((slot) => {
      const { requests, ...rest } = slot;

      const accepted = requests.find((r) => r.status === "accepted");
      const pending  = requests.filter((r) => r.status === "pending");

      let slotStatus: SlotStatus = "available";
      let isMyRequest = false;

      if (accepted) {
        slotStatus = "accepted";
        isMyRequest = seekerId ? accepted.seekerId === seekerId : false;
      } else if (pending.length > 0) {
        slotStatus = "pending";
        isMyRequest = seekerId ? pending.some((r) => r.seekerId === seekerId) : false;
      }

      return { ...rest, date: rest.date.toISOString(), validFrom: rest.validFrom.toISOString(), validTo: rest.validTo.toISOString(), createdAt: rest.createdAt.toISOString(), slotStatus, isMyRequest };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[availability GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.availabilitySlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[availability DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
