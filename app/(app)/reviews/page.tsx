"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  rating: number;
  review: string | null;
  takeaways: string[];
  displayMode: string;      // "anonymous" | "first_name" | "full_name"
  seekerName: string | null;
  createdAt: string;
}

// Subtle background tints — rotate through to give organic variety
const CARD_TINTS = [
  "bg-white",
  "bg-primary-50/60",
  "bg-amber-50/50",
  "bg-emerald-50/50",
  "bg-white",
  "bg-sky-50/40",
];

type SortOption = "recent" | "top" | "helpful";

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function ReviewsPage() {
  const [userId, setUserId]         = useState<string | null>(null);
  // allReviews — every rating ever submitted (source of truth for count + avg)
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);
  const [loadState, setLoadState]   = useState<"loading" | "ready" | "error">("loading");
  const [sort, setSort]             = useState<SortOption>("recent");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id);
    if (!id) { setLoadState("ready"); return; }

    fetch(`/api/reviews/auror/${id}`)
      .then((r) => r.json())
      .then((data: ReviewItem[]) => {
        // Store ALL reviews — never filter here; display layer handles text-only
        setAllReviews(Array.isArray(data) ? data : []);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, []);

  // Aggregate stats from ALL ratings (matches dashboard + profile counts)
  const totalRatings = allReviews.length;
  const avgRating = useMemo(() => {
    if (totalRatings === 0) return null;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / totalRatings).toFixed(1);
  }, [allReviews, totalRatings]);

  // Display pool — only reviews that have written text
  const textReviews = useMemo(() => allReviews.filter((r) => r.review), [allReviews]);

  const sorted = useMemo(() => {
    if (sort === "top") {
      return [...textReviews].sort((a, b) => b.rating - a.rating);
    }
    if (sort === "helpful") {
      return [...textReviews].sort((a, b) => (b.review?.length ?? 0) - (a.review?.length ?? 0));
    }
    // "recent" — API already returns newest-first, just preserve
    return textReviews;
  }, [textReviews, sort]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-neutral-500">Could not load reviews. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 no-underline transition-colors hover:text-neutral-800"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M9.5 6H2.5M5.5 3L2.5 6l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Dashboard
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">Reviews &amp; Feedback</h1>
        <p className="text-[13px] text-neutral-500">
          Insights shared anonymously by seekers after completed sessions.
        </p>
      </div>

      {/* ── Stats bar — sourced from ALL ratings, not just text reviews ───── */}
      {totalRatings > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-5 py-4 shadow-soft">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-neutral-900">{avgRating}</span>
            <span className="text-lg text-amber-400">★</span>
          </div>
          <div className="h-8 w-px bg-neutral-100" />
          <div>
            <p className="text-[13px] font-semibold text-neutral-800">
              {totalRatings} rating{totalRatings === 1 ? "" : "s"}
              {textReviews.length > 0 && (
                <span className="ml-1.5 font-normal text-neutral-400">
                  · {textReviews.length} written
                </span>
              )}
            </p>
            <p className="text-[11px] text-neutral-400">Lifetime average across all sessions</p>
          </div>
        </div>
      )}

      {/* ── Sort controls ───────────────────────────────────────────────────── */}
      {textReviews.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Sort
          </span>
          {(["recent", "top", "helpful"] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSort(opt)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                sort === opt
                  ? "border-primary-500 bg-primary-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
              )}
            >
              {opt === "recent" ? "Most recent" : opt === "top" ? "Highest rated" : "Most helpful"}
            </button>
          ))}
        </div>
      )}

      {/* ── Reviews grid ────────────────────────────────────────────────────── */}
      {totalRatings === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-20 text-center">
          <p className="text-[15px] font-semibold text-neutral-700">No feedback yet.</p>
          <p className="mt-1 text-[13px] text-neutral-400">
            Complete sessions to build your reputation.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center">
          <p className="text-[14px] font-semibold text-neutral-700">
            {totalRatings} session{totalRatings === 1 ? "" : "s"} rated
          </p>
          <p className="mt-1 text-[13px] text-neutral-400">
            No written reviews yet — ratings are still counted in your average.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {sorted.map((r, i) => (
            <ReviewCard
              key={r.id}
              review={r.review!}
              rating={r.rating}
              date={formatReviewDate(r.createdAt)}
              tint={CARD_TINTS[i % CARD_TINTS.length]}
              displayMode={r.displayMode}
              seekerName={r.seekerName}
            />
          ))}
        </div>
      )}

    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function resolveByline(
  displayMode: string,
  seekerName: string | null
): string {
  if (displayMode === "first_name" && seekerName) {
    return `${seekerName.split(" ")[0]} says`;
  }
  if (displayMode === "full_name" && seekerName) {
    return `${seekerName} says`;
  }
  return "Anonymous review";
}

function ReviewCard({
  review,
  rating,
  date,
  tint,
  displayMode,
  seekerName,
}: {
  review: string;
  rating: number;
  date: string;
  tint: string;
  displayMode: string;
  seekerName: string | null;
}) {
  const byline = resolveByline(displayMode, seekerName);

  return (
    <div
      className={cn(
        "mb-4 break-inside-avoid rounded-2xl border border-neutral-100 px-5 py-5 shadow-soft",
        "transition-shadow hover:shadow-md",
        tint
      )}
    >
      {/* Star rating */}
      <div className="mb-3 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? "text-amber-400" : "text-neutral-200"}>
            ★
          </span>
        ))}
      </div>

      {/* Review text */}
      <p className="text-[13px] leading-relaxed text-neutral-800">{review}</p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-[11px] font-medium text-neutral-500">— {byline}</span>
        <span className="text-[11px] text-neutral-300">{date}</span>
      </div>
    </div>
  );
}
