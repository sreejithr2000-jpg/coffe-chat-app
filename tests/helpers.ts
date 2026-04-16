/**
 * Shared test helpers.
 *
 * Design principles:
 * - All helpers talk to Prisma directly (bypass API validation) so tests can
 *   set up state quickly and precisely.
 * - Every test run uses a globally unique prefix so parallel/sequential runs
 *   never collide on email uniqueness.
 * - Cleanup is via prisma.user.deleteMany with cascade — deleting a user
 *   cascades to profile, slots, requests, and bookings.
 */

import { prisma } from "@/lib/prisma";

// ── ID generation ─────────────────────────────────────────────────────────────

/** Returns a unique string safe to embed in email addresses. */
export function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── User / profile ─────────────────────────────────────────────────────────────

export async function createMockUser(
  role: "SEEKER" | "AUROR",
  prefix: string
) {
  return prisma.user.create({
    data: {
      email: `${prefix}_${role.toLowerCase()}@coffeetest.dev`,
      role,
      profile: {
        create: {
          name: role === "SEEKER" ? `Seeker ${prefix}` : `Auror ${prefix}`,
          headline: `Test ${role.toLowerCase()} for ${prefix}`,
          skills: [],
          domains: [],
          targetRoles: [],
          sessionTypes: [],
          sessionTags: [],
          secondaryTracks: [],
        },
      },
    },
  });
}

// ── Availability slot ──────────────────────────────────────────────────────────

export async function createAvailabilitySlot(aurorId: string) {
  // Use next Monday as a stable test date within the booking window
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7; // next Monday
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);

  const validTo = new Date(date);
  validTo.setUTCHours(23, 59, 59, 999);

  return prisma.availabilitySlot.create({
    data: {
      userId: aurorId,
      date,
      startTime: "10:00",
      endTime: "11:00",
      validTo,
    },
  });
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Creates a pending request via Prisma (bypasses API limit checks). */
export async function createRequest(
  seekerId: string,
  aurorId: string,
  slotId: string,
  overrides: { createdAt?: Date; status?: string } = {}
) {
  return prisma.request.create({
    data: {
      seekerId,
      aurorId,
      availabilitySlotId: slotId,
      status: overrides.status ?? "pending",
      questions: ["What is your background?", "What are you hoping to learn?", "Any specific topics?"],
      expiresAt: new Date(Date.now() + 48 * 3_600_000),
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    },
  });
}

/** Creates N pending requests for the same seeker/auror/slot (direct Prisma). */
export async function createManyRequests(
  n: number,
  seekerId: string,
  aurorId: string,
  slotId: string,
  createdAt?: Date
) {
  await prisma.request.createMany({
    data: Array.from({ length: n }, () => ({
      seekerId,
      aurorId,
      availabilitySlotId: slotId,
      status: "pending",
      questions: ["Q1", "Q2", "Q3"],
      expiresAt: new Date(Date.now() + 48 * 3_600_000),
      ...(createdAt ? { createdAt } : {}),
    })),
  });
}

// ── Booking ────────────────────────────────────────────────────────────────────

/**
 * Accepts a request and creates the linked booking (mirrors the PATCH route
 * handler logic without going through HTTP).
 */
export async function acceptRequest(requestId: string) {
  const req = await prisma.request.update({
    where: { id: requestId },
    data: { status: "accepted" },
    include: { availabilitySlot: true },
  });

  // Derive scheduledAt from the slot's specific date + start time
  const [hh, mm] = req.availabilitySlot.startTime.split(":").map(Number);
  const scheduledAt = new Date(req.availabilitySlot.date);
  scheduledAt.setUTCHours(hh, mm, 0, 0);

  const booking = await prisma.booking.upsert({
    where: { requestId },
    update: {},
    create: {
      requestId,
      seekerId: req.seekerId,
      aurorId: req.aurorId,
      availabilitySlotId: req.availabilitySlotId,
      status: "scheduled",
      sessionType: req.sessionType,
      duration: req.duration,
      scheduledAt,
    },
  });

  return { request: req, booking };
}

/**
 * Creates a booking that appears COMPLETED in the PREVIOUS week.
 *
 * Prisma's @updatedAt cannot be overridden via the client, so we:
 * 1. Create the request + booking normally.
 * 2. Use a raw SQL UPDATE to back-date `updatedAt` and set status = 'completed'.
 *
 * The `checkRequestLimit` bonus query counts bookings WHERE
 * status = 'completed' AND updatedAt IN previous-week window.
 */
export async function createCompletedBookingPreviousWeek(
  seekerId: string,
  aurorId: string,
  slotId: string
) {
  // Date 8 days ago is always in the previous Mon–Sun week
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 8);

  // Request must also be from last week so it doesn't inflate THIS week's count
  const request = await createRequest(seekerId, aurorId, slotId, {
    createdAt: lastWeek,
    status: "accepted",
  });

  const scheduledAt = new Date(lastWeek);
  const booking = await prisma.booking.create({
    data: {
      requestId: request.id,
      seekerId,
      aurorId,
      availabilitySlotId: slotId,
      status: "scheduled",
      scheduledAt,
      createdAt: lastWeek,
    },
  });

  // Back-date updatedAt and mark completed via raw SQL
  await prisma.$executeRaw`
    UPDATE bookings
    SET status = 'completed', "updatedAt" = ${lastWeek}
    WHERE id = ${booking.id}
  `;

  return { request, booking };
}

// ── Cleanup ────────────────────────────────────────────────────────────────────

/**
 * Delete test users by ID. All child records cascade automatically:
 *   User → Profile, AvailabilitySlot, Request, Booking
 */
export async function cleanup(userIds: string[]) {
  if (userIds.length === 0) return;
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
