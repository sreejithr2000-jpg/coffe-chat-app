"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";
import { TRACK_LABELS } from "@/lib/tracks";
import type { User, ExperienceEntry, EducationEntry } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatExpDuration(e: ExperienceEntry): string | null {
  if (e.startYear && e.startMonth) {
    const start = `${MONTH_NAMES[parseInt(e.startMonth) - 1]} ${e.startYear}`;
    const end = e.endYear && e.endMonth
      ? `${MONTH_NAMES[parseInt(e.endMonth) - 1]} ${e.endYear}`
      : "Present";
    return `${start} – ${end}`;
  }
  const legacy = (e as unknown as Record<string, unknown>).duration as string | undefined;
  return legacy ?? null;
}

function avg(ratings: number[]) {
  if (!ratings.length) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
            fill={n <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}
            stroke={n <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileDetail {
  id: string;
  userId: string;
  name: string;
  headline: string | null;
  currentRole: string | null;
  totalExperience: number;
  experienceYears: number;
  primaryTrack: string | null;
  secondaryTracks: string[];
  skills: string[];
  domains: string[];
  sessionTypes: string[];
  sessionTags: string[];
  targetRoles: string[];
  overview: string | null;
  experience: ExperienceEntry[] | null;
  education: EducationEntry[] | null;
  dreamCompanies: string[];
  dreamRole: string | null;
  resumeUrl: string | null;
  portfolioLinks: string[];
  country: string | null;
}

interface ProfilePageData {
  user: User;
  profile: ProfileDetail;
  completedSessions: number;
  avgRating: number | null;
  ratings: number[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ProfilePageData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) { router.push("/login"); return; }

    fetch(`/api/profile/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<ProfilePageData>;
      })
      .then((d) => { setData(d); setLoadState("ready"); })
      .catch(() => setLoadState("error"));
  }, [id, router]);

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (loadState === "error" || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-neutral-500">Profile not found.</p>
        <BackButton />
      </div>
    );
  }

  const { profile, user, completedSessions, avgRating } = data;
  const isAuror = user.role === "AUROR";
  const trackLabel = profile.primaryTrack ? (TRACK_LABELS[profile.primaryTrack as keyof typeof TRACK_LABELS] ?? profile.primaryTrack) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <div className="flex items-start gap-3">
        <BackButton />
      </div>

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900">{profile.name}</h1>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isAuror ? "bg-emerald-50 text-emerald-700" : "bg-primary-50 text-primary-700"
              )}>
                {user.role}
              </span>
            </div>
            {profile.headline && (
              <p className="text-[13px] text-neutral-600">{profile.headline}</p>
            )}
            {isAuror && profile.currentRole && (
              <p className="text-[12px] text-neutral-500">
                {profile.currentRole}
                {profile.totalExperience > 0 && ` · ${profile.totalExperience} yrs exp`}
              </p>
            )}
            {!isAuror && profile.experienceYears > 0 && (
              <p className="text-[12px] text-neutral-500">{profile.experienceYears} yrs experience</p>
            )}
            {profile.country && (
              <p className="text-[12px] text-neutral-400">{profile.country}</p>
            )}
          </div>

          {isAuror && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              {avgRating !== null && (
                <div className="flex flex-col items-end gap-0.5">
                  <StarRating rating={avgRating} />
                  <p className="text-[11px] text-neutral-400">{avgRating.toFixed(1)} avg rating</p>
                </div>
              )}
              <p className="text-[11px] text-neutral-400">{completedSessions} sessions</p>
            </div>
          )}
        </div>

        {/* Track badges */}
        {(trackLabel || profile.secondaryTracks.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {trackLabel && (
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-700">
                {trackLabel}
              </span>
            )}
            {profile.secondaryTracks.map((t) => (
              <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                {TRACK_LABELS[t as keyof typeof TRACK_LABELS] ?? t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {profile.overview && (
        <Section title="About">
          <p className="text-[13px] leading-relaxed text-neutral-700 whitespace-pre-wrap">{profile.overview}</p>
        </Section>
      )}

      {/* ── Experience ───────────────────────────────────────────────────── */}
      {profile.experience && profile.experience.length > 0 && (
        <Section title="Experience">
          <div className="flex flex-col gap-3">
            {profile.experience.map((e, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <p className="text-[13px] font-semibold text-neutral-800">{e.role}</p>
                <p className="text-[12px] text-neutral-600">{e.company}</p>
                {formatExpDuration(e) && <p className="text-[11px] text-neutral-400">{formatExpDuration(e)}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Education ────────────────────────────────────────────────────── */}
      {profile.education && profile.education.length > 0 && (
        <Section title="Education">
          <div className="flex flex-col gap-3">
            {profile.education.map((e, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <p className="text-[13px] font-semibold text-neutral-800">{e.school}</p>
                <p className="text-[12px] text-neutral-600">{e.degree}</p>
                {e.year && <p className="text-[11px] text-neutral-400">{e.year}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Skills & Domains ─────────────────────────────────────────────── */}
      {(profile.skills.length > 0 || profile.domains.length > 0) && (
        <Section title="Skills &amp; Domains">
          <div className="flex flex-col gap-3">
            {profile.skills.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px] text-neutral-700">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.domains.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Domains</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.domains.map((d) => (
                    <span key={d} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[12px] text-primary-700">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Seeker: Target roles + dream companies ────────────────────────── */}
      {!isAuror && (profile.targetRoles.length > 0 || profile.dreamCompanies.length > 0 || profile.dreamRole) && (
        <Section title="Goals">
          {profile.dreamRole && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-neutral-400">Dream role</p>
              <p className="text-[13px] text-neutral-700">{profile.dreamRole}</p>
            </div>
          )}
          {profile.targetRoles.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Target roles</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.targetRoles.map((r) => (
                  <span key={r} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] text-emerald-700">{r}</span>
                ))}
              </div>
            </div>
          )}
          {profile.dreamCompanies.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Dream companies</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.dreamCompanies.map((c) => (
                  <span key={c} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] text-amber-700">{c}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Auror: Session types + tags ───────────────────────────────────── */}
      {isAuror && (profile.sessionTypes.length > 0 || profile.sessionTags.length > 0) && (
        <Section title="Mentoring">
          {profile.sessionTypes.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Offers</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.sessionTypes.map((t) => (
                  <span key={t} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[12px] text-primary-700 capitalize">
                    {t === "coffee_chat" ? "Coffee Chat" : t === "mock_interview" ? "Mock Interview" : t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.sessionTags.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Can help with</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.sessionTags.map((t) => (
                  <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px] text-neutral-700">{t}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Links ────────────────────────────────────────────────────────── */}
      {(profile.resumeUrl || profile.portfolioLinks.length > 0) && (
        <Section title="Links">
          <div className="flex flex-wrap gap-2">
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 1.5h5.5L10 4v6.5H2V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M7.5 1.5V4H10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M4 6.5h4M4 8h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Resume
              </a>
            )}
            {profile.portfolioLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1Z" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 6h10M6 1c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6 1c1.5 1.5 2 3 2 5s-.5 3.5-2 5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Portfolio {profile.portfolioLinks.length > 1 ? i + 1 : ""}
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{title}</p>
      {children}
    </div>
  );
}
