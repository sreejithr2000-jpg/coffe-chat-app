import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/watchlist  { seekerId, aurorId }  → subscribe
export async function POST(request: NextRequest) {
  try {
    const { seekerId, aurorId } = (await request.json()) as { seekerId: string; aurorId: string };
    if (!seekerId || !aurorId) {
      return NextResponse.json({ error: "seekerId and aurorId are required" }, { status: 400 });
    }

    const entry = await prisma.slotWatchlist.upsert({
      where: { seekerId_aurorId: { seekerId, aurorId } },
      update: {},
      create: { seekerId, aurorId },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[watchlist POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/watchlist  { seekerId, aurorId }  → unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { seekerId, aurorId } = (await request.json()) as { seekerId: string; aurorId: string };
    if (!seekerId || !aurorId) {
      return NextResponse.json({ error: "seekerId and aurorId are required" }, { status: 400 });
    }

    await prisma.slotWatchlist.deleteMany({ where: { seekerId, aurorId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[watchlist DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
