import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingWindow } from "@/lib/availability";

type Params = { params: Promise<{ id: string }> };

/**
 * GET  /api/availability/[userId]  → fetch active slots for an Auror
 * DELETE /api/availability/[id]    → delete a specific slot
 */

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id: userId } = await params;
    const now = new Date();
    const { end: windowEnd } = getBookingWindow();

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        userId,
        // Slot date must be in the booking window and not yet expired
        date: { lte: windowEnd },
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
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
