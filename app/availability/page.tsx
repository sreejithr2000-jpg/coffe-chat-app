"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { BackButton } from "@/components/BackButton";
import { formatSlotDate, weekLabel, bookingWindowMaxDate } from "@/lib/availability";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot, User } from "@/types";

export default function AvailabilityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");

  // Form state
  const today = new Date().toISOString().split("T")[0];
  const maxDate = bookingWindowMaxDate();
  const [form, setForm] = useState({ date: today, startTime: "09:00", endTime: "10:00" });
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { router.push("/login"); return; }

    fetch(`/api/users/${id}`)
      .then((r) => r.json() as Promise<User>)
      .then((user) => {
        if (user.role !== "AUROR") { router.push("/dashboard"); return; }
        setUserId(id);
        return fetch(`/api/availability/${id}`).then((r) => r.json() as Promise<AvailabilitySlot[]>);
      })
      .then((data) => { if (data) setSlots(data); setLoadState("ready"); })
      .catch(() => router.push("/dashboard"));
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setFormError(null);

    if (form.startTime >= form.endTime) {
      setFormError("Start time must be before end time");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to add slot"); return; }

      setSlots((prev) =>
        [...prev, data as AvailabilitySlot].sort((a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
        )
      );
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/availability/${id}`, { method: "DELETE" });
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // Group slots by week
  const thisWeekSlots = slots.filter((s) => weekLabel(s.date) === "This Week");
  const nextWeekSlots = slots.filter((s) => weekLabel(s.date) === "Next Week");

  return (
    <div className="flex flex-col gap-8 max-w-xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Set Your Availability</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Add specific dates and times you&apos;re open for sessions.
          </p>
        </div>
        <BackButton />
      </div>

      {/* ── Add Slot Form ──────────────────────────────────────────────────── */}
      <Card padding="lg">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-neutral-700">Date</label>
            <input
              type="date"
              value={form.date}
              min={today}
              max={maxDate}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={adding}
              className={cn(
                "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900",
                "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
                "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
              )}
            />
            <p className="text-[11px] text-neutral-400">
              Within the next 2 weeks (current + next week)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Start time"
              value={form.startTime}
              onChange={(v) => setForm({ ...form, startTime: v })}
              disabled={adding}
            />
            <TimeInput
              label="End time"
              value={form.endTime}
              onChange={(v) => setForm({ ...form, endTime: v })}
              disabled={adding}
            />
          </div>

          {formError && (
            <p className="text-[12px] text-red-600">{formError}</p>
          )}

          <Button type="submit" isLoading={adding} className="w-full">
            Add Slot
          </Button>
        </form>
      </Card>

      {/* ── Existing Slots ─────────────────────────────────────────────────── */}
      {slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center">
          <p className="text-sm font-medium text-neutral-400">No availability set yet</p>
          <p className="mt-1 text-[12px] text-neutral-400">
            Add a slot above to start accepting session requests.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {thisWeekSlots.length > 0 && (
            <SlotWeekGroup
              label="This Week"
              slots={thisWeekSlots}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          )}
          {nextWeekSlots.length > 0 && (
            <SlotWeekGroup
              label="Next Week"
              slots={nextWeekSlots}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

    </div>
  );
}

// ── SlotWeekGroup ─────────────────────────────────────────────────────────────

function SlotWeekGroup({
  label,
  slots,
  deletingId,
  onDelete,
}: {
  label: string;
  slots: AvailabilitySlot[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 shadow-soft"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[13px] font-medium text-neutral-800">
              {formatSlotDate(slot)}
            </span>
          </div>
          <button
            onClick={() => onDelete(slot.id)}
            disabled={deletingId === slot.id}
            className={cn(
              "ml-4 shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
              "text-neutral-400 hover:bg-red-50 hover:text-red-600",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {deletingId === slot.id ? "…" : "Remove"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── TimeInput ─────────────────────────────────────────────────────────────────

function TimeInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-neutral-700">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        )}
      />
    </div>
  );
}
