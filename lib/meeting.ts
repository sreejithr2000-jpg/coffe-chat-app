const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a random readable meeting link.
 * Example: https://meet.app/k7xm2pqr
 */
export function generateMeetingLink(): string {
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `https://meet.app/${result}`;
}
