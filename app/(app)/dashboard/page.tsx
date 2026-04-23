"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";
import { useToast } from "@/lib/toast-context";
import { ProfileHoverPreview } from "@/components/ProfileHoverPreview";
import { TRACK_LABELS } from "@/lib/tracks";
import { formatSlotDate } from "@/lib/availability";
import { isValidMeetingUrl } from "@/lib/meeting";
import { cn } from "@/lib/utils";
import {
  getProfileScore,
  getProfileChecklist,
  getMilestoneMessage,
  getRoleNudge,
} from "@/lib/profileCompletion";
import type {
  User,
  Profile,
  UserRole,
  RequestWithDetails,
  AurorRequestWithDetails,
  BookingWithDetails,
  Review,
} from "@/types";

type LoadState = "loading" | "ready" | "no-user";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [aurorRequests, setAurorRequests] = useState<AurorRequestWithDetails[]>([]);
  const [seekerBookings, setSeekerBookings] = useState<BookingWithDetails[]>([]);
  const [aurorBookings, setAurorBookings] = useState<BookingWithDetails[]>([]);
  const [aurorReviews, setAurorReviews] = useState<Review[]>([]);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(false);
  const [completedSkip, setCompletedSkip] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [usage, setUsage] = useState<{
    weeklyUsed: number;
    weeklyLimit: number;
    monthlyUsed: number;
    hasBonus: boolean;
    thisWeekCompleted: number;
  } | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { router.replace("/login"); return; }

    fetch(`/api/users/${userId}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json() as Promise<User>; })
      .then((data) => {
        setUser(data);
        setState("ready");

        if (data.role === "SEEKER") {
          fetch(`/api/requests/seeker/${userId}`)
            .then((r) => r.json() as Promise<RequestWithDetails[]>)
            .then((reqs) => setRequests(Array.isArray(reqs) ? reqs : []))
            .catch(() => {});
          fetch(`/api/bookings/seeker/${userId}`)
            .then((r) => r.json())
            .then((res) => {
              setSeekerBookings(Array.isArray(res.bookings) ? res.bookings : []);
              setHasMoreCompleted(res.hasMoreCompleted ?? false);
            })
            .catch(() => {});
          fetch(`/api/usage/${userId}`)
            .then((r) => r.json())
            .then((u) => setUsage(u))
            .catch(() => {});
        }

        if (data.role === "AUROR") {
          fetch(`/api/requests/auror/${userId}`)
            .then((r) => r.json() as Promise<AurorRequestWithDetails[]>)
            .then((reqs) => setAurorRequests(Array.isArray(reqs) ? reqs : []))
            .catch(() => {});
          fetch(`/api/bookings/auror/${userId}`)
            .then((r) => r.json() as Promise<BookingWithDetails[]>)
            .then((bks) => setAurorBookings(Array.isArray(bks) ? bks : []))
            .catch(() => {});
          fetch(`/api/reviews/auror/${userId}`)
            .then((r) => r.json() as Promise<Review[]>)
            .then((revs) => setAurorReviews(Array.isArray(revs) ? revs : []))
            .catch(() => {});
        }
      })
      .catch(() => { fetch("/api/auth/logout", { method: "POST" }); localStorage.removeItem("userId"); setState("no-user"); });
  }, []);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (state === "no-user") return null;



  const profile = user?.profile;
  const isAuror = user?.role === "AUROR";
  const isSeeker = user?.role === "SEEKER";

  // ── Profile completion score ──────────────────────────────────────────────
  const completionScore = profile && user ? getProfileScore(profile, user.role) : 0;

  // ── Seeker limits — DB-computed via /api/usage ───────────────────────────
  const weeklyUsed        = usage?.weeklyUsed        ?? 0;
  const weeklyLimit       = usage?.weeklyLimit       ?? 10;
  const monthlyUsed       = usage?.monthlyUsed       ?? 0;
  const hasBonus          = usage?.hasBonus          ?? false;
  const thisWeekCompleted = usage?.thisWeekCompleted ?? 0;
  const atWeeklyLimit     = isSeeker && weeklyUsed >= weeklyLimit;
  const atMonthlyLimit    = isSeeker && monthlyUsed >= 40;

  // ── Auror stats ───────────────────────────────────────────────────────────
  const avgRating =
    aurorReviews.length > 0
      ? (aurorReviews.reduce((sum, r) => sum + r.rating, 0) / aurorReviews.length).toFixed(1)
      : null;
  const completedCount = aurorBookings.filter((b) => b.status === "completed").length;

  // ── Derived lists ────────────────────────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Seeker — single source: seekerBookings
  const upcomingSeekerSessions  = seekerBookings.filter((b) => b.status === "scheduled");
  const completedSeekerSessions = seekerBookings.filter(
    (b) => b.status === "completed" && new Date(b.updatedAt ?? b.createdAt) >= sevenDaysAgo
  );
  // Only show pending requests — accepted ones already appear as upcoming sessions
  const pendingSeekerRequests   = requests.filter((r) => r.status === "pending");

  // Auror — single source: aurorBookings + aurorRequests
  const upcomingAurorSessions  = aurorBookings.filter((b) => b.status === "scheduled");
  const completedAurorSessions = aurorBookings.filter(
    (b) => b.status === "completed" && new Date(b.updatedAt ?? b.createdAt) >= sevenDaysAgo
  );
  // Only show pending requests — accepted ones move to Upcoming Sessions
  const pendingAurorRequests   = aurorRequests.filter((r) => r.status === "pending");

  // ── Auror response time ───────────────────────────────────────────────────
  const responseTimeLabel = (() => {
    const settled = aurorRequests.filter(
      (r) => r.status === "accepted" || r.status === "rejected"
    );
    if (settled.length === 0) return null;
    const avgMs =
      settled.reduce(
        (sum, r) =>
          sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()),
        0
      ) / settled.length;
    const avgHours = avgMs / (1000 * 60 * 60);
    if (avgHours < 6) return "Fast";
    if (avgHours <= 24) return "Medium";
    return "Slow";
  })();

  async function refetchAurorBookings() {
    if (!user) return;
    try {
      const bks = await fetch(`/api/bookings/auror/${user.id}`).then((r) => r.json() as Promise<BookingWithDetails[]>);
      setAurorBookings(Array.isArray(bks) ? bks : []);
    } catch {}
  }

  async function loadMoreCompleted() {
    if (!user) return;
    setLoadingMore(true);
    const newSkip = completedSkip + 10;
    try {
      const res = await fetch(`/api/bookings/seeker/${user.id}?completedSkip=${newSkip}`);
      if (!res.ok) return;
      const data = await res.json();
      setSeekerBookings((prev) => {
        const scheduled   = prev.filter((b) => b.status === "scheduled");
        const completed   = prev.filter((b) => b.status === "completed");
        const cancelled   = prev.filter((b) => b.status === "cancelled");
        const moreCompleted = (data.bookings as BookingWithDetails[]).filter(
          (b) => b.status === "completed"
        );
        return [...scheduled, ...completed, ...moreCompleted, ...cancelled];
      });
      setHasMoreCompleted(data.hasMoreCompleted ?? false);
      setCompletedSkip(newSkip);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl">

      {/* ── Row 1: Header + primary CTA ────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
            {profile ? `Welcome back, ${profile.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {isSeeker ? "Track your progress and upcoming sessions." : "Manage your sessions and availability."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={isAuror ? "success" : "primary"}>{user?.role}</Badge>
          {isSeeker && (
            <Link href="/aurors">
              <Button size="sm">Browse Aurors</Button>
            </Link>
          )}
          {isAuror && (
            <Link href="/availability">
              <Button variant="secondary" size="sm">Manage Availability</Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Welcome banner (new user — no profile yet) ─────────────────────── */}
      {!profile && <WelcomeBanner />}

      {/* ── Guidance card (profile set up, no activity yet) ────────────────── */}
      {profile && isSeeker && upcomingSeekerSessions.length === 0 && pendingSeekerRequests.length === 0 && (
        <GuidanceCard role="seeker" />
      )}
      {profile && isAuror && upcomingAurorSessions.length === 0 && pendingAurorRequests.length === 0 && (
        <GuidanceCard role="auror" />
      )}

      {/* ── Profile completion nudge ───────────────────────────────────────── */}
      {profile && user && completionScore < 100 && (
        <ProfileCompletionBanner profile={profile} role={user.role} score={completionScore} />
      )}

      {/* ── Monday availability reminder (Aurors only) ────────────────────── */}
      {isAuror && <MondayReminderBanner />}

      {/* ── Row 2: Metric cards ─────────────────────────────────────────────── */}
      <div className={cn(
        "grid gap-3",
        isAuror ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"
      )}>
        {isSeeker ? (
          <>
            <StatCard label="Total Sessions"    value={String(seekerBookings.length)} />
            <StatCard label="Upcoming"           value={String(upcomingSeekerSessions.length)} />
            <StatCard label="Requests this week" value={`${weeklyUsed} / ${weeklyLimit}`} subtle />
          </>
        ) : (
          <>
            <StatCard label="Completed"       value={String(completedCount)} />
            <StatCard label="Upcoming"        value={String(upcomingAurorSessions.length)} />
            <StatCard label="Pending requests" value={String(pendingAurorRequests.length)} subtle />
            <StatCard label="Avg rating"      value={avgRating ? `★ ${avgRating}` : "—"} />
            <StatCard label="Response"        value={responseTimeLabel ?? "—"} accent={responseTimeLabel === "Slow"} />
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SEEKER                                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {isSeeker && (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* ── Left 2/3 ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5 lg:col-span-2">

              {/* Upcoming Sessions */}
              <Section title="Upcoming Sessions" emphasis>
                {upcomingSeekerSessions.length === 0 ? (
                  <EmptyState
                    message="No upcoming sessions yet"
                    sub="Your accepted sessions will appear here."
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {upcomingSeekerSessions.map((bk) => (
                      <BookingRow
                        key={bk.id}
                        booking={bk}
                        perspective="seeker"
                        seekerId={user!.id}
                        seekerName={user?.profile?.name ?? undefined}
                        onUpdate={(updated) =>
                          setSeekerBookings((prev) =>
                            prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </Section>

              {/* My Requests — pending only (accepted ones are already in Upcoming Sessions) */}
              <Section title="My Requests">
                {pendingSeekerRequests.length === 0 ? (
                  <EmptyState
                    message="No active requests yet"
                    sub="Your pending booking requests will appear here."
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {pendingSeekerRequests.map((req) => (
                      <RequestRow
                        key={req.id}
                        request={req}
                        seekerId={user!.id}
                        onDelete={(id) =>
                          setRequests((prev) => prev.filter((r) => r.id !== id))
                        }
                      />
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* ── Right 1/3 ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <RequestUsageCard used={weeklyUsed} limit={weeklyLimit} />
              <BonusCard hasBonus={hasBonus} thisWeekCompleted={thisWeekCompleted} />
              {atMonthlyLimit && <LimitBanner type="monthly" />}
              {!atMonthlyLimit && atWeeklyLimit && (
                <LimitBanner type="weekly" weeklyLimit={weeklyLimit} hasBonus={hasBonus} />
              )}
            </div>
          </div>

          {/* ── Completed Sessions (full width, last 7 days) ─────────────── */}
          {completedSeekerSessions.length > 0 && (
            <Section
              title="Completed Sessions"
              subtitle="Resets every week"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedSeekerSessions.map((bk) => (
                  <CompletedCard key={bk.id} booking={bk} perspective="seeker" />
                ))}
              </div>
              {hasMoreCompleted && (
                <button
                  onClick={loadMoreCompleted}
                  disabled={loadingMore}
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white py-2 text-[12px] font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "See more"}
                </button>
              )}
            </Section>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* AUROR                                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {isAuror && (
        <>
          {/* 3-column: Requests | Upcoming | Sidebar */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* ── Col 1: Incoming Requests (pending only) ─────────────────── */}
            <div className="flex flex-col gap-3">
              <SectionHeader title="Incoming Requests" emphasis badge={pendingAurorRequests.length} />
              {pendingAurorRequests.length === 0 ? (
                <EmptyState
                  message="No incoming requests yet."
                  sub="Keep your profile updated and manage availability to attract seekers."
                  subtleLinks={[
                    { label: "Edit Profile", href: "/profile/create" },
                    { label: "Manage Availability", href: "/availability" },
                  ]}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingAurorRequests.map((req) => (
                    <IncomingRequestCard
                      key={req.id}
                      request={req}
                      aurorId={user!.id}
                      onUpdate={(updated) =>
                        setAurorRequests((prev) =>
                          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
                        )
                      }
                      onAccept={refetchAurorBookings}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Col 2: Upcoming Sessions ─────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <SectionHeader title="Upcoming Sessions" />
              {upcomingAurorSessions.length === 0 ? (
                <EmptyState message="No upcoming sessions yet" sub="Sessions appear here once you accept a request." />
              ) : (
                <div className="flex flex-col gap-2">
                  {upcomingAurorSessions.map((bk) => (
                    <BookingRow key={bk.id} booking={bk} perspective="auror" />
                  ))}
                </div>
              )}
            </div>

            {/* ── Col 3: Sidebar ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              {/* Reviews */}
              {aurorReviews.length > 0 ? (
                <Card padding="md">
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xl font-bold text-neutral-900">★ {avgRating}</span>
                        <span className="ml-2 text-[12px] text-neutral-400">
                          {aurorReviews.length} review{aurorReviews.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    {/* Preview: up to 2 reviews with text, no per-review stars */}
                    {aurorReviews.filter((r) => r.review).slice(0, 2).map((r) => (
                      <div key={r.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-neutral-600">{r.review}</p>
                        <p className="mt-1 text-[10px] text-neutral-400">Anonymous review</p>
                      </div>
                    ))}

                    {/* See all CTA */}
                    <Link
                      href="/reviews"
                      className="flex items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                    >
                      See all reviews
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </Card>
              ) : (
                <Card padding="md">
                  <p className="text-[12px] text-neutral-400">No reviews yet.</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Reviews appear after a Seeker marks a session complete.
                  </p>
                </Card>
              )}

              {/* Availability */}
              <Card padding="md">
                <p className="text-[13px] font-semibold text-neutral-900">Availability</p>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  Set the times you&apos;re open for sessions each week.
                </p>
                <div className="mt-3">
                  <Link href="/availability">
                    <Button variant="secondary" size="sm" className="w-full">Manage</Button>
                  </Link>
                </div>
              </Card>

            </div>
          </div>

          {/* ── Completed Sessions (full width, last 7 days) ─────────────── */}
          {completedAurorSessions.length > 0 && (
            <Section
              title="Completed Sessions"
              subtitle="Resets every week"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedAurorSessions.map((bk) => (
                  <CompletedCard key={bk.id} booking={bk} perspective="auror" />
                ))}
              </div>
            </Section>
          )}
        </>
      )}


    </div>
  );
}

// ── WelcomeBanner ─────────────────────────────────────────────────────────────

function WelcomeBanner() {
  return (
    <div className="rounded-2xl bg-primary-600 px-6 py-5 text-white">
      <p className="text-[18px] font-bold">Welcome to Lumora OneFlow ✨</p>
      <p className="mt-1 text-[13px] text-primary-100">
        Let&apos;s get you started. Set up your profile so you can make the most of the platform.
      </p>
      <div className="mt-4">
        <Link href="/profile/create">
          <button className="rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-primary-700 transition-colors hover:bg-primary-50">
            Set up profile
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── GuidanceCard ──────────────────────────────────────────────────────────────

function GuidanceCard({ role }: { role: "seeker" | "auror" }) {
  if (role === "seeker") {
    return (
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-500">Get started</p>
        <h2 className="mt-1 text-[18px] font-bold text-neutral-900">Start your first coffee chat</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Browse experienced Aurors and book a session to get career guidance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/aurors">
            <Button>Browse Aurors</Button>
          </Link>
          <Link href="/profile/create">
            <Button variant="secondary" size="sm">Complete Profile</Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white px-6 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-500">Get started</p>
      <h2 className="mt-1 text-[18px] font-bold text-neutral-900">Start mentoring seekers</h2>
      <p className="mt-1 text-[13px] text-neutral-500">
        Complete your profile and set your availability so seekers can book sessions with you.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/profile/create">
          <Button>Edit Profile</Button>
        </Link>
        <Link href="/availability">
          <Button variant="secondary" size="sm">Manage Availability</Button>
        </Link>
      </div>
    </div>
  );
}

// ── ProfileCompletionBanner ───────────────────────────────────────────────────

function ProfileCompletionBanner({
  profile,
  role,
  score,
}: {
  profile: Profile;
  role: UserRole;
  score: number;
}) {
  const checklist  = getProfileChecklist(profile, role);
  const missing    = checklist.filter((item) => !item.done);
  const doneCount  = checklist.length - missing.length;
  const milestone  = getMilestoneMessage(score);
  const nudge      = getRoleNudge(role);

  // Bar colour shifts as you progress
  const barColor =
    score >= 80 ? "bg-emerald-500" :
    score >= 50 ? "bg-primary-500" :
                  "bg-amber-400";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold text-neutral-900">Complete your profile</p>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              score >= 80 ? "bg-emerald-100 text-emerald-700" :
              score >= 50 ? "bg-primary-100 text-primary-700" :
                            "bg-amber-100 text-amber-700"
            )}>
              {score}%
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-neutral-500">{nudge}</p>
        </div>
        <Link href="/profile/create" className="shrink-0">
          <Button size="sm">Complete Profile</Button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Milestone message */}
      {milestone && (
        <p className={cn(
          "mt-1.5 text-[12px] font-medium",
          score >= 80 ? "text-emerald-600" : "text-primary-600"
        )}>
          {milestone}
        </p>
      )}

      {/* Missing items */}
      {missing.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Complete these next
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.slice(0, 4).map((item) => (
              <span
                key={item.key}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] text-neutral-600"
              >
                <span className="h-3 w-3 shrink-0 rounded-full border border-neutral-300" />
                {item.label}
              </span>
            ))}
            {missing.length > 4 && (
              <span className="flex items-center rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1 text-[11px] text-neutral-400">
                +{missing.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Completed count — subtle positive reinforcement */}
      {doneCount > 0 && missing.length > 0 && (
        <p className="mt-2.5 text-[11px] text-neutral-400">
          {doneCount} of {checklist.length} sections done
        </p>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  subtle,
}: {
  label: string;
  value: string;
  accent?: boolean;
  subtle?: boolean;
}) {
  return (
    <Card padding="md">
      <p className="text-[10px] font-semibold uppercase leading-tight tracking-widest text-neutral-400 sm:text-[11px]">{label}</p>
      <p className={cn(
        "mt-1.5 text-lg font-bold sm:text-xl",
        accent  ? "text-amber-600"   :
        subtle  ? "text-neutral-500" :
                  "text-neutral-900"
      )}>
        {value}
      </p>
    </Card>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({
  message,
  sub,
  action,
  subtleLinks,
}: {
  message: string;
  sub?: string;
  action?: React.ReactNode;
  subtleLinks?: { label: string; href: string }[];
}) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-8 text-center">
      <p className="text-sm text-neutral-400">{message}</p>
      {sub && <p className="mt-1 text-[12px] text-neutral-400">{sub}</p>}
      {subtleLinks && subtleLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          {subtleLinks.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && <span className="text-neutral-300 text-[11px]">·</span>}
              <Link href={link.href} className="text-[12px] text-primary-600 hover:text-primary-700 hover:underline">
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// ── LimitBanner ───────────────────────────────────────────────────────────────

function LimitBanner({
  type,
  weeklyLimit,
  hasBonus,
}: {
  type: "monthly" | "weekly";
  weeklyLimit?: number;
  hasBonus?: boolean;
}) {
  if (type === "monthly") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-[13px] font-medium text-red-800">
          Monthly limit reached.{" "}
          <span className="font-normal text-red-700">Resets at the start of next month.</span>
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-[13px] font-medium text-amber-800">
        Weekly limit reached ({weeklyLimit} requests).{" "}
        <span className="font-normal text-amber-700">
          {hasBonus ? "Bonus slots used. Resets next Monday." : "Resets next Monday."}
        </span>
      </p>
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  emphasis = false,
  badge,
}: {
  title: string;
  emphasis?: boolean;
  badge?: number;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2",
      emphasis && "border-l-2 border-primary-400 pl-3"
    )}>
      <h2 className={cn(
        "font-bold text-neutral-900",
        emphasis ? "text-[16px]" : "text-[14px]"
      )}>
        {title}
      </h2>
      {badge != null && badge > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </div>
  );
}

// ── ProfileSideCard ───────────────────────────────────────────────────────────

function ProfileSideCard({ profile, role }: { profile: Profile | null | undefined; role: "seeker" | "auror" }) {
  if (!profile) {
    return (
      <Card padding="md" className="border-dashed border-neutral-200">
        <p className="text-[13px] font-semibold text-neutral-900">Complete your profile</p>
        <p className="mt-0.5 text-[12px] text-neutral-500">
          {role === "auror" ? "Add your experience so Seekers can find you." : "Add your skills and target roles."}
        </p>
        <div className="mt-3">
          <Link href="/profile/create">
            <Button size="sm" className="w-full">Set up</Button>
          </Link>
        </div>
      </Card>
    );
  }
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-neutral-900">{profile.name}</p>
          <p className="truncate text-[11px] text-neutral-400">
            {role === "auror" ? (profile.currentRole ?? profile.headline) : profile.headline}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-neutral-100 pt-3">
        <Link href="/profile/create">
          <Button variant="ghost" size="sm" className="w-full">Edit profile</Button>
        </Link>
      </div>
    </Card>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  emphasis = false,
  subtitle,
  action,
  children,
}: {
  title: string;
  emphasis?: boolean;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={cn(
        "flex items-center justify-between",
        emphasis && "border-l-2 border-primary-400 pl-3"
      )}>
        <div>
          <h2 className={cn(
            "font-bold text-neutral-900",
            emphasis ? "text-[18px]" : "text-[15px]"
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-neutral-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── ProfileOverview ───────────────────────────────────────────────────────────

function ProfileOverview({ profile, isAuror }: { profile: Profile; isAuror: boolean }) {
  return (
    <Card padding="md">
      <div className="flex flex-col gap-4">
        {/* Identity row */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-neutral-900">{profile.name}</p>
            {profile.headline && (
              <p className="text-[13px] text-neutral-500">{profile.headline}</p>
            )}
            {isAuror ? (
              (profile.currentRole || profile.totalExperience > 0) && (
                <p className="text-[12px] text-neutral-400">
                  {[
                    profile.currentRole,
                    profile.totalExperience > 0
                      ? `${profile.totalExperience} yr${profile.totalExperience === 1 ? "" : "s"}`
                      : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              )
            ) : (
              <p className="text-[12px] text-neutral-400">
                {profile.experienceYears === 0
                  ? "Experience not specified"
                  : `${profile.experienceYears} yr${profile.experienceYears === 1 ? "" : "s"} experience`}
              </p>
            )}
          </div>
        </div>

        {/* Tracks */}
        {(profile.primaryTrack || profile.secondaryTracks.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {profile.primaryTrack && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                {TRACK_LABELS[profile.primaryTrack]}
              </span>
            )}
            {profile.secondaryTracks.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                {TRACK_LABELS[t]}
              </span>
            ))}
          </div>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <LabeledTags label="Skills" tags={profile.skills} color="blue" />
        )}

        {/* Domains */}
        {profile.domains.length > 0 && (
          <LabeledTags label="Domains" tags={profile.domains} color="neutral" />
        )}

        {/* Seeker: target roles */}
        {!isAuror && profile.targetRoles.length > 0 && (
          <LabeledTags label="Target roles" tags={profile.targetRoles} color="blue" />
        )}

        {/* Auror: session types */}
        {isAuror && profile.sessionTypes.length > 0 && (
          <LabeledTags
            label="Offers"
            tags={profile.sessionTypes.map((t) =>
              t === "coffee_chat" ? "Coffee Chat" : "Mock Interview"
            )}
            color="emerald"
          />
        )}

        {/* Auror: session tags */}
        {isAuror && profile.sessionTags.length > 0 && (
          <LabeledTags label="Topics" tags={profile.sessionTags} color="neutral" />
        )}

        <div className="border-t border-neutral-100 pt-2">
          <Link href="/profile/create">
            <Button variant="ghost" size="sm">Edit profile</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ── LabeledTags ───────────────────────────────────────────────────────────────

function LabeledTags({
  label,
  tags,
  color,
}: {
  label: string;
  tags: string[];
  color: "blue" | "neutral" | "emerald";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
              color === "blue"    && "border border-primary-100 bg-primary-50 text-primary-700",
              color === "neutral" && "border border-neutral-200 bg-neutral-50 text-neutral-600",
              color === "emerald" && "border border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Shared constants + helpers ────────────────────────────────────────────────

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending:  "border-amber-200   bg-amber-50   text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200     bg-red-50     text-red-700",
  expired:  "border-neutral-200 bg-neutral-100 text-neutral-500",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  scheduled: "border-primary-200 bg-primary-50  text-primary-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-neutral-200 bg-neutral-100 text-neutral-500",
};

function slotLabel(slot: { date: string; startTime: string; endTime: string } | null) {
  if (!slot) return "—";
  return formatSlotDate(slot);
}

function formatScheduledDate(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function expiryLabel(expiresAt: string, status: string): string {
  if (status !== "pending") return "";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours >= 1) return `Expires in ${hours}h`;
  const mins = Math.floor(ms / (1000 * 60));
  return `Expires in ${mins}m`;
}

// ── RequestRow (Seeker view) ──────────────────────────────────────────────────

function RequestRow({
  request,
  seekerId,
  onDelete,
}: {
  request: RequestWithDetails;
  seekerId?: string;
  onDelete?: (id: string) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const { show: showToast } = useToast();

  const { auror, availabilitySlot, status, expiresAt, sessionType, duration, aurorId } = request;
  const name = auror?.profile?.name ?? "Unknown Auror";
  const expiry = expiryLabel(expiresAt, status);
  const sessionLabel = sessionType === "coffee" ? "Coffee Chat" : "Mock Interview";

  async function handleWithdraw() {
    if (!seekerId || !onDelete) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/request/${request.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seekerId }),
      });
      if (res.ok) {
        onDelete(request.id);
        showToast("Request withdrawn");
      }
    } finally {
      setWithdrawing(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-100 bg-white px-4 py-3 shadow-soft transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <ProfileHoverPreview userId={aurorId}>
              <p className="text-[13px] font-semibold text-neutral-900 hover:text-primary-600 cursor-pointer transition-colors">{name}</p>
            </ProfileHoverPreview>
            <p className="text-[12px] text-neutral-500">{slotLabel(availabilitySlot)}</p>
            <p className="text-[11px] text-neutral-400">{sessionLabel} · {duration} min</p>
            {expiry && <p className="text-[11px] text-amber-500">{expiry}</p>}
          </div>
          <span className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
            REQUEST_STATUS_STYLES[status] ?? REQUEST_STATUS_STYLES.expired
          )}>
            {status}
          </span>
        </div>
        {status === "pending" && onDelete && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={withdrawing}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 text-[11px] font-medium text-neutral-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            Withdraw request
          </button>
        )}
      </div>

      {showConfirm && (
        <WithdrawConfirmModal
          aurorName={name}
          withdrawing={withdrawing}
          onConfirm={handleWithdraw}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ── WithdrawConfirmModal ──────────────────────────────────────────────────────

function WithdrawConfirmModal({
  aurorName,
  withdrawing,
  onConfirm,
  onCancel,
}: {
  aurorName: string;
  withdrawing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !withdrawing) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[15px] font-bold text-neutral-900">Withdraw this request?</p>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
            This will cancel your pending request to{" "}
            <span className="font-medium text-neutral-700">{aurorName}</span>.
            You can send a new request later.
          </p>
        </div>
        <div className="flex gap-2 border-t border-neutral-100 px-5 py-4">
          <button
            onClick={onCancel}
            disabled={withdrawing}
            className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={withdrawing}
            className="flex-1 rounded-lg bg-red-600 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {withdrawing ? "Withdrawing…" : "Withdraw Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BookingRow (Seeker + Auror) ───────────────────────────────────────────────

function BookingRow({
  booking,
  perspective,
  seekerId,
  seekerName,
  onUpdate,
}: {
  booking: BookingWithDetails;
  perspective: "seeker" | "auror";
  seekerId?: string;
  seekerName?: string;
  onUpdate?: (updated: Partial<BookingWithDetails> & { id: string }) => void;
}): React.ReactElement {
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { id, status, scheduledAt } = booking;
  const name =
    perspective === "seeker"
      ? (booking.auror?.profile?.name ?? "Unknown Auror")
      : (booking.seeker?.profile?.name ?? "Unknown Seeker");

  // Unread detection
  const hasUnread = (() => {
    if (!booking.lastMessageAt) return false;
    const lastMsg = new Date(booking.lastMessageAt).getTime();
    const lastRead =
      perspective === "seeker"
        ? booking.seekerLastReadAt
        : booking.aurorLastReadAt;
    return !lastRead || lastMsg > new Date(lastRead).getTime();
  })();

  return (
    <>
    <div className={cn(
      "flex flex-col gap-2.5 rounded-xl border px-4 py-3 shadow-soft transition-all hover:shadow-md",
      status === "cancelled"
        ? "opacity-50 border-neutral-100 bg-neutral-50"
        : status === "completed"
          ? "border-emerald-100 bg-emerald-50/30"
          : hasUnread
            ? "border-primary-200 bg-primary-50/40"
            : "border-neutral-100 bg-white"
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <ProfileHoverPreview userId={perspective === "seeker" ? booking.aurorId : booking.seekerId}>
            <p className="text-[13px] font-semibold text-neutral-900 hover:text-primary-600 cursor-pointer transition-colors">{name}</p>
          </ProfileHoverPreview>
          <p className="text-[12px] text-neutral-500">{formatScheduledDate(scheduledAt)}</p>
          {booking.sessionType && (
            <p className="text-[11px] text-neutral-400">
              {booking.sessionType === "coffee" ? "☕ Coffee Chat" : "🎯 Mock Interview"}
              {booking.duration ? ` · ${booking.duration} min` : ""}
            </p>
          )}
        </div>
        <span className={cn(
          "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
          BOOKING_STATUS_STYLES[status] ?? BOOKING_STATUS_STYLES.cancelled
        )}>
          {status}
        </span>
      </div>

      {/* Action buttons row — horizontal alignment */}
      {status !== "cancelled" && (
        <div className={cn(
          "flex gap-2",
          status === "scheduled" ? "flex-col" : ""
        )}>
          {/* Open Chat */}
          <Link
            href={`/booking/${id}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[12px] font-semibold transition-colors",
              hasUnread
                ? "border-primary-300 bg-primary-600 text-white hover:bg-primary-700"
                : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
            )}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13 8C13 11.314 10.761 14 8 14C6.93 14 5.934 13.657 5.111 13.071L2.5 14L3.429 11.389C2.843 10.566 2.5 9.57 2.5 8.5C2.5 5.462 4.962 3 8 3C11.038 3 13 5.462 13 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            {hasUnread ? "Chat ●" : "Open Chat"}
          </Link>

          {/* Join Meeting */}
          {status === "scheduled" && (
            isValidMeetingUrl(booking.meetingLink) ? (
              <a
                href={booking.meetingLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Join Meeting
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ) : (
              <p className="flex-1 rounded-lg border border-dashed border-neutral-200 py-1.5 text-center text-[11px] text-neutral-400">
                Meeting link pending
              </p>
            )
          )}
        </div>
      )}

      {/* Mark as Completed button (Seeker only) */}
      {perspective === "seeker" && status === "scheduled" && seekerId && onUpdate && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full rounded-lg border border-emerald-200 bg-emerald-50 py-1.5 text-[12px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Mark as Completed
        </button>
      )}
    </div>

    {/* Modal — rendered outside the card so it overlays the whole page */}
    {showReviewForm && seekerId && onUpdate && (
      <MarkCompleteModal
        bookingId={id}
        seekerId={seekerId}
        aurorName={name}
        seekerName={seekerName}
        onCancel={() => setShowReviewForm(false)}
        onComplete={(data) => {
          if (data.attended) {
            onUpdate({ id, status: "completed", review: { rating: data.rating, review: data.review, takeaways: data.takeaways } });
          } else {
            onUpdate({ id, status: "cancelled" });
          }
          setShowReviewForm(false);
        }}
      />
    )}
    </>
  );
}

// ── MarkCompleteModal ─────────────────────────────────────────────────────────

const NO_SHOW_REASONS = [
  { value: "auror_no_show",       label: "Auror didn't show up" },
  { value: "seeker_no_show",      label: "I wasn't able to attend" },
  { value: "scheduling_conflict", label: "Scheduling conflict" },
  { value: "technical_issue",     label: "Technical issue" },
  { value: "rescheduled",         label: "Session rescheduled elsewhere" },
  { value: "broken_link",         label: "Meeting link was missing or broken" },
  { value: "other",               label: "Other" },
] as const;

type NoShowReason = typeof NO_SHOW_REASONS[number]["value"];

type DisplayMode = "anonymous" | "first_name" | "full_name";

function MarkCompleteModal({
  bookingId,
  seekerId,
  aurorName,
  seekerName,
  onCancel,
  onComplete,
}: {
  bookingId: string;
  seekerId: string;
  aurorName: string;
  seekerName?: string;
  onCancel: () => void;
  onComplete: (
    data:
      | { attended: true; rating: number; review: string | null; takeaways: string[] }
      | { attended: false }
  ) => void;
}) {
  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<"question" | "feedback" | "resolution">("question");

  // ── Feedback (YES) state ──────────────────────────────────────────────────
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [review, setReview]       = useState("");
  const [takeaways, setTakeaways] = useState(["", "", ""]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("anonymous");

  // ── Resolution (NO) state ─────────────────────────────────────────────────
  const [reason, setReason]         = useState<NoShowReason | null>(null);
  const [reasonNote, setReasonNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const display         = hovered || rating;
  const filledTakeaways = takeaways.filter((t) => t.trim().length > 0);
  const firstName       = seekerName?.split(" ")[0] ?? null;

  // ── Submit YES path ───────────────────────────────────────────────────────
  async function handleSubmitFeedback() {
    if (rating === 0) { setError("Please select a rating."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          seekerId,
          rating,
          attended: true,
          review: review.trim() || undefined,
          takeaways: filledTakeaways,
          displayMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      onComplete({ attended: true, rating, takeaways: filledTakeaways, review: review.trim() || null });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Submit NO path ────────────────────────────────────────────────────────
  async function handleSubmitResolution() {
    if (!reason) { setError("Please select a reason."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          seekerId,
          reason,
          reasonNote: reasonNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      onComplete({ attended: false });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-neutral-900">
              {step === "resolution" ? "Session Issue" : "Mark as Completed"}
            </p>
            <p className="text-[12px] text-neutral-400">Session with {aurorName}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">

          {/* ── Step 1: question ─────────────────────────────────────────── */}
          {step === "question" && (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <p className="text-[14px] font-semibold text-neutral-800">Did the session happen?</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setStep("feedback")}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 py-5 text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <span className="text-[22px] leading-none">✓</span>
                  <span className="text-[13px] font-semibold">Yes, it happened</span>
                </button>
                <button
                  onClick={() => setStep("resolution")}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 border-neutral-200 bg-neutral-50 py-5 text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  <span className="text-[22px] leading-none">✕</span>
                  <span className="text-[13px] font-semibold">No, it didn&apos;t</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2a: feedback (YES) ──────────────────────────────────── */}
          {step === "feedback" && (
            <>
              {/* Star rating */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] font-semibold text-neutral-700">
                  Rating <span className="font-normal text-neutral-400">(required)</span>
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="text-[26px] leading-none transition-transform hover:scale-110 focus:outline-none"
                      aria-label={`${star} star`}
                    >
                      <span className={star <= display ? "text-amber-400" : "text-neutral-200"}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Takeaways */}
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-neutral-700">
                  Key takeaways{" "}
                  <span className="font-normal text-neutral-400">(optional — only visible to you)</span>
                </p>
                {takeaways.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                    <input
                      type="text"
                      value={t}
                      onChange={(e) =>
                        setTakeaways((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                      }
                      disabled={submitting}
                      placeholder={
                        i === 0 ? "e.g. How to negotiate offers effectively"
                        : i === 1 ? "e.g. Build a strong personal narrative"
                        : "e.g. Focus on impact, not just tasks"
                      }
                      className="h-8 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[12px] placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100 disabled:opacity-50"
                    />
                  </div>
                ))}
                {takeaways.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setTakeaways((prev) => [...prev, ""])}
                    disabled={submitting}
                    className="mt-0.5 text-left text-[12px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    + Add another takeaway
                  </button>
                )}
              </div>

              {/* Review for Auror */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] font-semibold text-neutral-700">
                  Review for Auror{" "}
                  <span className="font-normal text-neutral-400">(optional — visible to them)</span>
                </p>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value.slice(0, 500))}
                  disabled={submitting}
                  placeholder="Share your experience — what made this session valuable?"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100 disabled:opacity-50"
                />
                {review.length > 0 && (
                  <p className="text-right text-[10px] text-neutral-400">{review.length}/500</p>
                )}
              </div>

              {/* Identity choice — only shown when review has text */}
              {review.trim().length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-3">
                  <p className="text-[12px] font-semibold text-neutral-700">
                    Display name
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Help future seekers by sharing feedback with your name.
                  </p>
                  {([
                    { value: "anonymous",  label: "Anonymous" },
                    { value: "first_name", label: firstName ? `Show first name — "${firstName}"` : "Show first name" },
                  ] as { value: DisplayMode; label: string }[]).map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="radio"
                        name="displayMode"
                        value={opt.value}
                        checked={displayMode === opt.value}
                        onChange={() => setDisplayMode(opt.value)}
                        disabled={submitting}
                        className="accent-primary-600"
                      />
                      <span className="text-[12px] text-neutral-700">{opt.label}</span>
                      {opt.value === "anonymous" && (
                        <span className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">recommended</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Step 2b: resolution (NO) ─────────────────────────────────── */}
          {step === "resolution" && (
            <>
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-[13px] font-semibold text-amber-800">
                  Sorry this session didn&apos;t go as planned.
                </p>
                <p className="mt-0.5 text-[12px] text-amber-600">
                  Let us know what happened so we can help resolve it.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-neutral-700">What happened?</p>
                <div className="flex flex-wrap gap-2">
                  {NO_SHOW_REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => { setReason(r.value); setError(null); }}
                      disabled={submitting}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                        reason === r.value
                          ? "border-primary-500 bg-primary-600 text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100 disabled:opacity-50"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {reason === "other" && (
                <textarea
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value.slice(0, 300))}
                  disabled={submitting}
                  placeholder="Tell us a bit more (optional)…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100 disabled:opacity-50"
                />
              )}

              <p className="text-[11px] text-neutral-400">
                This won&apos;t affect anyone&apos;s public profile. We use this to track and resolve session issues.
              </p>
            </>
          )}

          {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>

        {/* Footer — sticky at bottom */}
        <div className="flex shrink-0 gap-2 border-t border-neutral-100 px-5 py-4">
          {step === "question" && (
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          )}

          {step === "feedback" && (
            <>
              <button
                onClick={handleSubmitFeedback}
                disabled={submitting || rating === 0}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save & Complete"}
              </button>
              <button
                onClick={() => { setStep("question"); setError(null); }}
                disabled={submitting}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Back
              </button>
            </>
          )}

          {step === "resolution" && (
            <>
              <button
                onClick={handleSubmitResolution}
                disabled={submitting || !reason}
                className="flex-1 rounded-lg bg-neutral-800 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
              <button
                onClick={() => { setStep("question"); setError(null); }}
                disabled={submitting}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Back
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ── CompletedCard ─────────────────────────────────────────────────────────────

function CompletedCard({
  booking,
  perspective,
}: {
  booking: BookingWithDetails;
  perspective: "seeker" | "auror";
}) {
  const name =
    perspective === "seeker"
      ? (booking.auror?.profile?.name ?? "Unknown Auror")
      : (booking.seeker?.profile?.name ?? "Unknown Seeker");

  const rev = booking.review;
  const topTakeaways = (rev?.takeaways ?? []).filter((t) => t.trim()).slice(0, 3);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-4 shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-semibold text-neutral-900">{name}</p>
          <p className="text-[11px] text-neutral-400">
            {formatScheduledDate(booking.scheduledAt)}
          </p>
          {booking.sessionType && (
            <p className="text-[11px] text-neutral-400">
              {booking.sessionType === "coffee" ? "☕ Coffee Chat" : "🎯 Mock Interview"}
              {booking.duration ? ` · ${booking.duration} min` : ""}
            </p>
          )}
        </div>
        {rev?.rating && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
            ★ {rev.rating}
          </span>
        )}
      </div>

      {/* Auror: review text written by seeker */}
      {perspective === "auror" && rev?.review && (
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Review
          </p>
          <p className="line-clamp-3 text-[12px] leading-snug text-neutral-700">{rev.review}</p>
        </div>
      )}

      {/* Takeaways — visible to both, labelled for context */}
      {topTakeaways.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            {perspective === "auror" ? "Seeker's Takeaways" : "My Takeaways"}
          </p>
          {topTakeaways.map((t, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-400" />
              <p className="line-clamp-2 text-[12px] leading-snug text-neutral-700">{t}</p>
            </div>
          ))}
        </div>
      ) : (
        perspective === "seeker" && (
          <p className="text-[11px] italic text-neutral-300">No takeaways recorded</p>
        )
      )}

      {/* Chat link */}
      <Link
        href={`/booking/${booking.id}`}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13 8C13 11.314 10.761 14 8 14C6.93 14 5.934 13.657 5.111 13.071L2.5 14L3.429 11.389C2.843 10.566 2.5 9.57 2.5 8.5C2.5 5.462 4.962 3 8 3C11.038 3 13 5.462 13 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
        View Chat
      </Link>
    </div>
  );
}

// ── RequestUsageCard ──────────────────────────────────────────────────────────

function RequestUsageCard({ used, limit }: { used: number; limit: number }) {
  const SEGMENTS = 10;
  const filled = Math.min(used, SEGMENTS);
  const remaining = Math.max(0, limit - used);

  const barColor =
    filled <= 6 ? "bg-emerald-500" :
    filled <= 9 ? "bg-amber-400"   : "bg-red-500";

  return (
    <Card padding="md">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-neutral-900">Requests this week</p>
          <p className="text-[12px] text-neutral-400">
            {used}&thinsp;<span className="text-neutral-300">/</span>&thinsp;{limit} used
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full",
                i < filled ? barColor : "bg-neutral-200"
              )}
            />
          ))}
        </div>
        {remaining > 0 && (
          <p className="text-[11px] text-neutral-400">{remaining} remaining this week</p>
        )}
      </div>
    </Card>
  );
}

// ── BonusCard ────────────────────────────────────────────────────────────────

function BonusCard({
  hasBonus,
  thisWeekCompleted,
}: {
  hasBonus: boolean;
  thisWeekCompleted: number;
}) {
  if (hasBonus) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-[13px] font-medium text-emerald-800">
          🎉 Bonus unlocked! You&apos;ll have 15 requests available next week.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-[13px] font-medium text-neutral-700">
        Complete 5 sessions this week to unlock +5 requests next week
      </p>
      {thisWeekCompleted > 0 && (
        <p className="text-[12px] text-neutral-500">
          {Math.min(thisWeekCompleted, 5)}&thinsp;/&thinsp;5 sessions completed this week
        </p>
      )}
    </div>
  );
}

// ── MondayReminderBanner ─────────────────────────────────────────────────────

function MondayReminderBanner() {
  const isMonday = new Date().getDay() === 1;
  if (!isMonday) return null;
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[13px] font-semibold text-primary-800">
            It&apos;s Monday — update your availability for this week.
          </p>
          <p className="mt-0.5 text-[12px] text-primary-600">
            Keep your slots current so seekers can find and book you.
          </p>
        </div>
        <Link href="/availability" className="shrink-0">
          <Button variant="secondary" size="sm">Manage Availability</Button>
        </Link>
      </div>
    </div>
  );
}

// ── RejectReasonModal ─────────────────────────────────────────────────────────

const REJECT_REASONS = [
  { value: "no_availability",   label: "No availability that week" },
  { value: "not_my_expertise",  label: "Outside my expertise" },
  { value: "low_preparation",   label: "Insufficient preparation from seeker" },
  { value: "too_many_sessions", label: "Already at capacity this week" },
  { value: "other",             label: "Other" },
] as const;

type RejectReason = typeof REJECT_REASONS[number]["value"];

function RejectReasonModal({
  seekerName,
  rejecting,
  onConfirm,
  onCancel,
}: {
  seekerName: string;
  rejecting: boolean;
  onConfirm: (reason: RejectReason, note?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<RejectReason | null>(null);
  const [note, setNote] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !rejecting) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[15px] font-bold text-neutral-900">Decline this request?</p>
          <p className="mt-1 text-[13px] text-neutral-500">
            Please select a reason for declining{" "}
            <span className="font-medium text-neutral-700">{seekerName}</span>&apos;s request.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setReason(r.value); }}
                disabled={rejecting}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  reason === r.value
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          {reason === "other" && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              disabled={rejecting}
              placeholder="Brief note (optional)…"
              rows={2}
              className="mt-3 w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100 disabled:opacity-50"
            />
          )}
        </div>
        <div className="flex gap-2 border-t border-neutral-100 px-5 py-4">
          <button
            onClick={onCancel}
            disabled={rejecting}
            className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => reason && onConfirm(reason, note.trim() || undefined)}
            disabled={rejecting || !reason}
            className="flex-1 rounded-lg bg-red-600 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {rejecting ? "Declining…" : "Decline Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── IncomingRequestCard (Auror view) ─────────────────────────────────────────

function IncomingRequestCard({
  request,
  aurorId,
  onUpdate,
  onAccept,
}: {
  request: AurorRequestWithDetails;
  aurorId: string;
  onUpdate: (updated: Partial<AurorRequestWithDetails> & { id: string }) => void;
  onAccept?: () => void;
}) {
  const [acting, setActing] = useState<"accept" | "reject" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { seeker, availabilitySlot, status, questions, expiresAt, id, sessionType, duration, seekerId } = request;
  const seekerName = seeker?.profile?.name ?? "Unknown Seeker";
  const expiry = expiryLabel(expiresAt, status);
  const isPending = status === "pending";
  const sessionLabel = sessionType === "coffee" ? "Coffee Chat" : "Mock Interview";

  async function handleAction(action: "accept" | "reject", rejectReason?: string) {
    setActing(action);
    setError(null);
    try {
      const res = await fetch(`/api/request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, aurorId, rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      onUpdate({ id, status: data.status, updatedAt: data.updatedAt });
      if (action === "accept") onAccept?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActing(null);
      setShowRejectModal(false);
    }
  }

  return (
    <>
    <div className={cn(
      "flex flex-col gap-3 rounded-xl border bg-white px-4 py-4 shadow-soft transition-shadow hover:shadow-md",
      status === "expired" || status === "rejected" ? "opacity-60 border-neutral-100" : "border-neutral-100"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <ProfileHoverPreview userId={seekerId}>
            <p className="text-[13px] font-semibold text-neutral-900 hover:text-primary-600 cursor-pointer transition-colors">{seekerName}</p>
          </ProfileHoverPreview>
          <p className="text-[12px] text-neutral-500">{slotLabel(availabilitySlot)}</p>
          <p className="text-[11px] text-neutral-400">{sessionLabel} · {duration} min</p>
          {expiry && <p className="text-[11px] text-amber-500">{expiry}</p>}
        </div>
        <span className={cn(
          "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
          REQUEST_STATUS_STYLES[status] ?? REQUEST_STATUS_STYLES.expired
        )}>
          {status}
        </span>
      </div>

      {/* ── Seeker Details ─────────────────────────────────────────────────── */}
      {(questions.length > 0 || seeker?.profile?.resumeUrl || (seeker?.profile?.portfolioLinks ?? []).length > 0) && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Seeker Details</p>

          {/* Resume + portfolio first */}
          {(seeker?.profile?.resumeUrl || (seeker?.profile?.portfolioLinks ?? []).length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {seeker?.profile?.resumeUrl && (
                <a
                  href={seeker.profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 1.5h5.5L10 4v6.5H2V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M7.5 1.5V4H10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M4 6.5h4M4 8h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Download Resume
                </a>
              )}
              {(seeker?.profile?.portfolioLinks ?? []).map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1Z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 6h10M6 1c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6 1c1.5 1.5 2 3 2 5s-.5 3.5-2 5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Portfolio {(seeker?.profile?.portfolioLinks ?? []).length > 1 ? i + 1 : ""}
                </a>
              ))}
            </div>
          )}

          {/* Questions */}
          {questions.length > 0 && (
            <div className="flex flex-col gap-1">
              {questions.map((q, i) => (
                <p key={i} className="text-[12px] text-neutral-700">
                  <span className="mr-1 text-neutral-400">{i + 1}.</span>{q}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("accept")}
            disabled={acting !== null}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors",
              acting === "accept"
                ? "bg-primary-400 text-white opacity-80 cursor-wait"
                : "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            )}
          >
            {acting === "accept" ? "Accepting…" : "Accept"}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={acting !== null}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
              acting === "reject"
                ? "border-red-300 bg-red-50 text-red-400 cursor-wait"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            )}
          >
            {acting === "reject" ? "Declining…" : "Decline"}
          </button>
        </div>
      )}

      {!isPending && status !== "expired" && (
        <div className={cn(
          "rounded-lg px-3 py-2 text-center text-[11px] font-medium",
          status === "accepted"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-neutral-50 text-neutral-400"
        )}>
          {status === "accepted" ? "✓ Accepted — booking created" : `Request ${status}`}
        </div>
      )}

      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>

    {showRejectModal && (
      <RejectReasonModal
        seekerName={seekerName}
        rejecting={acting === "reject"}
        onConfirm={(reason, note) => handleAction("reject", `${reason}${note ? `: ${note}` : ""}`)}
        onCancel={() => setShowRejectModal(false)}
      />
    )}
  </>
  );
}
