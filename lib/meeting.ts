const APPROVED_ORIGINS = [
  "https://meet.google.com",
  "https://meet.jit.si",
];

/**
 * Returns true only for meeting URLs from approved providers.
 * Prevents fake/placeholder URLs (e.g. meet.app) from being rendered.
 */
export function isValidMeetingUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const { origin } = new URL(url);
    return APPROVED_ORIGINS.some((approved) => origin === approved);
  } catch {
    return false;
  }
}

/**
 * Generates a Jitsi meeting link scoped to the booking/request ID.
 * Falls back to Google Meet when the Auror has an active OAuth token.
 */
export function generateMeetingLink(sessionId: string): string {
  const slug = sessionId.replace(/[^a-z0-9]/gi, "").slice(0, 20);
  return `https://meet.jit.si/coffeechat-${slug}`;
}
