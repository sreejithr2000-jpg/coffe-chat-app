/**
 * Integration tests — Auror visibility
 *
 * Test 5: GET /api/requests/auror/[userId] returns the Auror's incoming
 *         requests with seeker profile and slot data included.
 *
 * Test 6: GET /api/bookings/auror/[userId] returns only scheduled bookings
 *         for the Auror with seeker profile data included.
 */

import { NextRequest } from "next/server";
import { GET as getAurorRequests } from "@/app/api/requests/auror/[userId]/route";
import { GET as getAurorBookings } from "@/app/api/bookings/auror/[userId]/route";
import {
  uid,
  createMockUser,
  createAvailabilitySlot,
  createRequest,
  acceptRequest,
  cleanup,
} from "./helpers";

// ── Scaffold ──────────────────────────────────────────────────────────────────

let seekerId: string;
let aurorId: string;
let slotId: string;
let seekerName: string;
let userIds: string[];

beforeAll(async () => {
  const prefix = uid();
  const seeker = await createMockUser("SEEKER", prefix);
  const auror = await createMockUser("AUROR", prefix);
  const slot = await createAvailabilitySlot(auror.id);

  seekerId = seeker.id;
  aurorId = auror.id;
  slotId = slot.id;
  seekerName = `Seeker ${prefix}`; // matches what createMockUser creates
  userIds = [seeker.id, auror.id];
});

afterAll(async () => {
  await cleanup(userIds);
});

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchAurorRequests(userId: string) {
  const req = new NextRequest(
    `http://localhost/api/requests/auror/${userId}`
  );
  const res = await getAurorRequests(req, {
    params: Promise.resolve({ userId }),
  });
  return res.json();
}

async function fetchAurorBookings(userId: string) {
  const req = new NextRequest(
    `http://localhost/api/bookings/auror/${userId}`
  );
  const res = await getAurorBookings(req, {
    params: Promise.resolve({ userId }),
  });
  return res.json();
}

// ── Test 5: Auror request visibility ─────────────────────────────────────────

describe("Auror request visibility", () => {
  it("returns requests where aurorId matches", async () => {
    const request = await createRequest(seekerId, aurorId, slotId);

    const data = await fetchAurorRequests(aurorId);

    expect(Array.isArray(data)).toBe(true);
    const match = data.find((r: { id: string }) => r.id === request.id);
    expect(match).toBeDefined();
  });

  it("includes seeker profile in each request", async () => {
    const data = await fetchAurorRequests(aurorId);

    // Every request in the response must carry a seeker profile
    for (const r of data) {
      expect(r).toHaveProperty("seeker");
      // seeker.profile may be null if no profile exists — but we created one
      if (r.seekerId === seekerId) {
        expect(r.seeker?.profile?.name).toBe(seekerName);
      }
    }
  });

  it("includes availability slot details in each request", async () => {
    const data = await fetchAurorRequests(aurorId);

    for (const r of data) {
      expect(r).toHaveProperty("availabilitySlot");
      expect(r.availabilitySlot).toHaveProperty("dayOfWeek");
      expect(r.availabilitySlot).toHaveProperty("startTime");
      expect(r.availabilitySlot).toHaveProperty("endTime");
    }
  });

  it("does NOT return requests belonging to a different Auror", async () => {
    // Create an entirely separate auror
    const prefix2 = uid();
    const otherAuror = await createMockUser("AUROR", prefix2);
    const otherSlot = await createAvailabilitySlot(otherAuror.id);
    const otherRequest = await createRequest(seekerId, otherAuror.id, otherSlot.id);

    try {
      const data = await fetchAurorRequests(aurorId);
      const shouldNotAppear = data.find(
        (r: { id: string }) => r.id === otherRequest.id
      );
      expect(shouldNotAppear).toBeUndefined();
    } finally {
      await cleanup([otherAuror.id]);
    }
  });

  it("auto-expires pending requests past their deadline", async () => {
    const { prisma } = await import("@/lib/prisma");

    const expiredReq = await prisma.request.create({
      data: {
        seekerId,
        aurorId,
        availabilitySlotId: slotId,
        status: "pending",
        questions: ["Q1", "Q2", "Q3"],
        expiresAt: new Date(Date.now() - 1_000), // already past
      },
    });

    const data = await fetchAurorRequests(aurorId);
    const found = data.find((r: { id: string }) => r.id === expiredReq.id);

    expect(found).toBeDefined();
    expect(found.status).toBe("expired");

    // Confirm persisted in DB
    const fromDb = await prisma.request.findUnique({
      where: { id: expiredReq.id },
    });
    expect(fromDb!.status).toBe("expired");
  });
});

// ── Test 6: Auror booking visibility ─────────────────────────────────────────

describe("Auror booking visibility", () => {
  it("returns scheduled bookings for the Auror", async () => {
    const request = await createRequest(seekerId, aurorId, slotId);
    const { booking } = await acceptRequest(request.id);

    const data = await fetchAurorBookings(aurorId);

    expect(Array.isArray(data)).toBe(true);
    const match = data.find((b: { id: string }) => b.id === booking.id);
    expect(match).toBeDefined();
    expect(match.status).toBe("scheduled");
  });

  it("includes seeker profile in each booking", async () => {
    const data = await fetchAurorBookings(aurorId);

    for (const b of data) {
      expect(b).toHaveProperty("seeker");
      if (b.seekerId === seekerId) {
        expect(b.seeker?.profile?.name).toBe(seekerName);
      }
    }
  });

  it("includes availability slot details in each booking", async () => {
    const data = await fetchAurorBookings(aurorId);

    for (const b of data) {
      expect(b).toHaveProperty("availabilitySlot");
      expect(b.availabilitySlot).toHaveProperty("dayOfWeek");
      expect(b.availabilitySlot).toHaveProperty("startTime");
      expect(b.availabilitySlot).toHaveProperty("endTime");
    }
  });

  it("only returns scheduled bookings (not completed or cancelled)", async () => {
    // Mark all current bookings as completed via direct Prisma
    const { prisma } = await import("@/lib/prisma");
    await prisma.booking.updateMany({
      where: { aurorId, status: "scheduled" },
      data: { status: "completed" },
    });

    const data = await fetchAurorBookings(aurorId);

    // The endpoint filters to status="scheduled", so result must be empty (or
    // contain only newly created scheduled bookings — none exist after the updateMany)
    const scheduledCount = data.filter(
      (b: { status: string }) => b.status !== "scheduled"
    ).length;
    expect(scheduledCount).toBe(0);
  });

  it("does NOT return bookings belonging to a different Auror", async () => {
    // Create a fresh auror + request + booking
    const prefix2 = uid();
    const otherAuror = await createMockUser("AUROR", prefix2);
    const otherSlot = await createAvailabilitySlot(otherAuror.id);
    const otherRequest = await createRequest(seekerId, otherAuror.id, otherSlot.id);
    const { booking: otherBooking } = await acceptRequest(otherRequest.id);

    try {
      const data = await fetchAurorBookings(aurorId);
      const shouldNotAppear = data.find(
        (b: { id: string }) => b.id === otherBooking.id
      );
      expect(shouldNotAppear).toBeUndefined();
    } finally {
      await cleanup([otherAuror.id]);
    }
  });
});
