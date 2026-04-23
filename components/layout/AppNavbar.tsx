"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationBell";

export function AppNavbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("userId");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-neutral-900 no-underline hover:text-neutral-900"
        >
          <Image
            src="/brand/lumora-oneflow-icon.png"
            alt=""
            width={30}
            height={30}
            className="shrink-0"
            priority
          />
          <span className="text-[14px] font-bold leading-none tracking-tight text-neutral-900">
            Lumora <span style={{ color: "#8A62E2" }}>OneFlow</span>
          </span>
        </Link>

        {/* Desktop nav — hidden below md */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Home
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            My Calendar
          </Link>
          <Link
            href="/profile"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            My Profile
          </Link>
          <Link
            href="/settings"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Settings
          </Link>
          <div className="mx-1">
            <NotificationBell />
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 rounded-full border border-neutral-200 px-3.5 py-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700"
          >
            Log out
          </button>
        </nav>

        {/* Mobile: bell + hamburger — hidden above md */}
        <div className="flex md:hidden items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
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
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white shadow-md">
          <nav className="flex flex-col px-4 py-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-[14px] font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
            >
              Home
            </Link>
            <Link
              href="/calendar"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-[14px] font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
            >
              My Calendar
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-[14px] font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
            >
              My Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-[14px] font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
            >
              Settings
            </Link>
            <div className="my-2 h-px bg-neutral-100" />
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="rounded-lg px-3 py-3 text-left text-[14px] font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
