import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/notifications?userId=xxx — fetch latest 20 notifications
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[notifications GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark ALL notifications as read for a user
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notifications PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
