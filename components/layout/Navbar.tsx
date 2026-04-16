import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo */}
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

        {/* Right side — Clerk <UserButton /> replaces these links when auth is added */}
        <nav className="flex items-center gap-5">
          <Link
            href="/#features"
            className="text-[13px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-[13px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className="text-[13px] font-medium text-neutral-600 no-underline hover:text-neutral-900"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-8 items-center rounded-lg bg-primary-600 px-3 text-[13px] font-medium text-white no-underline hover:bg-primary-700"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
