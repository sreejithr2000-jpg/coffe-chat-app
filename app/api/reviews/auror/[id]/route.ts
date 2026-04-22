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

    // Attach resolved display label — never expose raw seekerId externally
    const result = reviews.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      rating: r.rating,
      attended: r.attended,
      review: r.review,
      takeaways: r.takeaways,
      displayMode: r.displayMode,
      seekerName: r.seeker?.profile?.name ?? null,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[reviews/auror GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
