import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/watchlist/[seekerId]  → list of aurorIds this seeker is watching
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seekerId: string }> }
) {
  try {
    const { seekerId } = await params;
    const entries = await prisma.slotWatchlist.findMany({
      where: { seekerId },
      select: { aurorId: true },
    });
    return NextResponse.json(entries.map((e) => e.aurorId));
  } catch (error) {
    console.error("[watchlist GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
