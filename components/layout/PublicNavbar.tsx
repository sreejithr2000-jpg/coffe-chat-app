"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const AUTH_ROUTES = ["/login", "/signup", "/role-select"];

const LANDING_LINKS = [
  { label: "Problem",      href: "/#problem"         },
  { label: "How it works", href: "/#how-it-works"    },
  { label: "Who it's for", href: "/#who-is-this-for" },
  { label: "Features",     href: "/#features"        },
  { label: "Pricing",      href: "/#pricing"         },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo — always visible */}
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-900 no-underline hover:text-neutral-900"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Lumora
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        {!isAuthPage && (
          <nav className="hidden sm:flex items-center gap-6">
            {LANDING_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Mobile hamburger — hidden above sm, hidden on auth pages */}
        {!isAuthPage && (
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {!isAuthPage && mobileOpen && (
        <div className="sm:hidden border-t border-neutral-100 bg-white shadow-md">
          <nav className="flex flex-col px-4 py-3">
            {LANDING_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-[14px] font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
