import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INCLUDE = {
  seeker: {
    select: { profile: { select: { name: true } } },
  },
  availabilitySlot: {
    select: { date: true, startTime: true, endTime: true },
  },
  request: {
    select: { questions: true, status: true },
  },
  review: {
    select: { rating: true, takeaways: true, review: true },
  },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Three separate queries so ordering is guaranteed per-status
    const [scheduled, completed, cancelled] = await Promise.all([
      // Upcoming: earliest first
      prisma.booking.findMany({
        where: { aurorId: userId, status: "scheduled" },
        include: INCLUDE,
        orderBy: { scheduledAt: "asc" },
      }),
      // Completed: most recent first
      prisma.booking.findMany({
        where: { aurorId: userId, status: "completed" },
        include: INCLUDE,
        orderBy: { completedAt: "desc" },
      }),
      // Cancelled: most recent first
      prisma.booking.findMany({
        where: { aurorId: userId, status: "cancelled" },
        include: INCLUDE,
        orderBy: { scheduledAt: "desc" },
      }),
    ]);

    return NextResponse.json([...scheduled, ...completed, ...cancelled]);
  } catch (error) {
    console.error("[bookings/auror GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
