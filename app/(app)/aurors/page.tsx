"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { TRACK_LABELS } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { Profile, Track } from "@/types";

// ── Notify Me ─────────────────────────────────────────────────────────────────

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

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
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
        "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        subscribed
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
      )}
    >
      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1.5C7 1.5 4 3 4 7v2.5H3l-.5 1H11.5l-.5-1H10V7c0-4-3-5.5-3-5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M5.5 10.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
      {subscribed ? "✓ Notified" : "Notify Me"}
    </button>
  );
}

interface AurorWithStats {
  id: string;
  profile: Profile | null;
  rating: number | null;
  reviewCount: number;
  completedSessions: number;
}

// ── Filter config ────────────────────────────────────────────────────────────

const DOMAIN_FILTERS = [
  { label: "Software",    value: "software" },
  { label: "Mechanical",  value: "mechanical" },
  { label: "Product",     value: "product" },
];

const SERVICE_FILTERS = [
  { label: "Coffee Chat",     value: "coffee_chat" },
  { label: "Mock Interview",  value: "mock_interview" },
];

// ── Search helpers ────────────────────────────────────────────────────────────

const norm = (s: string | null | undefined) => s?.toLowerCase() ?? "";

function tokenize(query: string): string[] {
  return query.toLowerCase().split(/[\s,]+/).filter(Boolean);
}

interface TokenMatch {
  nameMatch: boolean;
  roleMatch: boolean;
  skillMatch: boolean;
  domainMatch: boolean;
  companyMatch: boolean;
  serviceMatch: boolean;
}

function matchToken(auror: AurorWithStats, token: string): TokenMatch {
  const p = auror.profile;
  const experience = (p?.experience ?? []) as Array<{ company?: string }>;
  return {
    nameMatch:    norm(p?.name).includes(token),
    roleMatch:    norm(p?.currentRole).includes(token),
    skillMatch:   (p?.skills ?? []).some((s) => norm(s).includes(token)),
    domainMatch:  (p?.domains ?? []).some((d) => norm(d).includes(token)),
    companyMatch: experience.some((e) => norm(e.company).includes(token)),
    serviceMatch: (p?.sessionTypes ?? []).some((t) => norm(t).includes(token)),
  };
}

function matchesAllTokens(auror: AurorWithStats, tokens: string[]): boolean {
  return tokens.every((token) => {
    const m = matchToken(auror, token);
    return m.nameMatch || m.roleMatch || m.skillMatch || m.domainMatch || m.companyMatch || m.serviceMatch;
  });
}

