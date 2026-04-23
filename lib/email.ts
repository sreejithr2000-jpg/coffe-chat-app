import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Emails to skip in dev/test environments
const DEV_PATTERNS = ["@test.com", "@dev.local", "@example.com"];

/**
 * Sends a transactional email via Resend.
 * Never throws — errors are logged and swallowed.
 * Silently skips if: no API key, no recipient, or dev/test email address.
 *
 * SETUP: set RESEND_API_KEY in your env, and update the `from` address
 * to a domain you've verified in the Resend dashboard.
 */
export async function sendEmail(
  to: string | null | undefined,
  subject: string,
  html: string
): Promise<void> {
  try {
    if (!resend) {
      console.warn("[sendEmail] SKIPPED — RESEND_API_KEY is not set");
      return;
    }
    if (!to) {
      console.warn("[sendEmail] SKIPPED — recipient email is null/undefined");
      return;
    }
    if (DEV_PATTERNS.some((p) => to.includes(p))) {
      console.log(`[sendEmail] SKIPPED — dev/test address: ${to}`);
      return;
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Lumora OneFlow <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error("[sendEmail] Resend error:", result.error);
    }
  } catch (err) {
    console.error("[sendEmail] ERROR:", err);
  }
}
