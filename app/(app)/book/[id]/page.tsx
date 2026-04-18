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
import type { User, AvailabilitySlot } from "@/types";

interface AurorStats {
  rating: number | null;
  reviewCount: number;
  completedSessions: number;
}

const MIN_QUESTIONS = 3;

export default function BookingPage() {
  const router  = useRouter();
  const { show: showToast } = useToast();
  const params  = useParams<{ id: string }>();
  const aurorId = params.id;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [auror, setAuror] = useState<User | null>(null);
  const [stats, setStats] = useState<AurorStats | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "no-access">("loading");

  // Booking flow state
  const [sessionType, setSessionType] = useState<"coffee" | "mock" | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [questions, setQuestions] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successSlotId, setSuccessSlotId] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { router.push("/login"); return; }
    setCurrentUserId(userId);

    Promise.all([
      fetch(`/api/users/${aurorId}`).then((r) => r.json() as Promise<User>),
      fetch(`/api/availability/${aurorId}`).then((r) => r.json() as Promise<AvailabilitySlot[]>),
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

  function selectSessionType(type: "coffee" | "mock") {
    setSessionType(type);
    setDuration(null);
    setSelectedSlotId(null);
    setFormError(null);
  }

  function selectDuration(d: number) {
    setDuration(d);
    setSelectedSlotId(null);
    setFormError(null);
  }

  function toggleSlot(slotId: string) {
    setSelectedSlotId((prev) => (prev === slotId ? null : slotId));
    if (selectedSlotId !== slotId) {
      setQuestions(["", "", ""]);
      setFormError(null);
    }
  }

  async function handleSubmit(slot: AvailabilitySlot) {
    if (!currentUserId || !sessionType || !duration) return;

    const filled = questions.filter((q) => q.trim().length > 0);
    if (filled.length < MIN_QUESTIONS) {
      setFormError(`Please fill in at least ${MIN_QUESTIONS} questions.`);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seekerId: currentUserId,
          aurorId,
          availabilitySlotId: slot.id,
          questions: filled,
          sessionType,
          duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to send request"); return; }

      setSuccessSlotId(slot.id);
      setSelectedSlotId(null);
      showToast("Request sent!");
      router.push(`/booking/confirmed/${data.id}`);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Guards ─────────────────────────────────────────────────────────────────

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

  // Filter past slots
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const futureSlots = slots.filter((s) => new Date(s.date) >= todayUTC);

  const filteredSlots =
    duration !== null ? futureSlots.filter((s) => slotMinutes(s) >= duration) : futureSlots;

  const thisWeekSlots = filteredSlots.filter((s) => weekLabel(s.date) === "This Week");
  const nextWeekSlots = filteredSlots.filter((s) => weekLabel(s.date) === "Next Week");

  const sessionLabels = (profile?.sessionTypes ?? []).map((t) =>
    t === "coffee_chat" ? "Coffee" : "Mock"
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">

      {/* Nav */}
      <div className="flex items-center justify-between">
        <BackButton fallback={`/auror/${aurorId}`} label="Back to Profile" />
        <Link href={`/auror/${aurorId}`} className="text-[12px] text-neutral-400 hover:text-neutral-600">
          View full profile
        </Link>
      </div>

      {/* ── Auror summary ─────────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700">
            {profile?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>

          {/* Left — identity */}
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

          {/* Right — trust signals */}
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
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-neutral-400" aria-hidden="true">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span className="text-[11px] text-neutral-500">
                  {stats.completedSessions} session{stats.completedSessions === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-neutral-500">Fast response</span>
            </div>
          </div>
        </div>

        {/* Session type pills */}
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

      {/* ── Step 1: Session type ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Session Type
        </p>
        <div className="flex gap-2">
          {(["coffee", "mock"] as const).map((type) => {
            const active = sessionType === type;
            return (
              <button
                key={type}
                onClick={() => selectSessionType(type)}
                className={cn(
                  "flex flex-1 flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary-400 bg-primary-50"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                )}
              >
                <span className={cn("text-[13px] font-semibold", active ? "text-primary-700" : "text-neutral-700")}>
                  {type === "coffee" ? "☕ Coffee Chat" : "🎯 Mock Interview"}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {type === "coffee"
                    ? "Casual career conversation"
                    : "Structured practice with feedback"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Duration ──────────────────────────────────────────────── */}
      {sessionType && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Duration
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS[sessionType].map((d) => {
              const available = futureSlots.some((s) => slotMinutes(s) >= d);
              return (
                <button
                  key={d}
                  onClick={() => available && selectDuration(d)}
                  disabled={!available}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors",
                    duration === d
                      ? "border-primary-400 bg-primary-50 text-primary-700"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                    !available && "cursor-not-allowed opacity-40"
                  )}
                >
                  {d} min
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Slots ────────────────────────────────────────────────── */}
      {sessionType && duration && (
        thisWeekSlots.length === 0 && nextWeekSlots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-10 text-center">
            <p className="text-sm text-neutral-400">No slots available for this duration.</p>
            <p className="mt-1 text-[12px] text-neutral-400">Try a shorter duration or check back later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {thisWeekSlots.length > 0 && (
              <SlotGroup
                label="This Week"
                slots={thisWeekSlots}
                selectedSlotId={selectedSlotId}
                successSlotId={successSlotId}
                onSelect={toggleSlot}
                renderForm={(slot) =>
                  selectedSlotId === slot.id ? (
                    <RequestForm
                      slot={slot}
                      aurorName={profile?.name ?? "Auror"}
                      sessionType={sessionType}
                      duration={duration}
                      questions={questions}
                      onSetQuestion={(i, v) =>
                        setQuestions((p) => p.map((q, idx) => (idx === i ? v : q)))
                      }
                      onAddQuestion={() => setQuestions((p) => [...p, ""])}
                      onSubmit={() => handleSubmit(slot)}
                      submitting={submitting}
                      error={formError}
                    />
                  ) : null
                }
              />
            )}
            {nextWeekSlots.length > 0 && (
              <SlotGroup
                label="Next Week"
                slots={nextWeekSlots}
                selectedSlotId={selectedSlotId}
                successSlotId={successSlotId}
                onSelect={toggleSlot}
                renderForm={(slot) =>
                  selectedSlotId === slot.id ? (
                    <RequestForm
                      slot={slot}
                      aurorName={profile?.name ?? "Auror"}
                      sessionType={sessionType}
                      duration={duration}
                      questions={questions}
                      onSetQuestion={(i, v) =>
                        setQuestions((p) => p.map((q, idx) => (idx === i ? v : q)))
                      }
                      onAddQuestion={() => setQuestions((p) => [...p, ""])}
                      onSubmit={() => handleSubmit(slot)}
                      submitting={submitting}
                      error={formError}
                    />
                  ) : null
                }
              />
            )}
          </div>
        )
      )}

      {/* Prompt to start */}
      {!sessionType && (
        <p className="text-center text-[12px] text-neutral-400">
          Choose a session type to see available slots.
        </p>
      )}
    </div>
  );
}

// ── SlotGroup ─────────────────────────────────────────────────────────────────

function SlotGroup({
  label,
  slots,
  selectedSlotId,
  successSlotId,
  onSelect,
  renderForm,
}: {
  label: string;
  slots: AvailabilitySlot[];
  selectedSlotId?: string | null;
  successSlotId?: string | null;
  onSelect?: (id: string) => void;
  renderForm?: (slot: AvailabilitySlot) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        const isSuccess = successSlotId === slot.id;

        return (
          <div key={slot.id} className="flex flex-col">
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                isSelected
                  ? "rounded-b-none border-primary-200 bg-primary-50"
                  : isSuccess
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-neutral-100 bg-white shadow-soft"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-[13px] font-medium text-neutral-800">
                  {formatSlotDate(slot)}
                </span>
              </div>

              {isSuccess ? (
                <span className="text-[12px] font-medium text-emerald-600">Request sent ✓</span>
              ) : onSelect ? (
                <button
                  onClick={() => onSelect(slot.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                    isSelected
                      ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  )}
                >
                  {isSelected ? "Cancel" : "Request Session"}
                </button>
              ) : null}
            </div>

            {renderForm && renderForm(slot)}
          </div>
        );
      })}
    </div>
  );
}

// ── RequestForm ───────────────────────────────────────────────────────────────

function RequestForm({
  slot,
  aurorName,
  sessionType,
  duration,
  questions,
  onSetQuestion,
  onAddQuestion,
  onSubmit,
  submitting,
  error,
}: {
  slot: AvailabilitySlot;
  aurorName: string;
  sessionType: "coffee" | "mock";
  duration: number;
  questions: string[];
  onSetQuestion: (i: number, v: string) => void;
  onAddQuestion: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const filled = questions.filter((q) => q.trim().length > 0).length;
  const ready = filled >= MIN_QUESTIONS;

  return (
    <div className="rounded-b-xl border border-t-0 border-primary-200 bg-white px-4 pb-4 pt-3">
      {/* Booking preview */}
      <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary-400">
          Booking Summary
        </p>
        <div className="flex flex-col gap-1">
          <SummaryRow label="With" value={aurorName} />
          <SummaryRow label="Type" value={sessionType === "coffee" ? "Coffee Chat" : "Mock Interview"} />
          <SummaryRow label="Duration" value={`${duration} min`} />
          <SummaryRow label="Slot" value={formatSlotDate(slot)} />
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-2">
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
              onChange={(e) => onSetQuestion(i, e.target.value)}
              disabled={submitting}
              placeholder={
                i === 0
                  ? "What do you want to learn from this session?"
                  : i === 1
                  ? "What's your current situation or challenge?"
                  : "Any specific topics you'd like to cover?"
              }
              className="h-8 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100 disabled:opacity-50"
            />
          </div>
        ))}
        {questions.length < 8 && (
          <button
            type="button"
            onClick={onAddQuestion}
            disabled={submitting}
            className="mt-1 text-left text-[12px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            + Add another question
          </button>
        )}
      </div>

      {!ready && (
        <p className="mt-2 text-[11px] text-neutral-400">
          Add at least {MIN_QUESTIONS} questions to help the Auror prepare
        </p>
      )}

      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

      <div className="mt-3">
        <Button
          onClick={onSubmit}
          isLoading={submitting}
          disabled={!ready || submitting}
          size="sm"
          className="w-full"
        >
          {submitting ? "Sending request…" : "Confirm Booking"}
        </Button>
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
