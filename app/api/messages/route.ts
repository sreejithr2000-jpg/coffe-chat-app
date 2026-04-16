import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      bookingId: string;
      senderId: string;
      content: string;
    };

    const { bookingId, senderId, content } = body;

    if (!bookingId || !senderId || !content?.trim()) {
      return NextResponse.json(
        { error: "bookingId, senderId, and content are required" },
        { status: 400 }
      );
    }

    // Load booking to validate membership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seeker: true, auror: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isSeeker = booking.seekerId === senderId;
    const isAuror = booking.aurorId === senderId;

    if (!isSeeker && !isAuror) {
      return NextResponse.json({ error: "Not a participant of this booking" }, { status: 403 });
    }

    // Check whether any messages exist yet for this booking
    const existingCount = await prisma.message.count({ where: { bookingId } });

    if (existingCount === 0 && !isAuror) {
      return NextResponse.json(
        { error: "Only the Auror can start the conversation" },
        { status: 403 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    // Create message and stamp booking timestamps atomically.
    // Also mark the *sender's* read time so they don't see their own message as unread.
    const bookingUpdate: Record<string, Date> = { lastMessageAt: now };
    if (isSeeker) bookingUpdate.seekerLastReadAt = now;
    if (isAuror)  bookingUpdate.aurorLastReadAt  = now;

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { bookingId, senderId, content: content.trim(), expiresAt },
        include: {
          sender: {
            select: { id: true, role: true, profile: { select: { name: true } } },
          },
        },
      }),
      prisma.booking.update({ where: { id: bookingId }, data: bookingUpdate }),
    ]);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[messages POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
