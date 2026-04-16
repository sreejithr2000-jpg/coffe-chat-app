import { prisma } from "@/lib/prisma";

const BASE_WEEKLY_LIMIT = 10;
const MONTHLY_LIMIT = 40;
const BONUS_THRESHOLD = 5; // completed bookings previous week → bonus
const BONUS_EXTRA = 5;     // +5 requests allowed that week

/** ISO week boundaries (Mon 00:00 → Sun 23:59:59) relative to `now` */
function weekBounds(now: Date, offsetWeeks = 0) {
  const d = new Date(now);
  // getDay(): 0=Sun … 6=Sat  → shift so Mon=0
  const day = (d.getDay() + 6) % 7;
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - day + offsetWeeks * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return { start: startOfWeek, end: endOfWeek };
}

function monthBounds(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export interface LimitCheck {
  allowed: boolean;
  weeklyLimit: number;
  weeklyUsed: number;
  monthlyUsed: number;
  hasBonus: boolean;
  reason?: string;
}

export async function checkRequestLimit(seekerId: string): Promise<LimitCheck> {
  const now = new Date();
  const thisWeek = weekBounds(now, 0);
  const lastWeek = weekBounds(now, -1);
  const thisMonth = monthBounds(now);

  const [weeklyUsed, monthlyUsed, prevWeekCompleted] = await Promise.all([
    prisma.request.count({
      where: { seekerId, createdAt: { gte: thisWeek.start, lt: thisWeek.end } },
    }),
    prisma.request.count({
      where: { seekerId, createdAt: { gte: thisMonth.start, lt: thisMonth.end } },
    }),
    prisma.booking.count({
      where: {
        seekerId,
        status: "completed",
        completedAt: { gte: lastWeek.start, lt: lastWeek.end },
      },
    }),
  ]);

  const hasBonus = prevWeekCompleted >= BONUS_THRESHOLD;
  const weeklyLimit = BASE_WEEKLY_LIMIT + (hasBonus ? BONUS_EXTRA : 0);

  if (weeklyUsed >= weeklyLimit) {
    return {
      allowed: false,
      weeklyLimit,
      weeklyUsed,
      monthlyUsed,
      hasBonus,
      reason: "weekly_limit",
    };
  }
  if (monthlyUsed >= MONTHLY_LIMIT) {
    return {
      allowed: false,
      weeklyLimit,
      weeklyUsed,
      monthlyUsed,
      hasBonus,
      reason: "monthly_limit",
    };
  }

  return { allowed: true, weeklyLimit, weeklyUsed, monthlyUsed, hasBonus };
}
