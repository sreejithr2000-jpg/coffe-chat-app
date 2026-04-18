"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/signup", "/role-select"];

const LANDING_LINKS = [
  { label: "Problem",      href: "/#problem"         },
  { label: "How it works", href: "/#how-it-works"    },
  { label: "Who it's for", href: "/#who-is-this-for" },
  { label: "Features",     href: "/#features"        },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo — always visible */}
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-900 no-underline hover:text-neutral-900"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
            CC
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            CoffeeChat
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {isAuthPage ? (
            // Auth pages: logo only, no nav links
            null
          ) : (
            // Landing page: section links only
            LANDING_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))
          )}
        </nav>
      </div>
    </header>
  );
}
