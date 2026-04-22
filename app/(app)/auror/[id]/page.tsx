"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";
import { BackButton } from "@/components/BackButton";
import { TRACK_LABELS } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { User, UserRole, ExperienceEntry, EducationEntry } from "@/types";

function NotifyMeButton({ aurorId, seekerId }: { aurorId: string; seekerId: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seekerId) { setLoading(false); return; }
    fetch(`/api/watchlist/${seekerId}`)
      .then((r) => r.json() as Promise<string[]>)
      .then((ids) => setSubscribed(ids.includes(aurorId)))
      .finally(() => setLoading(false));
  }, [aurorId, seekerId]);

  async function toggle() {
    if (!seekerId || loading) return;
    const next = !subscribed;
    setSubscribed(next);
    await fetch("/api/watchlist", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seekerId, aurorId }),
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !seekerId}
      title={subscribed ? "Stop notifications" : "Notify me when new slots open"}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
        subscribed
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
      )}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1.5C7 1.5 4 3 4 7v2.5H3l-.5 1H11.5l-.5-1H10V7c0-4-3-5.5-3-5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M5.5 10.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
      {subscribed ? "✓ You'll be notified" : "Notify Me"}
    </button>
  );
}

interface AurorStats {
  completedSessions: number;
  avgRating: number | null;
  reviewCount: number;
}

interface ReviewItem {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
}

