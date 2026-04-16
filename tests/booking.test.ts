/**
 * Integration tests — Booking creation
 *
 * Test 4: Accepting a request via the PATCH route handler must create a
 * linked Booking with status="scheduled" and the correct requestId.
 *
 * We import the route handler directly and call it with a NextRequest object
 * (available natively in Node 18+) rather than spinning up an HTTP server.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/request/[id]/route";
import {
  uid,
  createMockUser,
  createAvailabilitySlot,
  createRequest,
  cleanup,
} from "./helpers";

// ── Scaffold ──────────────────────────────────────────────────────────────────

let seekerId: string;
let aurorId: string;
let slotId: string;
let userIds: string[];

beforeAll(async () => {
  const prefix = uid();
  const seeker = await createMockUser("SEEKER", prefix);
  const auror = await createMockUser("AUROR", prefix);
  const slot = await createAvailabilitySlot(auror.id);
  seekerId = seeker.id;
  aurorId = auror.id;
  slotId = slot.id;
  userIds = [seeker.id, auror.id];
});

afterAll(async () => {
  await cleanup(userIds);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Call the PATCH /api/request/[id] handler with the given action. */
async function patchRequest(requestId: string, action: "accept" | "reject") {
  const req = new NextRequest(
    `http://localhost/api/request/${requestId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, aurorId }),
    }
  );
  return PATCH(req, { params: Promise.resolve({ id: requestId }) });
}

// ── Test 4: Booking creation ──────────────────────────────────────────────────

describe("Booking creation after request acceptance", () => {
  it("creates a Booking when a request is accepted", async () => {
    const request = await createRequest(seekerId, aurorId, slotId);

    const res = await patchRequest(request.id, "accept");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("accepted");

    // Booking must exist and be linked
    const booking = await prisma.booking.findUnique({
      where: { requestId: request.id },
    });
    expect(booking).not.toBeNull();
    expect(booking!.status).toBe("scheduled");
    expect(booking!.seekerId).toBe(seekerId);
    expect(booking!.aurorId).toBe(aurorId);
    expect(booking!.availabilitySlotId).toBe(slotId);
    expect(booking!.scheduledAt).toBeInstanceOf(Date);
  });

  it("does NOT create a Booking when a request is rejected", async () => {
    const request = await createRequest(seekerId, aurorId, slotId);

    const res = await patchRequest(request.id, "reject");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("rejected");

    // No booking should exist
    const booking = await prisma.booking.findUnique({
      where: { requestId: request.id },
    });
    expect(booking).toBeNull();
  });

  it("is idempotent — accepting the same request twice does not duplicate the booking", async () => {
    const request = await createRequest(seekerId, aurorId, slotId);
    await patchRequest(request.id, "accept");

    // Second accept should fail because status is no longer 'pending'
    const secondRes = await patchRequest(request.id, "accept");
    expect(secondRes.status).toBe(409);

    // Still only one booking
    const bookings = await prisma.booking.findMany({
      where: { requestId: request.id },
    });
    expect(bookings).toHaveLength(1);
  });

  it("blocks action on an expired request", async () => {
    // Create a request that is already past its expiry
    const expiredRequest = await prisma.request.create({
      data: {
        seekerId,
        aurorId,
        availabilitySlotId: slotId,
        status: "pending",
        questions: ["Q1", "Q2", "Q3"],
        expiresAt: new Date(Date.now() - 1_000), // already expired
      },
    });

    const res = await patchRequest(expiredRequest.id, "accept");
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toMatch(/expired/i);

    // Status should have been persisted as 'expired'
    const updated = await prisma.request.findUnique({
      where: { id: expiredRequest.id },
    });
    expect(updated!.status).toBe("expired");
  });
});
