"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

export function NotificationBell() {
  const [userId, setUserId]             = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]                 = useState(false);
  const ref                             = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  // Read userId from localStorage once
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  // Fetch on mount + poll every 20 s
  useEffect(() => {
    if (!userId) return;

    function load() {
      fetch(`/api/notifications?userId=${userId}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setNotifications(data); })
        .catch(() => {});
    }

    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function markOne(notifId: string) {
    await fetch(`/api/notifications/${notifId}`, { method: "PATCH" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    if (!userId) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  if (!userId) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <span className="text-[12px] font-semibold text-neutral-700">
              Notifications
              {unread > 0 && (
                <span className="ml-1.5 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] text-primary-600 hover:text-primary-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-neutral-400">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markOne(n.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                    !n.isRead && "bg-primary-50/50"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Unread dot */}
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        n.isRead ? "bg-transparent" : "bg-primary-500"
                      )}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-[12px] font-semibold text-neutral-800 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 leading-snug">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
