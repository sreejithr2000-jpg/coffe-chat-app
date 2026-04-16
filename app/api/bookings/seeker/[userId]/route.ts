import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPLETED_PAGE_SIZE = 10;

const INCLUDE = {
  auror: {
    select: { profile: { select: { name: true } } },
  },
  availabilitySlot: {
    select: { date: true, startTime: true, endTime: true },
  },
  review: {
    select: { rating: true, takeaways: true, review: true },
  },
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const completedSkip = Number(
      request.nextUrl.searchParams.get("completedSkip") ?? "0"
    );

    // Three separate queries so ordering is guaranteed per-status
    const [scheduled, completedPage, completedTotal, cancelled] = await Promise.all([
      // Upcoming: earliest first
      prisma.booking.findMany({
        where: { seekerId: userId, status: "scheduled" },
        include: INCLUDE,
        orderBy: { scheduledAt: "asc" },
      }),
      // Completed: most recent first, paginated
      prisma.booking.findMany({
        where: { seekerId: userId, status: "completed" },
        include: INCLUDE,
        orderBy: { completedAt: "desc" },
        take: COMPLETED_PAGE_SIZE,
        skip: completedSkip,
      }),
      // Total completed count (for hasMore calculation)
      prisma.booking.count({
        where: { seekerId: userId, status: "completed" },
      }),
      // Cancelled: most recent first
      prisma.booking.findMany({
        where: { seekerId: userId, status: "cancelled" },
        include: INCLUDE,
        orderBy: { scheduledAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      bookings: [...scheduled, ...completedPage, ...cancelled],
      hasMoreCompleted: completedSkip + COMPLETED_PAGE_SIZE < completedTotal,
      completedTotal,
    });
  } catch (error) {
    console.error("[bookings/seeker GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
