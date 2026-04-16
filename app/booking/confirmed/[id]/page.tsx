"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { formatSlotDate } from "@/lib/availability";

interface ConfirmedRequest {
  id: string;
  sessionType: string;
  duration: number;
  status: string;
  auror: {
    profile: { name: string; currentRole: string | null } | null;
  };
  availabilitySlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
}

export default function BookingConfirmedPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState<ConfirmedRequest | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { router.push("/login"); return; }

    fetch(`/api/request/${requestId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<ConfirmedRequest>;
      })
      .then((data) => {
        setRequest(data);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [requestId, router]);

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (loadState === "error" || !request) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Request not found.</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button size="sm">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const aurorName = request.auror.profile?.name ?? "Auror";
  const sessionLabel = request.sessionType === "coffee" ? "Coffee Chat" : "Mock Interview";
  const slotLabel = formatSlotDate(request.availabilitySlot);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-8 py-12">

      {/* ── Success icon ────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 14.5l5.5 5.5L22 9"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-neutral-900">Request Sent</h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            Your session request is pending {aurorName}&apos;s confirmation.
          </p>
        </div>
      </div>

      {/* ── Booking summary card ─────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Booking Details
        </p>

        <div className="flex flex-col divide-y divide-neutral-100">
          <DetailRow label="With" value={aurorName} />
          {request.auror.profile?.currentRole && (
            <DetailRow label="Role" value={request.auror.profile.currentRole} />
          )}
          <DetailRow
            label="Type"
            value={
              <span className="inline-flex items-center gap-1">
                {request.sessionType === "coffee" ? "☕" : "🎯"} {sessionLabel}
              </span>
            }
          />
          <DetailRow label="Duration" value={`${request.duration} min`} />
          <DetailRow label="Slot" value={slotLabel} />
          <DetailRow
            label="Status"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-amber-600">Awaiting confirmation</span>
              </span>
            }
          />
        </div>
      </div>

      {/* ── Info note ────────────────────────────────────────────────────────── */}
      <p className="text-center text-[12px] text-neutral-400">
        You&apos;ll be notified once the Auror confirms. You can view or withdraw your request from your dashboard.
      </p>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col gap-2">
        <Link href="/dashboard" className="w-full">
          <Button className="w-full">Go to Dashboard</Button>
        </Link>
        <Link href="/dashboard?tab=requests" className="w-full">
          <Button variant="secondary" className="w-full">View My Sessions</Button>
        </Link>
      </div>
    </div>
  );
}

// ── DetailRow ─────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <span className="text-[12px] text-neutral-400">{label}</span>
      <span className="text-[13px] font-medium text-neutral-800">{value}</span>
    </div>
  );
}
