"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Auth pages get logo-only — no nav links
const AUTH_ROUTES = ["/login", "/signup", "/role-select"];

// Landing page section links — only shown on "/" when logged out
const LANDING_LINKS = [
  { label: "Problem",      href: "/#problem"         },
  { label: "How it works", href: "/#how-it-works"    },
  { label: "Features",     href: "/#features"        },
  { label: "Who it's for", href: "/#who-is-this-for" },
];

export function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("userId"));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("userId");
    router.push("/login");
  }

  const isAuthPage    = AUTH_ROUTES.includes(pathname);
  const isLandingPage = pathname === "/";

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

        <nav className="flex items-center gap-6">
          {isAuthPage ? (
            // Auth pages (/login, /signup, /role-select): no nav links
            null
          ) : isLandingPage && !isLoggedIn ? (
            // Landing page, logged out: show marketing section links
            LANDING_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))
          ) : (
            // App pages (dashboard, profile, etc.) or logged-in landing: minimal app header
            <>
              <Link
                href="/dashboard"
                className="text-[13px] font-medium text-neutral-600 no-underline hover:text-neutral-900"
              >

                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900"
              >
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
