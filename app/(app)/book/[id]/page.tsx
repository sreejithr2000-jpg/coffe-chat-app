"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { useToast } from "@/lib/toast-context";
import { BackButton } from "@/components/BackButton";
import {
  formatSlotDate,
  weekLabel,
  slotMinutes,
  DURATION_OPTIONS,
} from "@/lib/availability";
import { cn } from "@/lib/utils";
import type { User, EnrichedSlot } from "@/types";

interface AurorStats {
  rating: number | null;
  reviewCount: number;
  completedSessions: number;
}

const MIN_QUESTIONS = 3;

// ── Slot status config ────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  available: {
    dot:    "bg-emerald-400",
    badge:  "border-emerald-200 bg-emerald-50 text-emerald-700",
    label:  "Available",
    row:    "border-neutral-100 bg-white shadow-soft",
    dim:    false,
  },
  pending: {
    dot:    "bg-amber-400",
    badge:  "border-amber-200 bg-amber-50 text-amber-700",
    label:  "Pending",
    row:    "border-amber-100 bg-amber-50/40",
    dim:    true,
  },
  accepted: {
    dot:    "bg-neutral-300",
    badge:  "border-neutral-200 bg-neutral-100 text-neutral-400",
    label:  "Booked",
    row:    "border-neutral-100 bg-neutral-50",
    dim:    true,
  },
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const router  = useRouter();
  const { show: showToast } = useToast();
  const params  = useParams<{ id: string }>();
  const aurorId = params.id;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [auror, setAuror] = useState<User | null>(null);
  const [stats, setStats] = useState<AurorStats | null>(null);
  const [slots, setSlots] = useState<EnrichedSlot[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "no-access">("loading");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [successSlotId, setSuccessSlotId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate]   = useState<string | null>(null); // "YYYY-MM-DD"

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { router.push("/login"); return; }
    setCurrentUserId(userId);

    Promise.all([
      fetch(`/api/users/${aurorId}`).then((r) => r.json() as Promise<User>),
      fetch(`/api/availability/${aurorId}?seekerId=${userId}`).then((r) => r.json() as Promise<EnrichedSlot[]>),
      fetch(`/api/users/${userId}`).then((r) => r.json() as Promise<User>),
      fetch(`/api/aurors/${aurorId}`).then((r) => r.json() as Promise<AurorStats>),
    ])
      .then(([aurorData, slotsData, userData, statsData]) => {
        if (userData.role !== "SEEKER") { setLoadState("no-access"); return; }
        setAuror(aurorData);
        setSlots(Array.isArray(slotsData) ? slotsData : []);
        setStats(statsData);
        setLoadState("ready");
      })
      .catch(() => setLoadState("ready"));
  }, [aurorId, router]);

  function toggleSlot(slotId: string) {
    setSelectedSlotId((prev) => (prev === slotId ? null : slotId));
  }

  async function handleSubmit(
    slot: EnrichedSlot,
    data: { sessionType: "coffee" | "mock"; duration: number; questions: string[] }
  ): Promise<void> {
    if (!currentUserId) throw new Error("Not logged in");

    const res = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seekerId: currentUserId,
        aurorId,
        availabilitySlotId: slot.id,
        ...data,
      }),
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(responseData.error ?? "Failed to send request");

    setSuccessSlotId(slot.id);
    setSelectedSlotId(null);
    showToast("Request sent!");
    router.push(`/booking/confirmed/${responseData.id}`);
  }

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (loadState === "no-access") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card padding="lg" className="w-full max-w-sm text-center">
          <p className="text-sm text-neutral-500">Only Seekers can book sessions.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!auror) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card padding="lg" className="text-center">
          <p className="text-sm text-neutral-500">Auror not found.</p>
          <div className="mt-4 flex justify-center">
            <BackButton fallback="/aurors" label="Back to Aurors" />
          </div>
        </Card>
      </div>
    );
  }

  const profile = auror.profile;

  // Filter to future slots only (keep all statuses — pending/accepted show as busy)
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const futureSlots = slots.filter((s) => new Date(s.date) >= todayUTC);

  // Calendar filter: when a date is selected, show only that date's slots
  const visibleSlots = selectedDate
    ? futureSlots.filter((s) => {
        const d = new Date(s.date);
        return d.toISOString().slice(0, 10) === selectedDate;
      })
    : futureSlots;

  const thisWeekSlots = visibleSlots.filter((s) => weekLabel(s.date) === "This Week");
  const nextWeekSlots = visibleSlots.filter((s) => weekLabel(s.date) === "Next Week");

  const sessionLabels = (profile?.sessionTypes ?? []).map((t) =>
    t === "coffee_chat" ? "Coffee" : "Mock"
  );

  const busyCount = futureSlots.filter((s) => s.slotStatus !== "available").length;
  const availableCount = futureSlots.filter((s) => s.slotStatus === "available").length;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">

      {/* Nav */}
      <div className="flex items-center justify-between">
        <BackButton fallback={`/auror/${aurorId}`} label="Back to Profile" />
        <Link href={`/auror/${aurorId}`} className="text-[12px] text-neutral-400 hover:text-neutral-600">
          View full profile
        </Link>
      </div>

      {/* ── Auror summary ─────────────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700">
            {profile?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-neutral-900 leading-tight">
              {profile?.name ?? "Unnamed"}
            </p>
            {profile?.currentRole && (
              <p className="mt-0.5 text-[12px] text-neutral-500 leading-tight">
                {profile.currentRole}
                {(profile.totalExperience ?? 0) > 0 && (
                  <span className="text-neutral-400"> · {profile.totalExperience} yrs</span>
                )}
              </p>
            )}
            {profile?.overview && (
              <p className="mt-1 line-clamp-1 text-[12px] text-neutral-400">
                {profile.overview}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 pl-2">
            {stats?.rating !== null && stats?.rating !== undefined ? (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-amber-400">★</span>
                <span className="text-[12px] font-semibold text-neutral-800">{stats.rating}</span>
                {stats.reviewCount > 0 && (
                  <span className="text-[11px] text-neutral-400">({stats.reviewCount})</span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-neutral-300">No reviews</span>
            )}
            {stats && stats.completedSessions > 0 && (
              <span className="text-[11px] text-neutral-500">
                {stats.completedSessions} session{stats.completedSessions === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {sessionLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-neutral-100 pt-3">
            {sessionLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-500"
              >
                {label === "Coffee" ? "☕" : "🎯"} {label === "Coffee" ? "Coffee Chat" : "Mock Interview"}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* ── Availability status banner ─────────────────────────────────────────── */}
      {futureSlots.length > 0 && busyCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-amber-500" aria-hidden="true">
            <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M7 5.5v3M7 10h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <p className="text-[12px] text-amber-700">
            {availableCount > 0
              ? `${availableCount} slot${availableCount === 1 ? "" : "s"} available · ${busyCount} already requested or booked`
              : `All slots are currently requested or booked. Check back when new slots open.`}
          </p>
        </div>
      )}

      {/* ── Mini calendar date picker ─────────────────────────────────────────── */}
      {futureSlots.length > 0 && (
        <MiniCalendar
          slots={futureSlots}
          selectedDate={selectedDate}
          onSelect={(d) => {
            setSelectedDate((prev) => (prev === d ? null : d));
            setSelectedSlotId(null);
          }}
        />
      )}

      {/* ── Slots — SHOWN FIRST, always visible with status ────────────────────── */}
      {futureSlots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center">
          <p className="text-sm font-medium text-neutral-400">No availability set</p>
          <p className="mt-1 text-[12px] text-neutral-400">
            This Auror hasn&apos;t added any slots for the next two weeks.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {thisWeekSlots.length > 0 && (
            <SlotWeekGroup
              label="This Week"
              slots={thisWeekSlots}
              selectedSlotId={selectedSlotId}
              successSlotId={successSlotId}
              aurorName={profile?.name ?? "Auror"}
              onToggle={toggleSlot}
              onSubmit={handleSubmit}
            />
          )}
          {nextWeekSlots.length > 0 && (
            <SlotWeekGroup
              label="Next Week"
              slots={nextWeekSlots}
              selectedSlotId={selectedSlotId}
              successSlotId={successSlotId}
              aurorName={profile?.name ?? "Auror"}
              onToggle={toggleSlot}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── MiniCalendar ──────────────────────────────────────────────────────────────
// Shows a month grid; highlights days with slots; click to filter.

function MiniCalendar({
  slots,
  selectedDate,
  onSelect,
}: {
  slots: EnrichedSlot[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    // Start on month containing the first future slot
    if (slots.length > 0) return new Date(slots[0].date);
    return new Date();
  });

  const year  = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth();

  // Build month grid
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay  = new Date(Date.UTC(year, month + 1, 0));
  // Day of week of first day (0=Sun → shift so Mon=0)
  const startOffset = (firstDay.getUTCDay() + 6) % 7;
  const totalCells  = startOffset + lastDay.getUTCDate();
  const rows        = Math.ceil(totalCells / 7);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getUTCDate() }, (_, i) => i + 1),
    ...Array(rows * 7 - totalCells).fill(null),
  ];

  // Build set of dates that have slots, with their worst status
  const slotDateMap = new Map<string, "available" | "pending" | "accepted">();
  for (const s of slots) {
    const key = s.date.slice(0, 10);
    const current = slotDateMap.get(key);
    if (!current || (s.slotStatus === "available" && current !== "available")) {
      slotDateMap.set(key, s.slotStatus);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  function cellDate(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      {/* Month nav */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(Date.UTC(year, month - 1, 1)))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Previous month"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[12px] font-semibold text-neutral-700">{monthLabel}</span>
        <button
          onClick={() => setViewDate(new Date(Date.UTC(year, month + 1, 1)))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Next month"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="text-[10px] font-semibold text-neutral-300">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const iso    = cellDate(day);
          const status = slotDateMap.get(iso);
          const isSelected = selectedDate === iso;
          const isToday    = iso === todayStr;

          return (
            <button
              key={iso}
              onClick={() => status && onSelect(iso)}
              disabled={!status}
              className={cn(
                "mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-lg text-[12px] font-medium transition-colors",
                isSelected
                  ? "bg-primary-600 text-white"
                  : isToday
                  ? "ring-1 ring-primary-300 text-primary-700"
                  : status
                  ? "text-neutral-800 hover:bg-neutral-100"
                  : "cursor-default text-neutral-300"
              )}
            >
              {day}
              {status && !isSelected && (
                <span className={cn(
                  "mt-0.5 h-1 w-1 rounded-full",
                  status === "available" ? "bg-emerald-400" :
                  status === "pending"   ? "bg-amber-400"   : "bg-neutral-300"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Clear filter */}
      {selectedDate && (
        <div className="mt-2 border-t border-neutral-100 pt-2 text-center">
          <button
            onClick={() => onSelect(selectedDate)}
            className="text-[11px] font-medium text-neutral-400 hover:text-neutral-600"
          >
            Clear date filter
          </button>
        </div>
      )}
    </div>
  );
}

// ── SlotWeekGroup ─────────────────────────────────────────────────────────────

function SlotWeekGroup({
  label,
  slots,
  selectedSlotId,
  successSlotId,
  aurorName,
  onToggle,
  onSubmit,
}: {
  label: string;
  slots: EnrichedSlot[];
  selectedSlotId: string | null;
  successSlotId: string | null;
  aurorName: string;
  onToggle: (id: string) => void;
  onSubmit: (slot: EnrichedSlot, data: { sessionType: "coffee" | "mock"; duration: number; questions: string[] }) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      {slots.map((slot) => {
        const cfg = STATUS_CONFIG[slot.slotStatus];
        const isSelected = selectedSlotId === slot.id;
        const isSuccess  = successSlotId === slot.id;
        const canSelect  = slot.slotStatus === "available" && !isSuccess;

        return (
          <div key={slot.id} className="flex flex-col">
            {/* ── Slot row ── */}
            <div
              className={cn(
                "flex items-center justify-between px-4 py-3 transition-colors",
                isSelected
                  ? "rounded-t-xl border border-b-0 border-primary-200 bg-primary-50/60"
                  : cn("rounded-xl border", cfg.row),
                cfg.dim && !isSelected && "opacity-70"
              )}
            >
              {/* Left: dot + datetime + status badge */}
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
                <span className={cn(
                  "text-[13px] font-medium",
                  slot.slotStatus === "available" ? "text-neutral-800" : "text-neutral-500"
                )}>
                  {formatSlotDate(slot)}
                </span>
                <span className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  cfg.badge
                )}>
                  {slot.isMyRequest && slot.slotStatus === "pending"
                    ? "Your request"
                    : cfg.label}
                </span>
              </div>

              {/* Right: action */}
              <div className="ml-3 shrink-0">
                {isSuccess ? (
                  <span className="text-[12px] font-medium text-emerald-600">Request sent ✓</span>
                ) : slot.slotStatus === "available" ? (
                  <button
                    onClick={() => onToggle(slot.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
                      isSelected
                        ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    )}
                  >
                    {isSelected ? "Cancel" : "Book this slot"}
                  </button>
                ) : slot.slotStatus === "pending" ? (
                  <span className="text-[12px] font-medium text-amber-600">
                    {slot.isMyRequest ? "Requested" : "Pending"}
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-neutral-400">Unavailable</span>
                )}
              </div>
            </div>

            {/* Helper text for seeker's own pending request */}
            {slot.slotStatus === "pending" && slot.isMyRequest && (
              <p className="rounded-b-xl border border-t-0 border-amber-100 bg-amber-50 px-4 py-2 text-[11px] text-amber-600">
                You already requested this slot. Withdraw your request from the dashboard if you&apos;d like to change it.
              </p>
            )}

            {/* Expanded booking form — only for available slots */}
            {canSelect && isSelected && (
              <RequestForm
                slot={slot}
                aurorName={aurorName}
                onSubmit={(data) => onSubmit(slot, data)}
                onCancel={() => onToggle(slot.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Suggestion chips ──────────────────────────────────────────────────────────

const COFFEE_SUGGESTIONS = [
  "How did you break into your current role?",
  "What does your typical day look like?",
  "What skills should I prioritize to land a similar role?",
  "What's the biggest mistake you see candidates make?",
  "How would you approach my job search if you were in my shoes?",
  "What would you have done differently early in your career?",
];

const MOCK_SUGGESTIONS = [
  "Can you run a behavioral round on leadership or conflict?",
  "Please give me a case study or product scenario.",
  "What are the most common mistakes you see in interviews for this role?",
  "Can you quiz me on system design fundamentals?",
  "Please evaluate my STAR stories for clarity and impact.",
  "What technical areas should I focus on for this type of role?",
];

// ── RequestForm ───────────────────────────────────────────────────────────────
// Self-contained: manages sessionType, duration, and questions internally.

function RequestForm({
  slot,
  aurorName,
  onSubmit,
  onCancel,
}: {
  slot: EnrichedSlot;
  aurorName: string;
  onSubmit: (data: { sessionType: "coffee" | "mock"; duration: number; questions: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [sessionType, setSessionType] = useState<"coffee" | "mock" | null>(null);
  const [duration, setDuration]       = useState<number | null>(null);
  const [questions, setQuestions]     = useState(["", "", ""]);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const slotMins   = slotMinutes(slot);
  const suggestions = sessionType === "coffee" ? COFFEE_SUGGESTIONS : MOCK_SUGGESTIONS;
  const filled      = questions.filter((q) => q.trim().length > 0).length;
  const ready       = sessionType !== null && duration !== null && filled >= MIN_QUESTIONS;

  function selectType(t: "coffee" | "mock") {
    setSessionType(t);
    setDuration(null);
    setError(null);
  }

  function applySuggestion(text: string) {
    const emptyIdx = questions.findIndex((q) => q.trim() === "");
    if (emptyIdx !== -1) {
      setQuestions((p) => p.map((v, i) => (i === emptyIdx ? text : v)));
    } else if (questions.length < 8) {
      setQuestions((p) => [...p, text]);
    }
  }

  async function handleSubmit() {
    if (!sessionType || !duration) return;
    const filledQs = questions.filter((q) => q.trim().length > 0);
    if (filledQs.length < MIN_QUESTIONS) {
      setError(`Please fill in at least ${MIN_QUESTIONS} questions.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ sessionType, duration, questions: filledQs });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-b-xl border border-t-0 border-primary-200 bg-white px-4 pb-4 pt-4">

      {/* Booking summary */}
      <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary-400">
          Booking Summary
        </p>
        <div className="flex flex-col gap-1">
          <SummaryRow label="With" value={aurorName} />
          <SummaryRow label="Slot" value={formatSlotDate(slot)} />
          {sessionType && <SummaryRow label="Type" value={sessionType === "coffee" ? "Coffee Chat" : "Mock Interview"} />}
          {duration    && <SummaryRow label="Duration" value={`${duration} min`} />}
        </div>
      </div>

      {/* Step 1: Session type */}
      <div className="mb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Session Type
        </p>
        <div className="flex gap-2">
          {(["coffee", "mock"] as const).map((t) => (
            <button
              key={t}
              onClick={() => selectType(t)}
              disabled={submitting}
              className={cn(
                "flex flex-1 flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50",
                sessionType === t
                  ? "border-primary-400 bg-primary-50"
                  : "border-neutral-200 bg-white hover:bg-neutral-50"
              )}
            >
              <span className={cn("text-[12px] font-semibold", sessionType === t ? "text-primary-700" : "text-neutral-700")}>
                {t === "coffee" ? "☕ Coffee Chat" : "🎯 Mock Interview"}
              </span>
              <span className="text-[11px] text-neutral-400">
                {t === "coffee" ? "Casual career conversation" : "Structured practice with feedback"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Duration */}
      {sessionType && (
        <div className="mb-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Duration
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS[sessionType].map((d) => {
              const fits = d <= slotMins;
              return (
                <button
                  key={d}
                  onClick={() => fits && !submitting && setDuration(d)}
                  disabled={!fits || submitting}
                  className={cn(
                    "rounded-lg border px-4 py-1.5 text-[12px] font-medium transition-colors",
                    duration === d
                      ? "border-primary-400 bg-primary-50 text-primary-700"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                    !fits && "cursor-not-allowed opacity-40"
                  )}
                >
                  {d} min{!fits && <span className="ml-1 text-[10px] text-neutral-400">(too long)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Suggestion chips (only after session type chosen) */}
      {sessionType && duration && (
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Suggested questions — tap to add
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => {
              const added = questions.some((q) => q.trim() === s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !added && !submitting && applySuggestion(s)}
                  disabled={submitting || added}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    added
                      ? "border-primary-200 bg-primary-50 text-primary-400 cursor-default"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  )}
                >
                  {added ? "✓ " : "+ "}{s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Questions */}
      {sessionType && duration && (
        <div className="mb-3 flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-neutral-600">
            Your questions{" "}
            <span className="font-normal text-neutral-400">(minimum {MIN_QUESTIONS})</span>
          </label>
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-center text-[11px] text-neutral-400">{i + 1}.</span>
              <input
                type="text"
                value={q}
                onChange={(e) =>
                  setQuestions((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                disabled={submitting}
                placeholder={
                  i === 0 ? "What do you want to learn from this session?"
                  : i === 1 ? "What's your current situation or challenge?"
                  : "Any specific topics you'd like to cover?"
                }
                className="h-8 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100 disabled:opacity-50"
              />
            </div>
          ))}
          {questions.length < 8 && (
            <button
              type="button"
              onClick={() => setQuestions((p) => [...p, ""])}
              disabled={submitting}
              className="mt-0.5 text-left text-[12px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              + Add another question
            </button>
          )}
          {!ready && sessionType && duration && (
            <p className="text-[11px] text-neutral-400">
              Add at least {MIN_QUESTIONS} questions to help the Auror prepare
            </p>
          )}
        </div>
      )}

      {error && <p className="mb-2 text-[12px] text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={!ready || submitting}
          size="sm"
          className="flex-1"
        >
          {submitting ? "Sending request…" : "Confirm Booking"}
        </Button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-neutral-500">{label}</span>
      <span className="text-[12px] font-semibold text-neutral-800">{value}</span>
    </div>
  );
}
