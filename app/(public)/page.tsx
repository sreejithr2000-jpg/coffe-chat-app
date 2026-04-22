import Link from "next/link";

// ── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  id,
  className = "",
  padding = "py-10 sm:py-14",
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
    <div className="group flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
  priceNote,
  description,
  features,
  cta,
  href,
  highlight = false,
  comingSoon = false,
  disclaimer,
}: {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  cta: string;
  href?: string;
  highlight?: boolean;
  comingSoon?: boolean;
  disclaimer?: string;
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
        {priceNote && (
          <p className={`mt-0.5 text-[11px] ${highlight ? "text-primary-200" : "text-neutral-400"}`}>
            {priceNote}
          </p>
        )}
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
            <span className={`text-[13px] ${highlight ? "text-primary-50" : "text-neutral-600"}`}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        {comingSoon ? (
          <span className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold opacity-60 cursor-not-allowed ${
            highlight ? "bg-white text-primary-700" : "bg-neutral-100 text-neutral-500"
          }`}>
            {cta}
          </span>
        ) : (
          <Link href={href ?? "/signup"}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold no-underline transition-colors ${
              highlight ? "bg-white text-primary-700 hover:bg-primary-50" : "bg-primary-600 text-white hover:bg-primary-700"
            }`}>
            {cta}
          </Link>
        )}
        {disclaimer && (
          <p className={`text-center text-[11px] ${highlight ? "text-primary-200" : "text-neutral-400"}`}>
            {disclaimer}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Check bullet ────────────────────────────────────────────────────────────

function Check({ color = "primary" }: { color?: "primary" | "amber" | "emerald" }) {
  const cls =
    color === "amber"   ? "bg-amber-50 text-amber-600" :
    color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                          "bg-primary-50 text-primary-600";
  return (
    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${cls}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 4L3.5 6L6.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="-mx-6 -my-10 lg:-mx-8">

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white py-14 sm:py-24">
        {/* Subtle grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIzNjNlYiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDQiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==\")"
          }}
        />

        {/* Radial glow — Lumora light */}
        <div
          aria-hidden
          className="lumora-glow pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)" }}
        />

        {/* Floating orbs */}
        <div aria-hidden className="pointer-events-none absolute left-[8%] top-[18%] lumora-float">
          <div className="h-3 w-3 rounded-full bg-primary-200 opacity-60" />
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[12%] top-[28%] lumora-float-slow">
          <div className="h-2 w-2 rounded-full bg-primary-300 opacity-40" />
        </div>
        <div aria-hidden className="pointer-events-none absolute left-[18%] bottom-[20%] lumora-float-slow">
          <div className="h-4 w-4 rounded-full bg-amber-200 opacity-30" />
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[20%] bottom-[30%] lumora-float">
          <div className="h-2.5 w-2.5 rounded-full bg-primary-200 opacity-50" />
        </div>

        {/* Content */}
        <div className="relative mx-auto w-full max-w-3xl px-6 text-center lg:px-8">
          <span className="lumora-badge-pulse inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[12px] font-semibold text-primary-700">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Now in early access
          </span>

          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Clarity, momentum,{" "}
            <br className="hidden sm:block" />
            <span className="text-primary-600">real mentors.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg">
            Lumora connects you with practitioners who&apos;ve walked your path.
            Build a profile that tells your real story, and book focused sessions
            matched to your goals.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="lumora-shimmer-btn inline-flex h-11 items-center rounded-xl bg-primary-600 px-7 text-[14px] font-semibold text-white no-underline shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
              style={{
                background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 40%, #2563eb 100%)",
              }}
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-200 bg-white px-6 text-[14px] font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-4 text-[12px] text-neutral-400">
            No credit card required · Free to get started
          </p>
        </div>
      </section>

      {/* ── 2. Problem → Solution ─────────────────────────────────────────── */}
      <Section id="problem" className="bg-white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-red-500">
              The problem
            </p>
            <h2 className="mb-5 text-2xl font-bold text-neutral-900 sm:text-3xl">
              Career advice is broken
            </h2>
            <ul className="flex flex-col gap-4">
              {(
                [
                  {
                    heading: "Generic LinkedIn advice",
                    body: <>Cold outreach on platforms like <span className="font-medium text-neutral-600">LinkedIn</span> is slow, uncertain, and rarely reaches the right person.</>,
                  },
                  {
                    heading: "No one to ask",
                    body: "Warm intros require a network you don't have yet. Most people are left guessing who to reach out to — and how.",
                  },
                  {
                    heading: "Expensive coaching",
                    body: "Professional career coaches charge $200–$500/hr, putting real, specific feedback out of reach for most.",
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
            <h2 className="mb-5 text-2xl font-bold text-neutral-900 sm:text-3xl">
              Real conversations. Real practitioners.
            </h2>
            <ul className="flex flex-col gap-4">
              {[
                {
                  heading: "Practitioners, not coaches",
                  body: "Aurors are working professionals who've held the exact roles you're targeting — on your timeline, not theirs.",
                },
                {
                  heading: "Structured and focused",
                  body: "Submit your questions before the session so every minute of the conversation counts.",
                },
                {
                  heading: "Free to get started",
                  body: "Seekers can request sessions at no cost. Aurors give back without committing their whole evening.",
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
      <Section id="how-it-works" className="bg-neutral-50">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            How it works
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Up and running in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] text-neutral-500">
            From signup to your first session — the whole flow takes minutes, not days.
          </p>
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div aria-hidden className="absolute left-0 right-0 top-[28px] hidden h-px bg-neutral-200 lg:block"
            style={{ left: "calc(16.67% + 28px)", right: "calc(16.67% + 28px)" }} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create your profile",
                body: "Sign up and complete guided onboarding in under 5 minutes. Add your experience, skills, tracks, and goals.",
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
                title: "Browse Aurors",
                body: "Filter by track, skills, and session type. Browse verified profiles, read reviews, and find the right match for your goals.",
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
                body: "Request a coffee chat or mock interview. Submit your questions upfront so every minute counts. Your Auror accepts and a meeting link is created automatically.",
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

      {/* ── 4. Who is this for? — three roles ────────────────────────────── */}
      <Section id="who-is-this-for" className="bg-white">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            Three roles, one platform
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Who is Lumora for?</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-neutral-500">
            Whether you&apos;re seeking guidance, offering expertise, or supporting peers — there&apos;s a place for you.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* Seeker */}
          <div className="group flex flex-col items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M11 14C8.5 11.5 4.5 11 2 12.5C4 13.5 6 15.5 7.5 17C9 15.5 10 14.5 11 14Z" fill="#F59E0B" fillOpacity="0.25" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
                <path d="M17 14C19.5 11.5 23.5 11 26 12.5C24 13.5 22 15.5 20.5 17C19 15.5 18 14.5 17 14Z" fill="#F59E0B" fillOpacity="0.25" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
                <circle cx="14" cy="14" r="4.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.4"/>
                <circle cx="14" cy="14" r="1.5" fill="#D97706"/>
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[18px] font-semibold text-neutral-900">Seeker</h3>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                Actively preparing for your next role. Learn from practitioners who&apos;ve been exactly where you&apos;re trying to go.
              </p>
            </div>
            <ul className="flex w-full flex-col gap-2 text-left">
              {[
                "Prepare with practitioners from target companies",
                "Learn from real experience — not generic advice",
                "Capture key takeaways from every session",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check color="amber" />
                  <span className="text-[12px] text-neutral-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Auror */}
          <div className="group flex flex-col items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary-200 bg-primary-50">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
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
                An experienced practitioner who mentors the next generation and makes a measurable impact on real careers.
              </p>
            </div>
            <ul className="flex w-full flex-col gap-2 text-left">
              {[
                "Focused sessions that fit your schedule",
                "See seekers' questions before the call",
                "Track your sessions, ratings, and reviews",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check color="primary" />
                  <span className="text-[12px] text-neutral-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prefect — Coming Soon */}
          <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center opacity-80 sm:col-span-2 lg:col-span-1">
            {/* Coming Soon badge */}
            <span className="absolute right-4 top-4 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Coming Soon
            </span>

            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4L17 10L23.5 11L19 15.5L20.5 22L14 18.5L7.5 22L9 15.5L4.5 11L11 10L14 4Z" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="14" cy="13" r="2.5" fill="#10B981" opacity="0.6"/>
              </svg>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-[18px] font-semibold text-neutral-900">Prefect</h3>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                A peer-level guide who supports through collaborative practice, accountability, and recent hiring experience.
              </p>
            </div>

            <ul className="flex w-full flex-col gap-2 text-left">
              {[
                "Peer resume review and feedback",
                "Accountability and practice sessions",
                "Recent hiring process insights",
                "Student and early-career support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check color="emerald" />
                  <span className="text-[12px] text-neutral-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </Section>

      {/* ── 5. Features ───────────────────────────────────────────────────── */}
      <Section id="features" className="bg-neutral-50">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
                Features
              </p>
              <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                Built for real conversations
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                Every Auror profile is built around structured, verifiable information — not just a bio. Know exactly who you&apos;re talking to before you book.
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

          {/* Profile mock card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-100 bg-white p-5 shadow-card transition-shadow hover:shadow-md">
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

        {/* Feature cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            title="Smart search & filters"
            description="Filter by track, skills, domains, and session type. Find exactly who you need — not just who's available."
          />
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 3V5M12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.5 11l2 2 4-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Booking system"
            description="Send a session request with up to 5 questions. Aurors review and accept — then a meeting link is created automatically."
          />
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4h12M3 8h8M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M13 12l.8.8 1.7-1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Key takeaways"
            description="After each session, capture what you learned as structured bullet points — a private record of your career growth."
          />
          <FeatureCard
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.8 3.6L15 6.3l-3 2.9.7 4.1L9 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
            title="Ratings & reviews"
            description="Seekers rate and review Aurors after every session. Ratings are public; written feedback is anonymous — honest without being cruel."
          />
        </div>
      </Section>

      {/* ── 6. Pricing ────────────────────────────────────────────────────── */}
      <Section id="pricing" className="bg-white">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
            Pricing
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-neutral-500">
            Free to get started. Upgrade when you need more.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <PricingCard
            name="Starter"
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
            price="from $9.99"
            priceNote="*Pricing may vary at launch"
            description="For power users and teams"
            features={[
              "Everything in Starter",
              "Unlimited session requests",
              "Priority matching with top Aurors",
              "Video call integration",
              "AI session summaries",
            ]}
            cta="Coming Soon"
            comingSoon
            highlight
            disclaimer="*Pricing may vary at launch."
          />
        </div>
      </Section>

      {/* ── 7. FAQ ────────────────────────────────────────────────────────── */}
      <Section className="bg-neutral-50">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary-600">
              FAQ
            </p>
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Common questions</h2>
          </div>

          <div className="flex flex-col divide-y divide-neutral-100">
            {[
              {
                q: "Is Lumora a job placement service?",
                a: "No. Lumora is an educational and networking platform. It helps users learn, prepare, and grow through guided conversations with experienced practitioners. We do not place candidates in roles or guarantee employment outcomes.",
              },
              {
                q: "Can mentors guarantee referrals or jobs?",
                a: "No. Outcomes depend on many individual factors outside any platform's control. Lumora does not guarantee interviews, referrals, or job offers. Advice shared reflects personal experience and perspective.",
              },
              {
                q: "Who are Aurors?",
                a: "Aurors are working professionals who volunteer to host focused sessions on Lumora. They set their own availability and decide how many sessions to take on. They are informal mentors — people who've walked the path you're on and want to help.",
              },
              {
                q: "What is a Prefect?",
                a: "Prefect is an upcoming peer-support role on Lumora. Prefects will be able to offer collaborative practice, peer resume review, accountability sessions, and early-career guidance. This role is coming soon.",
              },
              {
                q: "Are sessions recorded?",
                a: "Sessions are not recorded by default on Lumora. Any recording would require the explicit agreement of both parties and must comply with applicable laws and platform policies.",
              },
              {
                q: "Can I choose who I speak with?",
                a: "Yes. Seekers browse Auror profiles independently and request sessions based on fit — track, skills, experience, and session type. You are never matched without your input.",
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

      {/* ── 8. Platform disclaimer (replaces hype CTA) ────────────────────── */}
      <section className="border-t border-neutral-100 bg-white py-12">
        <div className="mx-auto w-full max-w-3xl px-6 text-center lg:px-8">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-neutral-400">
            Important to know
          </p>
          <h2 className="mb-6 text-xl font-bold text-neutral-800 sm:text-2xl">
            A platform built for growth, not guarantees
          </h2>
          <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {[
              "Lumora provides educational and networking support only.",
              "We do not guarantee jobs, referrals, interviews, or outcomes.",
              "Advice shared by users reflects personal experience.",
              "Users should exercise professional judgment in all decisions.",
              "Respectful, professional conduct is required on the platform.",
              "Sessions are for guidance — not a substitute for legal or financial advice.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="text-[12px] leading-relaxed text-neutral-600">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup"
              className="inline-flex h-10 items-center rounded-xl bg-primary-600 px-6 text-[13px] font-semibold text-white no-underline transition-colors hover:bg-primary-700">
              Get started free
            </Link>
            <Link href="/login"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 bg-white px-5 text-[13px] font-medium text-neutral-700 no-underline hover:bg-neutral-50">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 bg-white py-10">
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">

            {/* Brand */}
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">L</span>
                <span className="text-[15px] font-semibold text-neutral-900">Lumora</span>
              </div>
              <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-neutral-400 sm:text-left">
                Career clarity through real conversations.
              </p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
              {[
                { label: "Problem",      href: "/#problem"         },
                { label: "How it works", href: "/#how-it-works"    },
                { label: "Who it's for", href: "/#who-is-this-for" },
                { label: "Features",     href: "/#features"        },
                { label: "Pricing",      href: "/#pricing"         },
                { label: "Sign up",      href: "/signup"           },
                { label: "Log in",       href: "/login"            },
              ].map((link) => (
                <Link key={link.label} href={link.href}
                  className="text-[12px] text-neutral-500 no-underline hover:text-neutral-900">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Legal */}
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <div className="flex items-center gap-3">
                {[
                  { label: "Terms",   href: "#" },
                  { label: "Privacy", href: "#" },
                  { label: "Contact", href: "#" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    className="text-[12px] text-neutral-400 no-underline hover:text-neutral-700">
                    {l.label}
                  </Link>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">
                © {new Date().getFullYear()} Lumora. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
