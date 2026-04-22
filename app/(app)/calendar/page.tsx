"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { buildAddToGCalUrl } from "@/lib/googleCalendar";
import { isValidMeetingUrl } from "@/lib/meeting";
import type { BookingWithDetails, UserRole } from "@/types";

// ── Date helpers ───────────────────────────────────────────────────────────────

function getMondayOf(d: Date): Date {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtWeekRange(monday: Date) {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", opts)}`;
}

function scheduledAt(bk: BookingWithDetails): Date {
  const slot = bk.availabilitySlot;
  const [h, m] = slot.startTime.split(":").map(Number);
  const d = new Date(slot.date);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function scheduledEnd(bk: BookingWithDetails): Date {
  const slot = bk.availabilitySlot;
  const [h, m] = slot.endTime.split(":").map(Number);
  const d = new Date(slot.date);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function addToGCalUrl(bk: BookingWithDetails, perspective: UserRole): string {
  const start = scheduledAt(bk);
  const end   = scheduledEnd(bk);
  const other = perspective === "SEEKER"
    ? (bk.auror?.profile?.name  ?? "Auror")
    : (bk.seeker?.profile?.name ?? "Seeker");
  const type  = bk.sessionType === "coffee" ? "Coffee Chat" : "Mock Interview";
  return buildAddToGCalUrl({
    title:    `${type} with ${other}`,
    startTime: start,
    endTime:   end,
    details:   bk.meetingLink ? `Join: ${bk.meetingLink}` : "CoffeeChat session",
    location:  bk.meetingLink ?? undefined,
  });
}

// ── Grid session pill (compact — info only, no action buttons) ─────────────────

function SessionPill({
  booking,
  perspective,
}: {
  booking: BookingWithDetails;
  perspective: UserRole;
}) {
  const start = scheduledAt(booking);
  const other = perspective === "SEEKER"
    ? (booking.auror?.profile?.name  ?? "Auror")
    : (booking.seeker?.profile?.name ?? "Seeker");
  const isUpcoming  = booking.status === "scheduled";
  const isCompleted = booking.status === "completed";

  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1.5 text-left",
        isUpcoming  ? "border-primary-200 bg-primary-50/60" :
        isCompleted ? "border-neutral-200 bg-neutral-50" :
                      "border-neutral-100 bg-neutral-50 opacity-50"
      )}
    >
      <p className="truncate text-[10px] font-semibold leading-tight text-neutral-900">
        {booking.sessionType === "coffee" ? "☕" : "🎯"} {other}
      </p>
      <p className="mt-0.5 text-[10px] leading-tight text-neutral-400">
        {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
      </p>
    </div>
  );
}

// ── Upcoming session row (full width, all actions) ─────────────────────────────

function SessionRow({
  booking,
  perspective,
}: {
  booking: BookingWithDetails;
  perspective: UserRole;
}) {
  const other = perspective === "SEEKER"
    ? (booking.auror?.profile?.name  ?? "Auror")
    : (booking.seeker?.profile?.name ?? "Seeker");
  const type  = booking.sessionType === "coffee" ? "☕ Coffee Chat" : "🎯 Mock Interview";
  const hasLink = isValidMeetingUrl(booking.meetingLink);

  return (
    <Card padding="md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Info */}
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-neutral-900">
            {type}{" "}
            <span className="font-normal text-neutral-500">with</span>{" "}
            {other}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-400">
            {fmtDay(new Date(booking.availabilitySlot.date))}
            {" · "}
            {booking.availabilitySlot.startTime}–{booking.availabilitySlot.endTime} UTC
            {" · "}{booking.duration} min
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {hasLink ? (
            <a
              href={booking.meetingLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-700 active:scale-95"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 6l3-2v6l-3-2V6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              Join Meeting
            </a>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-2 text-[13px] text-neutral-400">
              Link pending
            </span>
          )}

          <a
            href={addToGCalUrl(booking, perspective)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-95"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4 1v2M10 1v2M1 5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Add to Calendar
          </a>

          <a
            href={`/api/calendar/ics/${booking.id}`}
            title="Download .ics file"
            className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-50 active:scale-95"
          >
            .ics
          </a>
        </div>
      </div>
    </Card>
  );
}

// ── Google icon ────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M43.6 20.5H24v7h11.2C33.7 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.2-5.2C33.3 7.4 28.9 5.5 24 5.5 13.8 5.5 5.5 13.8 5.5 24S13.8 42.5 24 42.5c10.5 0 17.9-7.3 17.9-17.6 0-1.2-.1-2.3-.3-3.4z"/>
      <path fill="#34A853" d="M6.3 14.7l6.1 4.5C13.9 15.1 18.6 12 24 12c2.8 0 5.3 1 7.2 2.7l5.2-5.2C33.3 6.4 28.9 4.5 24 4.5 16.3 4.5 9.6 8.7 6.3 14.7z"/>
      <path fill="#FBBC05" d="M24 43.5c4.8 0 9.1-1.6 12.4-4.4l-5.7-4.8C28.9 35.8 26.6 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.3l-6.1 4.7C9.8 39.3 16.4 43.5 24 43.5z"/>
      <path fill="#EA4335" d="M43.6 20.5H24v7h11.2c-.8 2.3-2.5 4.2-4.7 5.5l5.7 4.8c3.4-3.1 5.3-7.7 5.3-12.8 0-1.2-.1-2.3-.3-3.4-.2-.7-.4-1.4-.6-2.1z"/>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface GoogleStatus {
  configured: boolean;
  connected:  boolean;
  expired:    boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const [userId, setUserId]       = useState<string | null>(null);
  const [role, setRole]           = useState<UserRole | null>(null);
  const [bookings, setBookings]   = useState<BookingWithDetails[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { router.replace("/login"); return; }
    setUserId(id);

    Promise.all([
      fetch(`/api/users/${id}`).then((r) => r.json()),
      fetch(`/api/auth/google/status/${id}`).then((r) => r.json() as Promise<GoogleStatus>),
    ])
      .then(([user, gStatus]) => {
        setRole(user.role);
        setGoogleStatus(gStatus);
        const endpoint = user.role === "SEEKER"
          ? `/api/bookings/seeker/${id}`
          : `/api/bookings/auror/${id}`;
        return fetch(endpoint).then((r) => r.json());
      })
      .then((data) => {
        const bks = Array.isArray(data) ? data : (data.bookings ?? []);
        setBookings(bks);
        setLoadState("ready");
      })
      .catch(() => setLoadState("ready"));
  }, [router]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const upcomingSessions = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "scheduled")
        .sort((a, b) => scheduledAt(a).getTime() - scheduledAt(b).getTime()),
    [bookings]
  );

  function bookingsForDay(day: Date) {
    return bookings
      .filter((bk) => isSameDay(new Date(bk.availabilitySlot.date), day))
      .sort((a, b) => scheduledAt(a).getTime() - scheduledAt(b).getTime());
  }

  const today = new Date();

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Calendar</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{fmtWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50"
            aria-label="Previous week"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => setWeekStart(getMondayOf(new Date()))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50"
            aria-label="Next week"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Google banners */}
      {googleStatus?.configured && !googleStatus.connected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GoogleIcon />
            <div>
              <p className="text-[13px] font-semibold text-primary-800">Connect Google Calendar</p>
              <p className="text-[11px] text-primary-600">Sync sessions and get Google Meet links automatically.</p>
            </div>
          </div>
          <button
            onClick={() => userId && (window.location.href = `/api/auth/google/authorize?userId=${userId}`)}
            className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Connect Google
          </button>
        </div>
      )}
      {googleStatus?.connected && !googleStatus.expired && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          <p className="text-[12px] font-medium text-emerald-700">Google Calendar connected — sessions sync automatically</p>
          <Link href="/settings" className="ml-auto shrink-0 text-[11px] text-emerald-600 hover:underline">Manage</Link>
        </div>
      )}
      {googleStatus?.connected && googleStatus.expired && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-[12px] font-medium text-amber-700">Google Calendar token expired</p>
          <button
            onClick={() => userId && (window.location.href = `/api/auth/google/authorize?userId=${userId}`)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-700 transition-colors hover:bg-amber-50"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Week grid — desktop/tablet only (hidden on mobile, sessions shown in list below) */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const dayBookings = bookingsForDay(day);
            const isToday     = isSameDay(day, today);
            const isPast      = day < today && !isToday;

            return (
              <div key={day.toISOString()} className="flex min-w-0 flex-col gap-1.5">
                {/* Day header */}
                <div className={cn(
                  "rounded-lg px-1 py-1.5 text-center",
                  isToday ? "bg-primary-600" : "bg-neutral-50"
                )}>
                  <p className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isToday ? "text-primary-100" : "text-neutral-400"
                  )}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className={cn(
                    "text-[15px] font-bold",
                    isToday ? "text-white" : isPast ? "text-neutral-300" : "text-neutral-800"
                  )}>
                    {day.getDate()}
                  </p>
                </div>

                {/* Session pills — info only, no action buttons */}
                <div className="flex flex-col gap-1">
                  {dayBookings.map((bk) => (
                    <SessionPill key={bk.id} booking={bk} perspective={role ?? "SEEKER"} />
                  ))}
                  {dayBookings.length === 0 && (
                    <div className={cn(
                      "rounded-lg py-3 text-center text-[10px]",
                      isPast ? "text-neutral-200" : "text-neutral-300"
                    )}>
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming sessions — full-width list (primary on mobile, supplemental on desktop) */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Upcoming sessions
        </p>
        {upcomingSessions.length === 0 ? (
          <Card padding="md" className="text-center">
            <p className="text-sm text-neutral-400">No upcoming sessions.</p>
            <p className="mt-1 text-[12px] text-neutral-400">
              <Link href="/aurors" className="text-primary-600 hover:underline">Browse Aurors</Link>
              {" "}to book a session.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingSessions.map((bk) => (
              <SessionRow key={bk.id} booking={bk} perspective={role ?? "SEEKER"} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
