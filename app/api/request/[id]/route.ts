import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMeetingLink, isValidMeetingUrl } from "@/lib/meeting";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { getValidToken } from "@/lib/googleAuth";
import { createCalendarEvent } from "@/lib/googleCalendar";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const req = await prisma.request.findUnique({
      where: { id },
      include: {
        auror: {
          select: {
            profile: { select: { name: true, currentRole: true } },
          },
        },
        availabilitySlot: {
          select: { date: true, startTime: true, endTime: true },
        },
      },
    });

    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(req);
  } catch (error) {
    console.error("[request GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { seekerId: string };
    const { seekerId } = body;

    if (!seekerId) {
      return NextResponse.json({ error: "seekerId is required" }, { status: 400 });
    }

    const req = await prisma.request.findUnique({ where: { id } });
    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (req.seekerId !== seekerId) {
      return NextResponse.json({ error: "Not your request" }, { status: 403 });
    }
    if (req.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be withdrawn" },
        { status: 409 }
      );
    }

    await prisma.request.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[request DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { action: "accept" | "reject"; aurorId: string; rejectReason?: string };
    const { action, aurorId, rejectReason } = body;

    if (!action || !aurorId) {
      return NextResponse.json({ error: "action and aurorId are required" }, { status: 400 });
    }
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
    }

    // Validate auror role
    const actor = await prisma.user.findUnique({ where: { id: aurorId } });
    if (!actor || actor.role !== "AUROR") {
      return NextResponse.json({ error: "Only Aurors can respond to requests" }, { status: 403 });
    }

    const req = await prisma.request.findUnique({ where: { id } });
    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (req.aurorId !== aurorId) {
      return NextResponse.json({ error: "Not your request" }, { status: 403 });
    }
    if (req.status !== "pending") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });
    }
    if (new Date() > req.expiresAt) {
      await prisma.request.update({ where: { id }, data: { status: "expired" } });
      return NextResponse.json({ error: "Request has expired" }, { status: 409 });
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";

    const updated = await prisma.request.update({
      where: { id },
      data: { status: newStatus },
      include: { availabilitySlot: true },
    });

    if (newStatus === "accepted") {
      const slot = updated.availabilitySlot;

      // Derive scheduledAt from the slot's specific date + start time (UTC)
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      const scheduledAt = new Date(slot.date);
      scheduledAt.setUTCHours(sh, sm, 0, 0);
      const scheduledEnd = new Date(slot.date);
      scheduledEnd.setUTCHours(eh, em, 0, 0);

      // Default to internal meeting link; upgrade to Google Meet if Auror has token
      let meetingLink = generateMeetingLink(id);

      const booking = await prisma.booking.upsert({
        where:  { requestId: id },
        update: {},
        create: {
          requestId: id,
          seekerId:  updated.seekerId,
          aurorId:   updated.aurorId,
          availabilitySlotId: updated.availabilitySlotId,
          status:      "scheduled",
          sessionType: updated.sessionType,
          duration:    updated.duration,
          scheduledAt,
          meetingLink,
        },
      });

      // Use existing meetingLink if already set (deduplication guard)
      if (booking.meetingLink) meetingLink = booking.meetingLink;

      // Try Google Calendar — fail gracefully if not connected / credentials missing
      // Skip if booking already has a Google Calendar event
      let hasMeetLink = false;
      if (!booking.googleEventId) {
        try {
          const accessToken = await getValidToken(updated.aurorId);
          if (accessToken) {
            const [aurorProfileForCal, seekerProfileForCal, seekerUserForCal, aurorUserForCal] = await Promise.all([
              prisma.profile.findUnique({ where: { userId: updated.aurorId } }),
              prisma.profile.findUnique({ where: { userId: updated.seekerId } }),
              prisma.user.findUnique({ where: { id: updated.seekerId }, select: { email: true } }),
              prisma.user.findUnique({ where: { id: updated.aurorId  }, select: { email: true } }),
            ]);

            const attendees = [seekerUserForCal?.email, aurorUserForCal?.email].filter(Boolean) as string[];
            const sessionLabel = updated.sessionType === "coffee" ? "Coffee Chat" : "Mock Interview";
            const title = `${sessionLabel} with ${seekerProfileForCal?.name ?? "Seeker"}`;

            const calResult = await createCalendarEvent(accessToken, {
              title,
              description: `CoffeeChat session\nType: ${sessionLabel}\nDuration: ${updated.duration} minutes\nHost: ${aurorProfileForCal?.name ?? "Auror"}`,
              startTime:   scheduledAt,
              endTime:     scheduledEnd,
              attendeeEmails: attendees,
            });

            const updateData: Record<string, unknown> = {
              calendarProvider: "google",
              googleEventAt:    new Date(),
            };
            if (calResult.eventId)  updateData.googleEventId = calResult.eventId;
            if (calResult.meetLink) {
              updateData.meetingLink = calResult.meetLink;
              meetingLink = calResult.meetLink;
              hasMeetLink = true;
            }

            await prisma.booking.update({ where: { id: booking.id }, data: updateData });
          }
        } catch (calErr) {
          console.warn("[request PATCH] Google Calendar event creation skipped:", calErr);
        }
      } else {
        hasMeetLink = isValidMeetingUrl(booking.meetingLink) && booking.meetingLink!.includes("meet.google.com");
      }

      // ── Notifications + email ─────────────────────────────────────────────────
      const aurorProfile = await prisma.profile.findUnique({ where: { userId: aurorId } });
      const aurorName    = aurorProfile?.name ?? "Your Auror";

      const notifBody = hasMeetLink
        ? `${aurorName} accepted your request. Your Google Meet link is ready — check your upcoming sessions.`
        : `${aurorName} accepted your request. Your session is confirmed.`;

      await createNotification(req.seekerId, "Request accepted 🎉", notifBody, "REQUEST_ACCEPTED");

      const seeker = await prisma.user.findUnique({ where: { id: req.seekerId } });
      const meetSection = hasMeetLink
        ? `<p>Your Google Meet link: <a href="${meetingLink}">${meetingLink}</a></p>`
        : "";
      await sendEmail(
        seeker?.email,
        "Your session request was accepted",
        `<p>Great news! <strong>${aurorName}</strong> accepted your session request.</p>
         ${meetSection}
         <p>Log in to CoffeeChat to view your upcoming session.</p>`
      );

      return NextResponse.json(updated);
    }

    // ── Notifications for rejection ───────────────────────────────────────────
    const aurorProfile = await prisma.profile.findUnique({ where: { userId: aurorId } });
    const aurorName    = aurorProfile?.name ?? "Your Auror";

    if (newStatus === "rejected") {
      const REASON_LABELS: Record<string, string> = {
        no_availability:   "they had no availability that week",
        not_my_expertise:  "it was outside their area of expertise",
        low_preparation:   "the preparation level wasn't quite there yet",
        too_many_sessions: "they're already at capacity this week",
      };
      const reasonText = rejectReason
        ? (REASON_LABELS[rejectReason.split(":")[0]] ?? rejectReason)
        : null;
      const message = reasonText
        ? `${aurorName} was unable to accept your request — ${reasonText}.`
        : `${aurorName} was unable to accept your request this time.`;
      await createNotification(req.seekerId, "Request not accepted", message, "REQUEST_REJECTED");
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[request PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