export default function AurorProfilePage() {
  const params = useParams<{ id: string }>();
  const aurorId = params.id;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [auror, setAuror] = useState<User | null>(null);
  const [stats, setStats] = useState<AurorStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setCurrentUserId(id);

    const aurorFetch = fetch(`/api/users/${aurorId}`).then((r) => r.json() as Promise<User>);
    const statsFetch = fetch(`/api/profile/${aurorId}`).then((r) => r.json());
    const reviewsFetch = fetch(`/api/reviews/auror/${aurorId}`).then((r) => r.json());
    const userFetch = id
      ? fetch(`/api/users/${id}`).then((r) => r.json() as Promise<User>)
      : Promise.resolve(null);

    Promise.all([aurorFetch, statsFetch, reviewsFetch, userFetch])
      .then(([aurorData, statsData, reviewsData, userData]) => {
        setAuror(aurorData);
        if (statsData && !statsData.error) {
          setStats({
            completedSessions: statsData.completedSessions ?? 0,
            avgRating: statsData.avgRating ?? null,
            reviewCount: (statsData.ratings as number[] | undefined)?.length ?? 0,
          });
        }
        if (Array.isArray(reviewsData)) {
          setReviews((reviewsData as ReviewItem[]).filter((r) => r.review));
        }
        if (userData) setCurrentRole(userData.role);
        setLoadState("ready");
      })
      .catch(() => setLoadState("ready"));
  }, [aurorId]);

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
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
  const isSeeker = currentRole === "SEEKER";

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <BackButton fallback="/aurors" label="Back to Aurors" />
        {isSeeker && (
          <div className="flex items-center gap-2">
            <NotifyMeButton aurorId={aurorId} seekerId={currentUserId ?? ""} />
            <Link href={`/book/${aurorId}`}>
              <Button size="sm">Book Session</Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Auror Profile ──────────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {profile?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-bold text-neutral-900">{profile?.name ?? "Unnamed"}</p>
                <Badge variant="success">AUROR</Badge>
              </div>
              {profile?.headline && (
                <p className="text-sm text-neutral-500">{profile.headline}</p>
              )}
              {(profile?.currentRole || (profile?.totalExperience ?? 0) > 0) && (
                <p className="text-[12px] text-neutral-400">
                  {[
                    profile?.currentRole,
                    (profile?.totalExperience ?? 0) > 0
                      ? `${profile!.totalExperience} yr${profile!.totalExperience === 1 ? "" : "s"} experience`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            {(profile?.primaryTrack || (profile?.secondaryTracks?.length ?? 0) > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {profile?.primaryTrack && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    {TRACK_LABELS[profile.primaryTrack]}
                  </span>
                )}
                {profile?.secondaryTracks?.map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                    {TRACK_LABELS[t]}
                  </span>
                ))}
              </div>
            )}

            {/* Stats row */}
            {stats && (stats.avgRating !== null || stats.completedSessions > 0) && (
              <div className="flex items-center gap-3 border-t border-neutral-100 pt-2">
                {stats.avgRating !== null && (
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-amber-500">
                    ★ {stats.avgRating.toFixed(1)}
                    {stats.reviewCount > 0 && (
                      <span className="font-normal text-neutral-400">
                        ({stats.reviewCount} review{stats.reviewCount === 1 ? "" : "s"})
                      </span>
                    )}
                  </span>
                )}
                {stats.completedSessions > 0 && (
                  <>
                    {stats.avgRating !== null && (
                      <span className="text-neutral-200">·</span>
                    )}
                    <span className="text-[12px] text-neutral-500">
                      {stats.completedSessions} session{stats.completedSessions === 1 ? "" : "s"} completed
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {profile?.overview && (
        <ProfileSection title="About">
          <p className="text-[13px] leading-relaxed text-neutral-700 whitespace-pre-wrap">
            {profile.overview}
          </p>
        </ProfileSection>
      )}

      {/* ── Experience ────────────────────────────────────────────────────── */}
      {(profile?.experience as ExperienceEntry[] | null | undefined)?.length ? (
        <ProfileSection title="Experience">
          <div className="flex flex-col divide-y divide-neutral-100">
            {(profile!.experience as ExperienceEntry[]).map((e, i) => (
              <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[11px] font-bold text-neutral-500">
                  {e.company?.charAt(0)?.toUpperCase() ?? "·"}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-neutral-800">{e.role}</p>
                  <p className="text-[12px] text-neutral-500">{e.company}</p>
                  {formatExpDuration(e) && (
                    <p className="text-[11px] text-neutral-400">{formatExpDuration(e)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>
      ) : null}

      {/* ── Education ─────────────────────────────────────────────────────── */}
      {(profile?.education as EducationEntry[] | null | undefined)?.length ? (
        <ProfileSection title="Education">
          <div className="flex flex-col divide-y divide-neutral-100">
            {(profile!.education as EducationEntry[]).map((e, i) => (
              <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-[11px] font-bold text-primary-500">
                  {e.school?.charAt(0)?.toUpperCase() ?? "·"}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-neutral-800">{e.school}</p>
                  <p className="text-[12px] text-neutral-500">{e.degree}</p>
                  {e.year && (
                    <p className="text-[11px] text-neutral-400">{e.year}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>
      ) : null}

      {/* ── Skills + Topics ───────────────────────────────────────────────── */}
      {((profile?.skills?.length ?? 0) > 0 || (profile?.sessionTags?.length ?? 0) > 0) && (
        <ProfileSection title="Skills &amp; Topics">
          <div className="flex flex-col gap-3">
            {(profile?.skills?.length ?? 0) > 0 && (
              <TagRow label="Skills" tags={profile!.skills} color="blue" />
            )}
            {(profile?.sessionTags?.length ?? 0) > 0 && (
              <TagRow label="Can help with" tags={profile!.sessionTags} color="neutral" />
            )}
          </div>
        </ProfileSection>
      )}

      {/* ── Resume + Portfolio ────────────────────────────────────────────── */}
      {(profile?.resumeUrl || (profile?.portfolioLinks?.length ?? 0) > 0) && (
        <ProfileSection title="Links">
          <div className="flex flex-wrap gap-2">
            {profile?.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 1.5h5.5L10 4v6.5H2V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M7.5 1.5V4H10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M4 6.5h4M4 8h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Download Resume
              </a>
            )}
            {profile?.portfolioLinks?.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6a5 5 0 1 0 10 0A5 5 0 0 0 1 6Z" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 6h10M6 1c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6 1c1.5 1.5 2 3 2 5s-.5 3.5-2 5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Portfolio {(profile.portfolioLinks?.length ?? 0) > 1 ? i + 1 : ""}
              </a>
            ))}
          </div>
        </ProfileSection>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <ProfileSection title={`Reviews (${stats?.reviewCount ?? reviews.length})`}>
          <div className="flex flex-col gap-4">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-amber-500">
                    {"★".repeat(r.rating)}
                    <span className="text-neutral-200">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-neutral-700">{r.review}</p>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {/* ── Book CTA (seeker) / Login prompt ──────────────────────────────── */}
      {isSeeker ? (
        <div className="rounded-xl border border-primary-100 bg-primary-50 px-5 py-4 text-center">
          <p className="text-[13px] font-medium text-primary-700">
            Ready to connect with {profile?.name?.split(" ")[0] ?? "this Auror"}?
          </p>
          <Link href={`/book/${aurorId}`} className="mt-3 inline-block">
            <Button>Book a Session</Button>
          </Link>
        </div>
      ) : !currentUserId ? (
        <p className="text-center text-sm text-neutral-500">
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Log in
          </Link>{" "}
          as a Seeker to book a session.
        </p>
      ) : null}
    </div>
  );
}

// ── formatExpDuration ─────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatExpDuration(e: ExperienceEntry): string | null {
  if (e.startYear && e.startMonth) {
    const start = `${MONTH_NAMES[parseInt(e.startMonth) - 1]} ${e.startYear}`;
    const end = e.endYear && e.endMonth
      ? `${MONTH_NAMES[parseInt(e.endMonth) - 1]} ${e.endYear}`
      : "Present";
    return `${start} – ${end}`;
  }
  // Backward compat: old entries may have a `duration` string field
  const legacy = (e as unknown as Record<string, unknown>).duration as string | undefined;
  return legacy ?? null;
}

// ── ProfileSection ────────────────────────────────────────────────────────────

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white px-5 py-4 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── TagRow ────────────────────────────────────────────────────────────────────

function TagRow({
  label,
  tags,
  color,
}: {
  label: string;
  tags: string[];
  color: "blue" | "neutral";
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
            className={
              color === "blue"
                ? "rounded-md border border-primary-100 bg-primary-50 px-2 py-0.5 text-[12px] font-medium text-primary-700"
                : "rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[12px] font-medium text-neutral-600"
            }
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
