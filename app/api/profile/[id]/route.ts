import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        aurorReviews: { select: { rating: true } },
        aurorBookings: { where: { status: "completed" }, select: { id: true } },
      },
    });

    if (!user || !user.profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const ratings = user.aurorReviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    return NextResponse.json({
      user: { id: user.id, role: user.role, email: user.email, createdAt: user.createdAt },
      profile: user.profile,
      completedSessions: user.aurorBookings.length,
      avgRating,
      ratings,
    });
  } catch (error) {
    console.error("[profile GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
