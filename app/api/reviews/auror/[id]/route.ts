import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aurorId } = await params;

    const reviews = await prisma.review.findMany({
      where: { aurorId },
      include: {
        seeker: { select: { profile: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[reviews/auror GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
