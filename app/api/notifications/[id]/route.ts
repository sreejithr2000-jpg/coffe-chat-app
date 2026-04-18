import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notification/:id PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
