"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TRACK_LABELS } from "@/lib/tracks";
import { getProfileScore, getProfileChecklist } from "@/lib/profileCompletion";
import { formatLocation, formatTimezoneDisplay } from "@/lib/timezone";
import type { User, Profile, ExperienceEntry, EducationEntry } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function fmtDuration(e: ExperienceEntry): string | null {
  if (e.startYear && e.startMonth) {
    const start = `${MONTH_NAMES[parseInt(e.startMonth) - 1]} ${e.startYear}`;
    const end =
      e.endYear && e.endMonth
        ? `${MONTH_NAMES[parseInt(e.endMonth) - 1]} ${e.endYear}`
        : "Present";
    return `${start} – ${end}`;
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageData {
  user: User;
  profile: Profile;
  completedSessions: number;
  avgRating: number | null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyProfilePage() {
  const router = useRouter();
  const [data, setState_data]  = useState<PageData | null>(null);
  const [state, setState]      = useState<"loading" | "ready" | "no-profile" | "error">("loading");

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) { router.replace("/login"); return; }

    fetch(`/api/profile/${uid}`)
      .then((r) => {
        if (r.status === 404) { setState("no-profile"); return null; }
        if (!r.ok) throw new Error("error");
        return r.json() as Promise<PageData>;
      })
      .then((d) => { if (d) { setState_data(d); setState("ready"); } })
      .catch(() => setState("error"));
  }, [router]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // ── No profile yet ────────────────────────────────────────────────────────
  if (state === "no-profile") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-2xl font-bold text-primary-600">
          ?
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900">No profile yet</p>
          <p className="mt-1 text-[13px] text-neutral-500">
            Set up your profile so others can find and book sessions with you.
          </p>
        </div>
        <Link
          href="/profile/create"
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Set up profile
        </Link>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === "error" || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-neutral-500">Something went wrong. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[13px] font-medium text-primary-600 hover:text-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { profile, user, completedSessions, avgRating } = data;
  const isAuror = user.role === "AUROR";

  const trackLabel = profile.primaryTrack
    ? (TRACK_LABELS[profile.primaryTrack] ?? profile.primaryTrack)
    : null;

  const completionScore = getProfileScore(profile, user.role);
  const missingItems    = getProfileChecklist(profile, user.role).filter((i) => !i.done);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-16">

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-6 shadow-soft">
        <div className="flex items-start gap-4">

          {/* Avatar initials */}
          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          {/* Identity */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-bold leading-snug text-neutral-900">{profile.name}</h1>
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
            {(profile.city || profile.country || profile.timezone) && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {(profile.city || profile.country) && (
                  <span className="flex items-center gap-1 text-[12px] text-neutral-400">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1Z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="6" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
                    </svg>
                    {formatLocation(profile.city, profile.country) ?? profile.country}
                  </span>
                )}
                {profile.timezone && profile.timezone !== "UTC" && (
                  <span className="flex items-center gap-1 text-[12px] text-neutral-400">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {formatTimezoneDisplay(profile.timezone)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats + edit button */}
          <div className="flex shrink-0 flex-col items-end gap-2.5">
            <Link
              href="/profile/create"
              className="rounded-lg border border-neutral-200 px-3.5 py-1.5 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              Edit Profile
            </Link>
            {isAuror && (
              <div className="flex flex-col items-end gap-0.5">
                {avgRating !== null && (
                  <p className="text-[13px] font-semibold text-amber-500">★ {avgRating.toFixed(1)}</p>
                )}
                <p className="text-[11px] text-neutral-400">{completedSessions} sessions completed</p>
              </div>
            )}
          </div>
        </div>

        {/* Track pills */}
        {(trackLabel || profile.secondaryTracks.length > 0 || profile.otherTrackLabel) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {trackLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                {trackLabel}
              </span>
            )}
            {profile.secondaryTracks.map((t) => (
              <span key={t} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                {TRACK_LABELS[t] ?? t}
              </span>
            ))}
            {profile.otherTrackLabel && (
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                {profile.otherTrackLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Completion banner ─────────────────────────────────────────────── */}
      {completionScore < 100 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-amber-800">
                Your profile is {completionScore}% complete
              </p>
              <p className="mt-0.5 text-[12px] text-amber-600">
                Complete it to improve visibility and match quality.
              </p>
            </div>
            <Link
              href="/profile/create"
              className="shrink-0 rounded-lg bg-amber-500 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Complete
            </Link>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>

          {/* Missing items */}
          {missingItems.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {missingItems.slice(0, 3).map((item) => (
                <span
                  key={item.key}
                  className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] text-amber-700"
                >
                  <span className="h-2 w-2 rounded-full border border-amber-400" />
                  {item.label}
                </span>
              ))}
              {missingItems.length > 3 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] text-amber-600">
                  +{missingItems.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── About ─────────────────────────────────────────────────────────── */}
      {profile.overview && (
        <Section title="About">
          <p className="text-[13px] leading-relaxed text-neutral-700 whitespace-pre-wrap">
            {profile.overview}
          </p>
        </Section>
      )}

      {/* ── Experience ───────────────────────────────────────────────────── */}
      {(profile.experience ?? []).length > 0 && (
        <Section title="Experience">
          <div className="flex flex-col">
            {profile.experience!.map((e, i) => (
              <div key={i} className={cn("flex gap-4", i > 0 && "border-t border-neutral-100 pt-5 mt-5")}>
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary-400" />
                  {i < profile.experience!.length - 1 && (
                    <div className="mt-2 w-px flex-1 bg-neutral-100" />
                  )}
                </div>
                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
                  <p className="text-[13px] font-semibold text-neutral-900">{e.role}</p>
                  <p className="text-[12px] font-medium text-neutral-600">{e.company}</p>
                  {fmtDuration(e) && (
                    <p className="text-[11px] text-neutral-400">{fmtDuration(e)}</p>
                  )}
                  {e.description && (
                    <p className="mt-2 text-[12px] leading-relaxed text-neutral-500 whitespace-pre-wrap">
                      {e.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Education ────────────────────────────────────────────────────── */}
      {(profile.education ?? []).length > 0 && (
        <Section title="Education">
          <div className="flex flex-col">
            {profile.education!.map((e, i) => (
              <div key={i} className={cn("flex gap-4", i > 0 && "border-t border-neutral-100 pt-5 mt-5")}>
                <div className="pt-1">
                  <span className="block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-neutral-900">{e.school}</p>
                  <p className="text-[12px] font-medium text-neutral-600">
                    {e.degree}{e.course ? ` · ${e.course}` : ""}
                  </p>
                  {e.year && <p className="text-[11px] text-neutral-400">{e.year}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Skills & Domains ─────────────────────────────────────────────── */}
      {(profile.skills.length > 0 || profile.domains.length > 0) && (
        <Section title="Skills & Domains">
          <div className="flex flex-col gap-4">
            {profile.skills.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span key={s} className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-[12px] font-medium text-primary-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.domains.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Domains</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.domains.map((d) => (
                    <span key={d} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[12px] font-medium text-neutral-600">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Goals (Seeker) ────────────────────────────────────────────────── */}
      {!isAuror && (profile.targetRoles.length > 0 || profile.dreamCompanies.length > 0 || profile.dreamRole) && (
        <Section title="Goals">
          <div className="flex flex-col gap-4">
            {profile.dreamRole && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Dream role</p>
                <p className="text-[13px] font-medium text-neutral-700">{profile.dreamRole}</p>
              </div>
            )}
            {profile.targetRoles.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Target roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.targetRoles.map((r) => (
                    <span key={r} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700">{r}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.dreamCompanies.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Dream companies</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.dreamCompanies.map((c) => (
                    <span key={c} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-700">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Mentoring (Auror) ─────────────────────────────────────────────── */}
      {isAuror && (profile.sessionTypes.length > 0 || profile.sessionTags.length > 0) && (
        <Section title="Mentoring">
          <div className="flex flex-col gap-4">
            {profile.sessionTypes.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Session types</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.sessionTypes.map((t) => (
                    <span key={t} className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[12px] font-medium text-primary-700">
                      {t === "coffee_chat" ? "Coffee Chat" : t === "mock_interview" ? "Mock Interview" : t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.sessionTags.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Can help with</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.sessionTags.map((t) => (
                    <span key={t} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[12px] font-medium text-neutral-600">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Resume & Portfolio ────────────────────────────────────────────── */}
      {(profile.resumeUrl || profile.portfolioLinks.length > 0) && (
        <Section title="Links">
          <div className="flex flex-wrap gap-2">
            {profile.resumeUrl && (
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
                View Resume
              </a>
            )}
            {profile.portfolioLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1Z" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 6h10M6 1c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6 1c1.5 1.5 2 3 2 5s-.5 3.5-2 5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Portfolio{profile.portfolioLinks.length > 1 ? ` ${i + 1}` : ""}
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* ── Footer edit CTA ──────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
        <Link
          href="/profile/create"
          className="rounded-xl border border-neutral-200 px-5 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          Edit Profile
        </Link>
      </div>

    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
        {title}
      </p>
      {children}
    </div>
  );
}
