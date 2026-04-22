import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildICSContent } from "@/lib/googleCalendar";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seeker: { select: { profile: { select: { name: true } } } },
        auror:  { select: { profile: { select: { name: true } } } },
        availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const slot = booking.availabilitySlot;
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);

    const startTime = new Date(slot.date);
    startTime.setUTCHours(sh, sm, 0, 0);
    const endTime = new Date(slot.date);
    endTime.setUTCHours(eh, em, 0, 0);

    const seekerName = booking.seeker?.profile?.name ?? "Seeker";
    const aurorName  = booking.auror?.profile?.name  ?? "Auror";
    const title      = `Coffee Chat: ${seekerName} × ${aurorName}`;
    const description = [
      `Session type: ${booking.sessionType === "coffee" ? "Coffee Chat" : "Mock Interview"}`,
      `Duration: ${booking.duration} minutes`,
      ...(booking.meetingLink ? [`Join: ${booking.meetingLink}`] : []),
    ].join("\n");

    const ics = buildICSContent({
      uid: booking.id,
      title,
      startTime,
      endTime,
      description,
      location: booking.meetingLink ?? undefined,
    });

    return new NextResponse(ics, {
      headers: {
        "Content-Type":        "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="session-${bookingId}.ics"`,
      },
    });
  } catch (error) {
    console.error("[calendar ics]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
