import Link from "next/link";

// ── Reusable section wrapper ────────────────────────────────────────────────

function Section({
  id,
  className = "",
  padding = "py-14",
  children,
}: {
  id?: string;
  className?: string;
  padding?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`w-full ${padding} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">{children}</div>
    </section>
  );
}

// ── Feature card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
      <p className="text-[13px] leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

// ── Pricing card ────────────────────────────────────────────────────────────

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  href,
  highlight = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-6 rounded-2xl border p-8 ${
        highlight
          ? "border-primary-200 bg-primary-600 text-white shadow-xl"
          : "border-neutral-100 bg-white shadow-card"
      }`}
    >
      <div>
        <p className={`text-[12px] font-semibold uppercase tracking-widest ${highlight ? "text-primary-200" : "text-primary-600"}`}>
          {name}
        </p>
        <p className={`mt-2 text-4xl font-bold ${highlight ? "text-white" : "text-neutral-900"}`}>
          {price}
        </p>
        <p className={`mt-1.5 text-[13px] ${highlight ? "text-primary-100" : "text-neutral-500"}`}>
          {description}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`mt-0.5 shrink-0 ${highlight ? "text-primary-200" : "text-primary-500"}`}>
              <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={`text-[13px] ${highlight ? "text-primary-50" : "text-neutral-600"}`}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <Link href={href}
        className={`mt-auto inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold no-underline transition-colors ${
          highlight ? "bg-white text-primary-700 hover:bg-primary-50" : "bg-primary-600 text-white hover:bg-primary-700"
        }`}>
        {cta}
      </Link>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="-mx-6 -my-10 lg:-mx-8">

      {/* ── 1. Hero — text-only, centered ───────────────────────────────── */}
      {/* Removed: right-side mentor card, stats bar */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIzNjNlYiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDQiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-60"
        />
        <div className="relative mx-auto w-full max-w-3xl px-6 text-center lg:px-8">
          <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[12px] font-semibold text-primary-700">
            Now in early access
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-neutral-900 lg:text-6xl">
            Grow your career with{" "}
            <span className="text-primary-600">real mentors</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-500">
            Complete guided onboarding in minutes, build a profile that tells
            your real story, and book sessions with practitioners matched to
            your goals.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-xl bg-primary-600 px-6 text-[14px] font-semibold text-white no-underline shadow-sm hover:bg-primary-700"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-200 bg-white px-6 text-[14px] font-medium text-neutral-700 no-underline hover:bg-neutral-50"
            >
              Log in
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-neutral-400">
            No credit card required · Join 200+ seekers on the platform
          </p>
        </div>
      </section>

      {/* ── 2. Problem → Solution ─────────────────────────────────────────── */}
      {/* Moved: above How it works */}
      <Section id="problem" className="bg-white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-red-500">
              The problem
            </p>
            <h2 className="mb-5 text-3xl font-bold text-neutral-900">
              Career advice is broken
            </h2>
            <ul className="flex flex-col gap-4">
              {(
                [
                  {
                    heading: "Generic LinkedIn advice",
                    body: <>Traditional networking relies on cold outreach with uncertain outcomes. Finding the right person — and getting a response — is frustrating, especially on platforms like{" "}<span className="font-medium text-neutral-600">LinkedIn</span>.</>,
                  },
                  {
                    heading: "No one to ask",
                    body: "Warm intros require a network you don't have yet. Most people are left guessing who to reach out to, and how.",
                  },
                  {
                    heading: "Expensive coaching",
                    body: "Professional career coaches charge $200–$500/hr, putting real feedback out of reach.",
                  },
                ] as { heading: string; body: React.ReactNode }[]
              ).map((item) => (
                <li key={item.heading} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-800">{item.heading}</p>
                    <p className="text-[13px] text-neutral-500">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
              The solution
            </p>
            <h2 className="mb-5 text-3xl font-bold text-neutral-900">
              Real conversations with real practitioners
            </h2>
            <ul className="flex flex-col gap-4">
              {[
                {
                  heading: "Practitioners, not coaches",
                  body: "Aurors are working professionals who've done the exact job you're targeting.",
                },
                {
                  heading: "Structured, async-first",
                  body: "Submit questions before the session so every minute counts.",
                },
                {
                  heading: "Free to get started",
                  body: "Seekers can request sessions at no cost. Aurors give back without losing half their evening.",
                },
              ].map((item) => (
                <li key={item.heading} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-800">{item.heading}</p>
                    <p className="text-[13px] text-neutral-500">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 3. How it works ───────────────────────────────────────────────── */}
      {/* Removed: "Start onboarding" button */}
      <Section id="how-it-works" className="bg-neutral-50">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            How it works
          </p>
          <h2 className="text-3xl font-bold text-neutral-900">
            Up and running in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] text-neutral-500">
            From signup to your first session — the whole flow takes minutes,
            not days.
          </p>
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div aria-hidden className="absolute left-0 right-0 top-[28px] hidden h-px bg-neutral-200 lg:block" style={{ left: "calc(16.67% + 28px)", right: "calc(16.67% + 28px)" }} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create your profile",
                body: "Sign up and complete our guided multi-step onboarding. Add your experience, skills, tracks, and goals — it takes under 5 minutes.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3.5 18.5C3.5 15.462 6.962 13 11 13s7.5 2.462 7.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M15 4l1.5 1.5L19 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Search Aurors",
                body: "Filter by track, skills, and session type. Browse verified profiles, read ratings and reviews, and find the right match for your goals.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M15 15l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 10h4M10 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Book a session",
                body: "Request a coffee chat or mock interview. Submit your questions upfront so every minute counts. Your Auror accepts and shares a meeting link.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2.5 9.5h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 2.5v4M15 2.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 13.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-600">
                  {item.icon}
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-neutral-900">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 4. Who is this for? ───────────────────────────────────────────── */}
      {/* Removed: "Join as a Seeker" and "Join as an Auror" buttons */}
      <Section id="who-is-this-for" className="bg-white">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            Two roles, one platform
          </p>
          <h2 className="text-3xl font-bold text-neutral-900">Who is this for?</h2>
        </div>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Seeker card */}
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-soft">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 14C8.5 11.5 4.5 11 2 12.5C4 13.5 6 15.5 7.5 17C9 15.5 10 14.5 11 14Z" fill="#F59E0B" fillOpacity="0.25" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
                <path d="M17 14C19.5 11.5 23.5 11 26 12.5C24 13.5 22 15.5 20.5 17C19 15.5 18 14.5 17 14Z" fill="#F59E0B" fillOpacity="0.25" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
                <circle cx="14" cy="14" r="4.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.4"/>
                <circle cx="14" cy="14" r="1.5" fill="#D97706"/>
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[18px] font-semibold text-neutral-900">Seeker</h3>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                You&apos;re actively preparing for your next role — learning from
                practitioners who&apos;ve been exactly where you&apos;re trying to go.
              </p>
            </div>
            <ul className="flex w-full flex-col gap-2 text-left">
              {[
                "Prepare with practitioners from your target companies",
                "Learn from real experience — not generic advice",
                "Capture key takeaways from every session",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[12px] text-neutral-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Auror card */}
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-soft">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary-200 bg-primary-50">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="14" y1="2"  x2="14" y2="6"  stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
                <line x1="14" y1="22" x2="14" y2="26" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
                <line x1="2"  y1="14" x2="6"  y2="14" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
                <line x1="22" y1="14" x2="26" y2="14" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
                <line x1="5.5"  y1="5.5"  x2="8.3"  y2="8.3"  stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                <line x1="19.7" y1="19.7" x2="22.5" y2="22.5" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                <line x1="22.5" y1="5.5"  x2="19.7" y2="8.3"  stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                <line x1="8.3"  y1="19.7" x2="5.5"  y2="22.5" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                <path d="M14 8L19.5 10.5V15.5C19.5 18.5 14 21 14 21C14 21 8.5 18.5 8.5 15.5V10.5L14 8Z" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="14" cy="15" r="1.8" fill="#2563EB" opacity="0.7"/>
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[18px] font-semibold text-neutral-900">Auror</h3>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                You&apos;re an experienced practitioner who wants to mentor the
                next generation and make a measurable impact on real careers.
              </p>
            </div>
            <ul className="flex w-full flex-col gap-2 text-left">
              {[
                "Mentor through focused sessions that actually fit your schedule",
                "See seekers' questions in advance — every minute counts",
                "Build impact: track your sessions, ratings, and written reviews",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[12px] text-neutral-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 5. Features (merged profiles + lifecycle cards) ─────────────── */}
      {/* Renamed: "Profiles" → "Features" */}
      <Section id="features" className="bg-neutral-50">
        {/* Top: feature copy + profile mock card */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
                Features
              </p>
              <h2 className="text-3xl font-bold text-neutral-900">
                Features that actually matter
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-neutral-500">
                Every Auror profile is built around structured, verifiable
                information — not just a bio. So you know exactly who you&apos;re
                talking to before you book.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Verified experience", detail: "Structured work history with roles, companies, and timelines — auto-calculated total experience." },
                { label: "Skills & tracks",     detail: "Primary and secondary tracks, skills, and domain tags — built for smart filtering." },
                { label: "Session types",       detail: "Know upfront whether an Auror offers Coffee Chats, Mock Interviews, or both." },
                { label: "Ratings & reviews",   detail: "Star ratings and written reviews from real sessions. Visible to all, anonymous by default." },
              ].map((item) => (
                <li key={item.label} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-800">{item.label}</p>
                    <p className="text-[12px] text-neutral-500">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700">AK</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-neutral-900">Anya Kowalski</p>
                  <p className="text-[12px] text-neutral-500">Senior PM at Stripe</p>
                  <p className="text-[11px] text-neutral-400">8 yrs total experience</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[13px] font-semibold text-amber-500">★ 4.9</span>
                  <span className="text-[10px] text-neutral-400">24 sessions</span>
                </div>
              </div>
              <div className="my-3 h-px bg-neutral-100" />
              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />Product Management
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">Software Engineering</span>
              </div>
              <div className="mb-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {["figma", "product strategy", "roadmapping", "fintech"].map((s) => (
                    <span key={s} className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 border-t border-neutral-100 pt-3">
                <span className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700">☕ Coffee Chat</span>
                <span className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700">🎯 Mock Interview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: feature cards — no separate section header */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            title="Smart search & filters"
            description="Filter Aurors by track, skills, domains, and session type. Find exactly who you need — not just who's available."
          />
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 3V5M12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.5 11l2 2 4-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Booking system"
            description="Send a session request with up to 5 questions. Aurors review and accept — then a booking and meeting link are created automatically."
          />
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4h12M3 8h8M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M13 12l.8.8 1.7-1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Key takeaways"
            description="After each session, capture what you learned as structured bullet points. Private to you — a running record of your career growth."
          />
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.8 3.6L15 6.3l-3 2.9.7 4.1L9 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
            title="Ratings & reviews"
            description="Seekers rate and review Aurors after every session. Ratings are public; written feedback is anonymous — honest without being cruel."
          />
        </div>
      </Section>

      {/* ── 6. Testimonial ────────────────────────────────────────────────── */}
      <Section className="bg-neutral-50" padding="py-10">
        <div className="flex flex-col items-center text-center">
          <p className="mb-8 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            What people are saying
          </p>

          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 18 18" fill="#2563EB" className="text-primary-600">
                  <path d="M9 1l2.3 4.6 5 .7-3.6 3.5.9 5L9 12.4l-4.6 2.4.9-5L1.7 6.3l5-.7L9 1z"/>
                </svg>
              ))}
            </div>

            <blockquote className="text-xl font-medium leading-relaxed text-neutral-800">
              &ldquo;I had my first mock interview with an Auror who&apos;d literally
              been on the interview panel at my target company. The feedback I
              got in 30 minutes was more valuable than weeks of leetcode
              grinding.&rdquo;
            </blockquote>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700">
                JL
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-neutral-900">Jamie L.</p>
                <p className="text-[12px] text-neutral-500">Software Engineer · Now at Figma</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 9. Pricing ────────────────────────────────────────────────────── */}
      <Section id="pricing" className="bg-white">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            Pricing
          </p>
          <h2 className="text-3xl font-bold text-neutral-900">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-neutral-500">
            Free to get started. Upgrade when you need more.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <PricingCard
            name="Free"
            price="$0"
            description="Forever free — no credit card needed"
            features={[
              "Up to 10 session requests / week",
              "Bonus slots when you complete sessions",
              "In-app messaging",
              "Ratings, reviews & takeaways",
              "Access all Auror profiles",
            ]}
            cta="Create free account"
            href="/signup"
          />
          <PricingCard
            name="Pro"
            price="Coming soon"
            description="For power users and teams"
            features={[
              "Everything in Free",
              "Unlimited session requests",
              "Priority matching with top Aurors",
              "Video call integration",
              "AI session summaries",
            ]}
            cta="Join the waitlist"
            href="/signup"
            highlight
          />
        </div>
      </Section>

      {/* ── 10. FAQ ───────────────────────────────────────────────────────── */}
      <Section className="bg-neutral-50">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
              FAQ
            </p>
            <h2 className="text-3xl font-bold text-neutral-900">Common questions</h2>
          </div>

          <div className="flex flex-col divide-y divide-neutral-100">
            {[
              {
                q: "What is an Auror?",
                a: "An Auror is a working professional who volunteers to host coffee chats and mock interviews on CoffeeChat. They set their own availability and decide how many sessions to take on. Think of them as an informal mentor — someone who's walked the path you're on and wants to help.",
              },
              {
                q: "Is CoffeeChat free to use?",
                a: "Yes — Seekers can request sessions, message Aurors, and leave reviews entirely for free. Aurors also use the platform at no cost. A Pro tier is coming soon for power users who need higher session limits and integrations.",
              },
              {
                q: "How are sessions conducted?",
                a: "Sessions happen over video call. You'll receive a meeting link in the booking confirmation. The Auror initiates the in-app chat, so you can align on agenda before the call and follow up afterward.",
              },
              {
                q: "What happens if an Auror doesn't respond to my request?",
                a: "Requests expire automatically after a set window. If a request expires or is rejected, your weekly slot count is restored so you can send another. The system is designed to be fair — you're never penalised for an Auror's inaction.",
              },
              {
                q: "How does onboarding work?",
                a: "After you create an account and choose your role, you'll complete a short 4-step profile setup. Add your experience, skills, tracks, and goals. The whole process takes under 5 minutes and you can update it any time.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5 [&>summary]:cursor-pointer">
                <summary className="flex list-none items-center justify-between gap-4 text-[15px] font-semibold text-neutral-900 marker:content-none">
                  {item.q}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180">
                    <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 11. Final CTA ─────────────────────────────────────────────────── */}
      <section className="bg-primary-600 py-14">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center lg:px-8">
          <h2 className="text-4xl font-bold text-white">
            Your next career breakthrough
            <br />
            is one conversation away.
          </h2>
          <p className="max-w-md text-[15px] text-primary-100">
            Join CoffeeChat, build your profile, and book your first session
            with an Auror who&apos;s done exactly what you&apos;re trying to do.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup"
              className="inline-flex h-11 items-center rounded-xl bg-white px-6 text-[14px] font-semibold text-primary-700 no-underline hover:bg-primary-50">
              Create account
            </Link>
            <Link href="/login"
              className="inline-flex h-11 items-center rounded-xl border border-primary-400 px-6 text-[14px] font-medium text-white no-underline hover:bg-primary-700">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 bg-white py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
              CC
            </span>
            <span className="text-[15px] font-semibold text-neutral-900">CoffeeChat</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: "How it works", href: "/#how-it-works" },
              { label: "Features",     href: "/#features"     },
              { label: "Pricing",      href: "/#pricing"      },
              { label: "Sign up",      href: "/signup"        },
              { label: "Log in",       href: "/login"         },
            ].map((link) => (
              <Link key={link.label} href={link.href}
                className="text-[13px] text-neutral-500 no-underline hover:text-neutral-900">
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-[12px] text-neutral-400">
            © {new Date().getFullYear()} CoffeeChat. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
