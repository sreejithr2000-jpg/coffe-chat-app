"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import type { UserRole } from "@/types";

export default function RoleSelectPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { router.push("/login"); return; }
    setUserId(id);
  }, [router]);

  async function handleSelect(role: UserRole) {
    if (!userId || submitting) return;
    setSelected(role);
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      router.push("/profile/create");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      setSelected(null);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card padding="lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <span className="text-lg font-bold text-white">L</span>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">What brings you here?</h1>
            <p className="mt-1.5 text-sm text-neutral-500">Choose your role to continue</p>
          </div>

          {/* Role cards */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleSelect("SEEKER")}
              disabled={submitting}
              className={`group flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all disabled:cursor-not-allowed ${
                selected === "SEEKER"
                  ? "border-primary-400 bg-primary-50"
                  : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50 disabled:opacity-60"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg group-hover:bg-primary-200">
                🔍
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-neutral-900">I&apos;m a Seeker</p>
                <p className="text-[12px] text-neutral-500">
                  Book coffee chats &amp; mock interviews with industry professionals
                </p>
              </div>
              {selected === "SEEKER" && submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("AUROR")}
              disabled={submitting}
              className={`group flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all disabled:cursor-not-allowed ${
                selected === "AUROR"
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg group-hover:bg-emerald-200">
                ✨
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-neutral-900">I&apos;m an Auror</p>
                <p className="text-[12px] text-neutral-500">
                  Mentor seekers through career chats &amp; mock interviews
                </p>
              </div>
              {selected === "AUROR" && submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              )}
            </button>
          </div>

          {error && <p className="mt-4 text-center text-[12px] text-red-600">{error}</p>}
        </Card>
      </div>
    </div>
  );
}
