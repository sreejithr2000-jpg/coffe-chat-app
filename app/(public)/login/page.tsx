"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev mock login
  const [mockLoading, setMockLoading] = useState<UserRole | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }

      localStorage.setItem("userId", data.userId);
      router.push(data.hasProfile ? "/dashboard" : "/role-select");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMockLogin(role: UserRole) {
    setMockLoading(role);
    try {
      const res = await fetch("/api/auth/mock-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      localStorage.setItem("userId", data.userId);
      router.push("/dashboard");
    } catch {
      setError("Mock login failed.");
    } finally {
      setMockLoading(null);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card padding="lg">
          {/* Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <span className="text-lg font-bold text-white">CC</span>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Sign in</h1>
            <p className="mt-1 text-sm text-neutral-500">Welcome back</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              disabled={submitting}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />

            {error && <p className="text-[12px] text-red-600">{error}</p>}

            <Button type="submit" isLoading={submitting} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary-600 hover:underline">
              Sign up
            </Link>
          </p>

          {/* Dev section */}
          <div className="mt-6 border-t border-neutral-100 pt-5">
            <p className="mb-3 text-center text-[11px] font-medium text-neutral-400">
              Dev — mock login
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMockLogin("SEEKER")}
                disabled={mockLoading !== null}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-[12px] font-medium text-neutral-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 disabled:opacity-50 transition-colors"
              >
                {mockLoading === "SEEKER" ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                ) : "🔍"}
                Seeker
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin("AUROR")}
                disabled={mockLoading !== null}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-[12px] font-medium text-neutral-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50 transition-colors"
              >
                {mockLoading === "AUROR" ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                ) : "✨"}
                Auror
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
