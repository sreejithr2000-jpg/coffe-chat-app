"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { ProfileHoverPreview } from "@/components/ProfileHoverPreview";
import { formatSlotDate } from "@/lib/availability";
import type { BookingWithDetails, MessageWithSender } from "@/types";

// ── Booking detail shape from GET /api/booking/[id] ──────────────────────────

interface BookingDetail extends BookingWithDetails {
  seeker: { id: string; role: string; profile: { name: string } | null } | null;
  auror:  { id: string; role: string; profile: { name: string } | null } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slotLabel(slot: { date: string; startTime: string; endTime: string } | null) {
  if (!slot) return "—";
  return formatSlotDate(slot);
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatMessageDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Group consecutive messages by date for date separators
function groupByDate(messages: MessageWithSender[]) {
  const groups: { date: string; messages: MessageWithSender[] }[] = [];
  for (const msg of messages) {
    const date = formatMessageDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last?.date === date) {
      last.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
  }
  return groups;
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  scheduled: "border-primary-200 bg-primary-50  text-primary-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-neutral-200 bg-neutral-100 text-neutral-500",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingChatPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const router = useRouter();

  const [userId, setUserId]       = useState<string | null>(null);
  const [booking, setBooking]     = useState<BookingDetail | null>(null);
  const [messages, setMessages]   = useState<MessageWithSender[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  const [draft, setDraft]     = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load user + booking + messages ─────────────────────────────────────────

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) { router.push("/login"); return; }
    setUserId(uid);

    Promise.all([
      fetch(`/api/booking/${bookingId}`).then((r) => {
        if (!r.ok) throw new Error("Booking not found");
        return r.json() as Promise<BookingDetail>;
      }),
      fetch(`/api/messages/${bookingId}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load messages");
        return r.json() as Promise<MessageWithSender[]>;
      }),
    ])
      .then(([bk, msgs]) => {
        setBooking(bk);
        setMessages(Array.isArray(msgs) ? msgs : []);
        setLoadState("ready");
        // Mark messages as read for this user (fire-and-forget)
        fetch(`/api/booking/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read", userId: uid }),
        }).catch(() => {});
      })
      .catch(() => setLoadState("error"));
  }, [bookingId, router]);

  // ── Scroll to bottom when messages change ──────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ───────────────────────────────────────────────────────────────────

  async function handleSend() {
    if (!draft.trim() || !userId || sending) return;
    setSending(true);
    setSendError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, senderId: userId, content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error ?? "Failed to send"); return; }
      setMessages((prev) => [...prev, data as MessageWithSender]);
      setDraft("");
      // The server already stamps our own read time on send, but keep local state fresh

    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const isAuror       = booking?.aurorId === userId;
  const noMessages    = messages.length === 0;
  const seekerLocked  = noMessages && !isAuror;
  const messageGroups = groupByDate(messages);

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadState === "error" || !booking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-neutral-500">Could not load this booking.</p>
          <BackButton />
        </div>
      </div>
    );
  }

  const aurorName  = booking.auror?.profile?.name  ?? "Unknown Auror";
  const seekerName = booking.seeker?.profile?.name ?? "Unknown Seeker";

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">

      {/* ── Booking info ──────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-neutral-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <BackButton />

          <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-neutral-900">
                {booking.aurorId !== userId ? (
                  <ProfileHoverPreview userId={booking.aurorId} align="left">
                    <span className="hover:text-primary-600 cursor-pointer transition-colors">{aurorName}</span>
                  </ProfileHoverPreview>
                ) : aurorName}
                <span className="mx-1.5 font-normal text-neutral-400">&amp;</span>
                {booking.seekerId !== userId ? (
                  <ProfileHoverPreview userId={booking.seekerId} align="left">
                    <span className="hover:text-primary-600 cursor-pointer transition-colors">{seekerName}</span>
                  </ProfileHoverPreview>
                ) : seekerName}
              </p>
              <p className="text-[12px] text-neutral-500">{slotLabel(booking.availabilitySlot)}</p>
            </div>
            <span className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
              BOOKING_STATUS_STYLES[booking.status] ?? BOOKING_STATUS_STYLES.cancelled
            )}>
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Message list ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-1">

          {noMessages ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 10C17 13.866 13.866 17 10 17C8.653 17 7.394 16.617 6.333 15.951L3 17L4.049 13.667C3.383 12.606 3 11.347 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z" stroke="#94a3b8" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[13px] font-medium text-neutral-500">No messages yet</p>
              {seekerLocked ? (
                <p className="mt-1 text-[12px] text-neutral-400">
                  Waiting for the Auror to start the conversation.
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-neutral-400">
                  Send the first message to get started.
                </p>
              )}
            </div>
          ) : (
            messageGroups.map((group) => (
              <div key={group.date} className="flex flex-col gap-1">
                {/* Date separator */}
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-[11px] font-medium text-neutral-400">{group.date}</span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                {group.messages.map((msg, i) => {
                  const isOwn      = msg.senderId === userId;
                  const senderName = msg.sender?.profile?.name ?? "Unknown";
                  const showName   = i === 0 || group.messages[i - 1]?.senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}
                    >
                      {showName && (
                        <p className={cn(
                          "mb-0.5 text-[11px] font-medium text-neutral-400",
                          isOwn ? "pr-1" : "pl-1"
                        )}>
                          {isOwn ? "You" : senderName}
                        </p>
                      )}
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        isOwn
                          ? "rounded-tr-sm bg-primary-600 text-white"
                          : "rounded-tl-sm bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-100"
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <p className={cn(
                        "text-[10px] text-neutral-400",
                        isOwn ? "pr-1" : "pl-1"
                      )}>
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl">
          {seekerLocked ? (
            <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[12px] text-neutral-400">
                Waiting for Auror to start the conversation
              </p>
            </div>
          ) : (
            <>
              {sendError && (
                <p className="mb-2 text-[12px] text-red-600">{sendError}</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  disabled={sending}
                  className={cn(
                    "flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5",
                    "text-[13px] text-neutral-900 placeholder:text-neutral-400",
                    "focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100",
                    "disabled:opacity-50",
                    "max-h-32 overflow-y-auto"
                  )}
                  style={{ minHeight: "40px" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 128) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    draft.trim() && !sending
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  )}
                  aria-label="Send"
                >
                  {sending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 8L14 2L8 14L7 9L2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-400">
                Press Enter to send · Shift+Enter for new line · Messages expire after 7 days
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
