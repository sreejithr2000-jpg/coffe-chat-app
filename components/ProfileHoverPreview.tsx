"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PreviewData {
  userId: string;
  role: "SEEKER" | "AUROR";
  name: string;
  headline: string | null;
  // Auror
  currentRole: string | null;
  totalExperience: number;
  avgRating: number | null;
  completedSessions: number;
  // Seeker
  experienceYears: number;
  dreamRole: string | null;
  // Both
  skills: string[];
  overview: string | null;
}

// ── Cache (module-level, shared across instances) ─────────────────────────────

const cache = new Map<string, PreviewData>();

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Hover-triggered profile preview card — works for both AUROR and SEEKER.
 * - 150ms delay before showing
 * - 200ms hide delay so cursor can move from trigger to card without dismissing
 * - Fetches /api/profile/[userId] once and caches per session
 * - Mobile: tap toggles the card
 */
export function ProfileHoverPreview({
  userId,
  children,
  align = "left",
}: {
  userId: string;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PreviewData | null>(cache.get(userId) ?? null);
  const [loading, setLoading] = useState(false);

  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (cache.has(userId)) {
      setData(cache.get(userId)!);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`);
      if (!res.ok) return;
      const json = await res.json();
      const p = json.profile ?? {};
      const preview: PreviewData = {
        userId,
        role: json.user?.role ?? "SEEKER",
        name: p.name ?? "Unknown",
        headline: p.headline ?? null,
        currentRole: p.currentRole ?? null,
        totalExperience: p.totalExperience ?? 0,
        avgRating: json.avgRating ?? null,
        completedSessions: json.completedSessions ?? 0,
        experienceYears: p.experienceYears ?? 0,
        dreamRole: p.dreamRole ?? null,
        skills: p.skills ?? [],
        overview: p.overview ?? null,
      };
      cache.set(userId, preview);
      setData(preview);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Shared timer helpers ───────────────────────────────────────────────────

  function cancelShow() {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
  }

  function cancelHide() {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
  }

  function scheduleShow() {
    cancelHide();
    showTimer.current = setTimeout(() => {
      setVisible(true);
      fetchData();
    }, 150);
  }

  function scheduleHide() {
    cancelShow();
    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }

  // ── Trigger handlers ───────────────────────────────────────────────────────

  function handleTriggerEnter() {
    scheduleShow();
  }

  function handleTriggerLeave() {
    scheduleHide();
  }

  // ── Card handlers ──────────────────────────────────────────────────────────

  function handleCardEnter() {
    cancelHide();
  }

  function handleCardLeave() {
    scheduleHide();
  }

  // ── Mobile tap ────────────────────────────────────────────────────────────

  function handleTap(e: React.MouseEvent) {
    if (window.matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      if (!visible) { setVisible(true); fetchData(); }
      else setVisible(false);
    }
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleTriggerEnter}
      onMouseLeave={handleTriggerLeave}
      onClick={handleTap}
    >
      {children}

      {visible && (
        <span
          className={cn(
            "absolute top-full z-50 mt-1 w-64 rounded-xl border border-neutral-100 bg-white p-4 shadow-lg",
            "flex flex-col gap-3",
            align === "right" ? "right-0" : "left-0"
          )}
          onMouseEnter={handleCardEnter}
          onMouseLeave={handleCardLeave}
        >
          {loading && !data ? (
            <span className="flex justify-center py-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
            </span>
          ) : data ? (
            data.role === "AUROR"
              ? <AurorContent data={data} />
              : <SeekerContent data={data} />
          ) : null}

          {data && (
            <Link
              href={`/auror/${userId}`}
              className="mt-1 rounded-lg bg-primary-600 px-3 py-1.5 text-center text-[11px] font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              View Full Profile
            </Link>
          )}
        </span>
      )}
    </span>
  );
}

// ── Auror card body ───────────────────────────────────────────────────────────

function AurorContent({ data }: { data: PreviewData }) {
  return (
    <>
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-neutral-900">{data.name}</span>
        {data.currentRole && (
          <span className="text-[11px] text-neutral-500">
            {data.currentRole}{data.totalExperience > 0 && ` · ${data.totalExperience} yrs`}
          </span>
        )}
        {data.headline && (
          <span className="text-[11px] text-neutral-400 line-clamp-2">{data.headline}</span>
        )}
      </span>

      <span className="flex items-center gap-3">
        {data.avgRating !== null && (
          <span className="flex items-center gap-0.5 text-[11px]">
            <span className="text-amber-500">★</span>
            <span className="text-neutral-600">{data.avgRating.toFixed(1)}</span>
          </span>
        )}
        <span className="text-[11px] text-neutral-500">{data.completedSessions} sessions</span>
      </span>

      {data.skills.length > 0 && <SkillChips skills={data.skills} />}
      {data.overview && <OverviewSnippet text={data.overview} />}
    </>
  );
}

// ── Seeker card body ──────────────────────────────────────────────────────────

function SeekerContent({ data }: { data: PreviewData }) {
  return (
    <>
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-neutral-900">{data.name}</span>
        {data.headline && (
          <span className="text-[11px] text-neutral-400 line-clamp-2">{data.headline}</span>
        )}
        {data.experienceYears > 0 && (
          <span className="text-[11px] text-neutral-500">{data.experienceYears} yr{data.experienceYears !== 1 ? "s" : ""} experience</span>
        )}
      </span>

      {data.dreamRole && (
        <span className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Dream role</span>
          <span className="text-[11px] text-neutral-600">{data.dreamRole}</span>
        </span>
      )}

      {data.skills.length > 0 && <SkillChips skills={data.skills} />}
      {data.overview && <OverviewSnippet text={data.overview} />}
    </>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SkillChips({ skills }: { skills: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {skills.slice(0, 3).map((s) => (
        <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
          {s}
        </span>
      ))}
    </span>
  );
}

function OverviewSnippet({ text }: { text: string }) {
  return (
    <span className="text-[11px] leading-relaxed text-neutral-500 line-clamp-3">{text}</span>
  );
}

// ── Back-compat export ────────────────────────────────────────────────────────

/** @deprecated Use ProfileHoverPreview instead */
export { ProfileHoverPreview as AurorHoverPreview };
