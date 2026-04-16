import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const messages = await prisma.message.findMany({
      where: {
        bookingId,
        expiresAt: { gt: new Date() },
      },
      include: {
        sender: {
          select: { id: true, role: true, profile: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[messages GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
