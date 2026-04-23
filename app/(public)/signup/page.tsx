"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (password !== confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Signup failed"); return; }

      localStorage.setItem("userId", data.userId);
      router.push("/role-select");
    } catch {
      setServerError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card padding="lg">
          {/* Header */}
          <div className="mb-7 text-center">
            <Image
              src="/brand/lumora-oneflow-icon.png"
              alt="Lumora OneFlow"
              width={52}
              height={52}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-xl font-semibold text-neutral-900">Create your account</h1>
            <p className="mt-0.5 text-[13px] font-semibold" style={{ color: "#8A62E2" }}>Real guidance. Real growth.</p>
            <p className="mt-1 text-sm text-neutral-500">Join Lumora OneFlow — it&apos;s free</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              autoFocus
              disabled={submitting}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              disabled={submitting}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
              autoComplete="new-password"
              disabled={submitting}
            />

            {serverError && <p className="text-[12px] text-red-600">{serverError}</p>}

            <Button type="submit" isLoading={submitting} className="w-full mt-1">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
