// ---------------------------------------------------------------------------
// Availability helpers — date-based slot system
// ---------------------------------------------------------------------------

/** "18:00" → "6:00 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * "Mon, Jan 15" — always formats in UTC to avoid timezone drift
 * (slots are stored as UTC midnight dates).
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "Mon, Jan 15 · 6:00 PM – 8:00 PM" */
export function formatSlotDate(slot: {
  date: string | Date;
  startTime: string;
  endTime: string;
}): string {
  return `${formatDate(slot.date)} · ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
}

/** Slot duration in minutes */
export function slotMinutes(slot: { startTime: string; endTime: string }): number {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * Booking window: Monday of current week → Sunday of next week (inclusive).
 * All comparisons use UTC to match how slot dates are stored.
 */
export function getBookingWindow(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  // Rewind to Monday (getUTCDay: 0=Sun…6=Sat → (day+6)%7 gives Mon=0)
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 14); // +14 days = end of next week
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/** Returns the "YYYY-MM-DD" string for the end of next week (for date input max). */
export function bookingWindowMaxDate(): string {
  const { end } = getBookingWindow();
  // Format as YYYY-MM-DD in UTC
  return end.toISOString().split("T")[0];
}

/** "This Week" | "Next Week" | null — uses UTC to match stored dates */
export function weekLabel(date: string | Date): "This Week" | "Next Week" | null {
  const d = new Date(date);

  const now = new Date();
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));

  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  const nextSunday = new Date(nextMonday);
  nextSunday.setUTCDate(nextMonday.getUTCDate() + 7);

  if (d >= monday && d < nextMonday) return "This Week";
  if (d >= nextMonday && d < nextSunday) return "Next Week";
  return null;
}

/**
 * Duration options per session type.
 * Coffee Chat: quick conversations. Mock Interview: structured practice.
 */
export const DURATION_OPTIONS = {
  coffee: [10, 15, 20, 30],
  mock: [30, 45, 60],
} as const;

/**
 * Returns true if [startTime, endTime) overlaps any slot in the list.
 * Caller pre-filters the list to the same date.
 * Comparison is lexicographic on "HH:MM" strings (safe for 24hr format).
 */
export function hasOverlap(
  slots: { id: string; startTime: string; endTime: string }[],
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  return slots
    .filter((s) => s.id !== excludeId)
    .some((s) => startTime < s.endTime && endTime > s.startTime);
}