function scoreAuror(
  auror: AurorWithStats,
  tokens: string[],
  domain: string | null,
  service: string | null,
): number {
  let score = 0;

  if (auror.rating) score += auror.rating * 2;

  if (domain && (auror.profile?.domains ?? []).some((d) => d.toLowerCase() === domain)) score += 3;
  if (service && (auror.profile?.sessionTypes ?? []).includes(service)) score += 2;

  for (const token of tokens) {
    const m = matchToken(auror, token);
    if (m.nameMatch)    score += 5;
    if (m.roleMatch)    score += 4;
    if (m.companyMatch) score += 3;
    if (m.domainMatch)  score += 2;
    if (m.skillMatch)   score += 1;
    if (m.serviceMatch) score += 1;
  }

  return score;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AurorsPage() {
  const [aurors, setAurors] = useState<AurorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [seekerId, setSeekerId] = useState("");

  useEffect(() => {
    setSeekerId(localStorage.getItem("userId") ?? "");
    fetch("/api/aurors")
      .then((r) => r.json() as Promise<AurorWithStats[]>)
      .then((data) => setAurors(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const tokens = tokenize(search);

    const filtered = aurors.filter((auror) => {
      const p = auror.profile;
      if (!p) return false;

      if (selectedDomain && !(p.domains ?? []).some((d) => d.toLowerCase() === selectedDomain))
        return false;

      if (selectedService && !(p.sessionTypes ?? []).includes(selectedService))
        return false;

      if (tokens.length > 0 && !matchesAllTokens(auror, tokens))
        return false;

      return true;
    });

    return [...filtered].sort(
      (a, b) =>
        scoreAuror(b, tokens, selectedDomain, selectedService) -
        scoreAuror(a, tokens, selectedDomain, selectedService)
    );
  }, [aurors, search, selectedDomain, selectedService]);

  const hasFilters = !!(search || selectedDomain || selectedService);

  function clearFilters() {
    setSearch("");
    setSelectedDomain(null);
    setSelectedService(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Find an Auror</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Browse mentors and book a coffee chat or mock interview.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        >
          <path
            d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.854 3.354 2.5 2.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name, role, skill, or topic…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4",
            "text-[13px] text-neutral-900 placeholder:text-neutral-400",
            "focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          )}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label="Clear search"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Domain
        </span>
        {DOMAIN_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={selectedDomain === f.value}
            onClick={() => setSelectedDomain(selectedDomain === f.value ? null : f.value)}
          />
        ))}
        <span className="mx-1 text-neutral-200">|</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Session
        </span>
        {SERVICE_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={selectedService === f.value}
            onClick={() => setSelectedService(selectedService === f.value ? null : f.value)}
          />
        ))}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-1 text-[11px] text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Result count */}
      {hasFilters && (
        <p className="text-[12px] text-neutral-400">
          {results.length === 0
            ? "No matches"
            : `${results.length} auror${results.length === 1 ? "" : "s"} found`}
        </p>
      )}

      {/* Grid */}
      {aurors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center">
          <p className="text-sm text-neutral-400">No Aurors have joined yet.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No matches found</p>
          <p className="mt-1 text-[12px] text-neutral-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((auror) => (
            <AurorCard key={auror.id} auror={auror} seekerId={seekerId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AurorCard({ auror, seekerId }: { auror: AurorWithStats; seekerId: string }) {
  const { profile, rating, reviewCount, completedSessions } = auror;

  const allTracks = [
    ...(profile?.primaryTrack ? [profile.primaryTrack as Track] : []),
    ...(profile?.secondaryTracks ?? []).map((t) => t as Track),
  ];

  const sessionLabels = (profile?.sessionTypes ?? []).map((t) =>
    t === "coffee_chat" ? "Coffee" : "Mock"
  );

  return (
    <Card padding="md" className="flex flex-col gap-3">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
          {profile?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-neutral-900">
            {profile?.name ?? "Unnamed Auror"}
          </p>
          {profile?.currentRole && (
            <p className="truncate text-[12px] text-neutral-500">
              {profile.currentRole}
              {(profile.totalExperience ?? 0) > 0 && (
                <span className="text-neutral-400">
                  {" "}· {profile.totalExperience} yr{profile.totalExperience === 1 ? "" : "s"}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Overview snippet */}
      {profile?.overview && (
        <p className="line-clamp-2 text-sm text-neutral-600">
          {profile.overview.slice(0, 120)}
        </p>
      )}

      {/* Tracks */}
      {allTracks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTracks.map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                i === 0
                  ? "border border-primary-200 bg-primary-50 text-primary-700"
                  : "border border-neutral-200 bg-neutral-50 text-neutral-500"
              )}
            >
              {TRACK_LABELS[t]}
            </span>
          ))}
        </div>
      )}

      {/* Signal row — 2-line layout to prevent overflow on mobile */}
      <div className="flex flex-col gap-2 border-t border-neutral-100 pt-2.5">
        {/* Stats line */}
        <div className="flex items-center gap-3">
          {rating !== null ? (
            <span className="text-[11px] font-medium text-amber-500">
              ★ {rating}
              {reviewCount > 0 && (
                <span className="ml-0.5 font-normal text-neutral-400">({reviewCount})</span>
              )}
            </span>
          ) : (
            <span className="text-[11px] text-neutral-300">No reviews</span>
          )}

          {completedSessions > 0 && (
            <>
              <span className="text-neutral-200">·</span>
              <span className="text-[11px] text-neutral-400">
                {completedSessions} session{completedSessions === 1 ? "" : "s"}
              </span>
            </>
          )}

          {sessionLabels.length > 0 && (
            <>
              <span className="text-neutral-200">·</span>
              <div className="flex gap-1">
                {sessionLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href={`/auror/${auror.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              View Profile
            </Button>
          </Link>
          <Link href={`/book/${auror.id}`} className="flex-1">
            <Button size="sm" className="w-full">
              Book Session
            </Button>
          </Link>
          <NotifyMeButton aurorId={auror.id} seekerId={seekerId} />
        </div>
      </div>
    </Card>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-primary-500 bg-primary-600 text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
      )}
    >
      {label}
    </button>
  );
}
