"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationBell";

export function AppNavbar() {
  const router = useRouter();

  function handleLogout() {
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
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
            CC
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            CoffeeChat
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Home
          </Link>
          <Link
            href="/profile"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            My Profile
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
      </div>
    </header>
  );
}
