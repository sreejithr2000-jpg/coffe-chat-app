import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      bookingId: string;
      seekerId: string;
      rating: number;
      attended: boolean;
      review?: string;
      takeaways?: string[];
      displayMode?: string;
    };

    const { bookingId, seekerId, rating, attended, review: rawReview, takeaways: rawTakeaways, displayMode: rawDisplayMode } = body;
    const VALID_DISPLAY_MODES = ["anonymous", "first_name", "full_name"];
    const displayMode = VALID_DISPLAY_MODES.includes(rawDisplayMode ?? "") ? rawDisplayMode! : "anonymous";
    const reviewText = rawReview ? rawReview.trim().slice(0, 500) || null : null;
    const takeaways = Array.isArray(rawTakeaways)
      ? rawTakeaways.map((t) => t.trim()).filter((t) => t.length > 0).slice(0, 5)
      : [];

    if (!bookingId || !seekerId) {
      return NextResponse.json({ error: "bookingId and seekerId are required" }, { status: 400 });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.seekerId !== seekerId) {
      return NextResponse.json({ error: "Only the Seeker can submit a review" }, { status: 403 });
    }

    if (booking.status !== "scheduled") {
      return NextResponse.json({ error: "Booking is not in scheduled status" }, { status: 409 });
    }

    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json({ error: "Review already submitted for this booking" }, { status: 409 });
    }

    const now = new Date();

    const [review] = await prisma.$transaction([
      prisma.review.create({
        data: {
          bookingId,
          seekerId,
          aurorId: booking.aurorId,
          rating: Math.round(rating),
          attended,
          review: reviewText,
          takeaways,
          displayMode,
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "completed", completedAt: now },
      }),
    ]);

    // ── Notify Auror + email Seeker ───────────────────────────────────────────
    const seekerProfile = await prisma.profile.findUnique({ where: { userId: seekerId } });
    const seekerName    = seekerProfile?.name ?? "Your seeker";
    await createNotification(
      booking.aurorId,
      "Session completed",
      `${seekerName} marked their session with you as complete.`,
      "SESSION_COMPLETED"
    );
    const seeker = await prisma.user.findUnique({ where: { id: seekerId } });
    await sendEmail(
      seeker?.email,
      "Session complete — thanks for using Lumora OneFlow!",
      `<p>Your session has been marked as complete. Thanks for using Lumora OneFlow!</p>
       <p>We hope it was a great experience. Keep going! ✨</p>`
    );

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[review POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
