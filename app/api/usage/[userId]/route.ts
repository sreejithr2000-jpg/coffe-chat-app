import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRequestLimit } from "@/lib/requestLimits";

type Params = { params: Promise<{ userId: string }> };

/** GET /api/usage/[userId] — DB-computed request limits + weekly session progress */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;

    // Week start (Monday 00:00)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const [limit, thisWeekCompleted] = await Promise.all([
      checkRequestLimit(userId),
      prisma.booking.count({
        where: {
          seekerId: userId,
          status: "completed",
          completedAt: { gte: weekStart },
        },
      }),
    ]);

    return NextResponse.json({
      weeklyUsed: limit.weeklyUsed,
      weeklyLimit: limit.weeklyLimit,
      monthlyUsed: limit.monthlyUsed,
      hasBonus: limit.hasBonus,
      thisWeekCompleted,
    });
  } catch (error) {
    console.error("[usage GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
