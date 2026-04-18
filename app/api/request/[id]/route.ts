import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMeetingLink } from "@/lib/meeting";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

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
    const body = (await request.json()) as { action: "accept" | "reject"; aurorId: string };
    const { action, aurorId } = body;

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
      const [hh, mm] = slot.startTime.split(":").map(Number);
      const scheduledAt = new Date(slot.date);
      scheduledAt.setUTCHours(hh, mm, 0, 0);

      await prisma.booking.upsert({
        where: { requestId: id },
        update: {},
        create: {
          requestId: id,
          seekerId: updated.seekerId,
          aurorId: updated.aurorId,
          availabilitySlotId: updated.availabilitySlotId,
          status: "scheduled",
          sessionType: updated.sessionType,
          duration: updated.duration,
          scheduledAt,
          meetingLink: generateMeetingLink(),
        },
      });
    }

    // ── Notifications + email ─────────────────────────────────────────────────
    const aurorProfile = await prisma.profile.findUnique({ where: { userId: aurorId } });
    const aurorName    = aurorProfile?.name ?? "Your Auror";

    if (newStatus === "accepted") {
      await createNotification(
        req.seekerId,
        "Request accepted 🎉",
        `${aurorName} accepted your request. Your session is confirmed.`,
        "REQUEST_ACCEPTED"
      );
      const seeker = await prisma.user.findUnique({ where: { id: req.seekerId } });
      sendEmail(
        seeker?.email,
        "Your session request was accepted",
        `<p>Great news! <strong>${aurorName}</strong> accepted your session request.</p>
         <p>Log in to CoffeeChat to view your upcoming session.</p>`
      ).catch(() => {});
    }

    if (newStatus === "rejected") {
      await createNotification(
        req.seekerId,
        "Request not accepted",
        `${aurorName} was unable to accept your request this time.`,
        "REQUEST_REJECTED"
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[request PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
