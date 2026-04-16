import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aurorId } = await params;

    const auror = await prisma.user.findUnique({
      where: { id: aurorId },
      include: {
        profile: true,
        aurorReviews: { select: { rating: true } },
        aurorBookings: {
          where: { status: "completed" },
          select: { id: true },
        },
      },
    });

    if (!auror) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reviews = auror.aurorReviews;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return NextResponse.json({
      id: auror.id,
      profile: auror.profile,
      rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      reviewCount: reviews.length,
      completedSessions: auror.aurorBookings.length,
    });
  } catch (error) {
    console.error("[aurors/[id] GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
