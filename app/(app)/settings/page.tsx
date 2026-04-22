"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface GoogleStatus {
  configured:  boolean;
  connected:   boolean;
  expired:     boolean;
  googleEmail: string | null;
  connectedAt: string | null;
}

// ── Google icon (reused) ──────────────────────────────────────────────────────

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M43.6 20.5H24v7h11.2C33.7 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.2-5.2C33.3 7.4 28.9 5.5 24 5.5 13.8 5.5 5.5 13.8 5.5 24S13.8 42.5 24 42.5c10.5 0 17.9-7.3 17.9-17.6 0-1.2-.1-2.3-.3-3.4z"/>
      <path fill="#34A853" d="M6.3 14.7l6.1 4.5C13.9 15.1 18.6 12 24 12c2.8 0 5.3 1 7.2 2.7l5.2-5.2C33.3 6.4 28.9 4.5 24 4.5 16.3 4.5 9.6 8.7 6.3 14.7z"/>
      <path fill="#FBBC05" d="M24 43.5c4.8 0 9.1-1.6 12.4-4.4l-5.7-4.8C28.9 35.8 26.6 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.3l-6.1 4.7C9.8 39.3 16.4 43.5 24 43.5z"/>
      <path fill="#EA4335" d="M43.6 20.5H24v7h11.2c-.8 2.3-2.5 4.2-4.7 5.5l5.7 4.8c3.4-3.1 5.3-7.7 5.3-12.8 0-1.2-.1-2.3-.3-3.4-.2-.7-.4-1.4-.6-2.1z"/>
    </svg>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 disabled:opacity-40",
        checked ? "bg-primary-600" : "bg-neutral-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{title}</p>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId]               = useState<string | null>(null);
  const [status, setStatus]               = useState<GoogleStatus | null>(null);
  const [loadState, setLoadState]         = useState<"loading" | "ready">("loading");
  const [disconnecting, setDisconnecting] = useState(false);

  // Notification preferences (localStorage-persisted, UI-only for now)
  const [emailReminders, setEmailReminders]   = useState(true);
  const [slotAlerts, setSlotAlerts]           = useState(true);

  const googleParam = searchParams.get("google");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { router.replace("/login"); return; }
    setUserId(id);

    // Load saved notification prefs
    try {
      const saved = localStorage.getItem("cc_notif_prefs");
      if (saved) {
        const prefs = JSON.parse(saved) as { emailReminders: boolean; slotAlerts: boolean };
        setEmailReminders(prefs.emailReminders ?? true);
        setSlotAlerts(prefs.slotAlerts ?? true);
      }
    } catch {}

    fetch(`/api/auth/google/status/${id}`)
      .then((r) => r.json() as Promise<GoogleStatus>)
      .then((s) => { setStatus(s); setLoadState("ready"); })
      .catch(() => setLoadState("ready"));
  }, [router]);

  function saveNotifPref(key: "emailReminders" | "slotAlerts", value: boolean) {
    const next = { emailReminders, slotAlerts, [key]: value };
    localStorage.setItem("cc_notif_prefs", JSON.stringify(next));
    if (key === "emailReminders") setEmailReminders(value);
    if (key === "slotAlerts")     setSlotAlerts(value);
  }

  function handleConnect() {
    if (!userId) return;
    window.location.href = `/api/auth/google/authorize?userId=${userId}`;
  }

  async function handleDisconnect() {
    if (!userId || disconnecting) return;
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      setStatus((s) => s
        ? { ...s, connected: false, expired: false, googleEmail: null, connectedAt: null }
        : s
      );
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("userId");
    router.push("/login");
  }

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Manage your account, integrations, and preferences.</p>
      </div>

      {/* OAuth result banner */}
      {googleParam === "connected" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-[13px] font-medium text-emerald-700">Google Calendar connected successfully.</p>
        </div>
      )}
      {googleParam === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Could not connect Google Calendar — please try again.
          {searchParams.get("reason") && (
            <span className="ml-1 text-red-500">({searchParams.get("reason")})</span>
          )}
        </div>
      )}

      {/* ── SECTION A: Connected Apps ─────────────────────────────────────────── */}
      <SettingsSection title="Connected Apps">
        <Card padding="md">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white">
              <GoogleIcon size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-neutral-900">Google Calendar</p>
                {status?.connected && !status.expired && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Connected
                  </span>
                )}
                {status?.expired && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Expired
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                {status?.connected
                  ? `Connected as ${status.googleEmail}`
                  : "Sync sessions and generate Google Meet links automatically."}
              </p>

              <div className="mt-3">
                {!status?.configured ? (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                    <p className="text-[12px] font-medium text-neutral-500">Coming soon</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      Add Google credentials to enable this integration.
                    </p>
                  </div>
                ) : status.connected ? (
                  <div className="flex gap-2">
                    {status.expired && (
                      <button
                        onClick={handleConnect}
                        className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-[12px] font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                      >
                        Reconnect
                      </button>
                    )}
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {disconnecting ? "Disconnecting…" : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    <GoogleIcon size={14} />
                    Connect Google Calendar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* What it enables */}
          {!status?.connected && status?.configured && (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <ul className="flex flex-col gap-1.5">
                {[
                  "Calendar events created automatically when sessions are confirmed",
                  "Google Meet links generated for every session",
                  "Invites sent to both you and your session partner",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-neutral-400">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </SettingsSection>

      {/* ── SECTION B: Notifications ──────────────────────────────────────────── */}
      <SettingsSection title="Notifications">
        <Card padding="md">
          <div className="flex flex-col divide-y divide-neutral-100">

            <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[13px] font-medium text-neutral-800">Email reminders</p>
                <p className="text-[11px] text-neutral-400">Session confirmation and reminder emails</p>
              </div>
              <Toggle
                checked={emailReminders}
                onChange={(v) => saveNotifPref("emailReminders", v)}
              />
            </div>

            <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[13px] font-medium text-neutral-800">Slot opening alerts</p>
                <p className="text-[11px] text-neutral-400">Notify me when Aurors I follow open new slots</p>
              </div>
              <Toggle
                checked={slotAlerts}
                onChange={(v) => saveNotifPref("slotAlerts", v)}
              />
            </div>

          </div>
        </Card>
      </SettingsSection>

      {/* ── SECTION C: Account ────────────────────────────────────────────────── */}
      <SettingsSection title="Account">
        <Card padding="md">
          <div className="flex flex-col divide-y divide-neutral-100">

            <div className="flex items-center justify-between py-3 first:pt-0">
              <div>
                <p className="text-[13px] font-medium text-neutral-800">Password</p>
                <p className="text-[11px] text-neutral-400">Change your account password</p>
              </div>
              <button
                disabled
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-400 cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>

            <div className="flex items-center justify-between py-3 last:pb-0">
              <div>
                <p className="text-[13px] font-medium text-neutral-800">Sign out</p>
                <p className="text-[11px] text-neutral-400">Log out of your account on this device</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Log out
              </button>
            </div>

          </div>
        </Card>
      </SettingsSection>

    </div>
  );
}
