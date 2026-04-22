import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const aurors = await prisma.user.findMany({
      where: { role: "AUROR" },
      include: {
        profile: true,
        aurorReviews: { select: { rating: true } },
        _count: {
          select: { aurorBookings: { where: { status: "completed" } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const result = aurors.map((auror) => {
      const reviews = auror.aurorReviews;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

      return {
        id: auror.id,
        profile: auror.profile,
        rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
        reviewCount: reviews.length,
        completedSessions: auror._count.aurorBookings,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[aurors GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
