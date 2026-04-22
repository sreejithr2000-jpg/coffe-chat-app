import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// Quick smoke-test for email delivery.
// DELETE this file once email is confirmed working in production.
//
// Usage:
//   POST /api/debug/send-test-email
//   Body: { "to": "you@example.com" }

export async function POST(request: NextRequest) {
  // Guard: only allow in non-production or when a debug secret is provided.
  const debugSecret = process.env.DEBUG_SECRET;
  const authHeader   = request.headers.get("x-debug-secret");

  if (debugSecret && authHeader !== debugSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { to?: string };
  const { to } = body;

  if (!to) {
    return NextResponse.json({ error: "to is required" }, { status: 400 });
  }

  console.log(`[debug/send-test-email] Attempting send to ${to}`);

  await sendEmail(
    to,
    "CoffeeChat — email test",
    `<p>This is a test email from CoffeeChat.</p>
     <p>If you received this, transactional email is working correctly.</p>
     <p>Sent at: ${new Date().toISOString()}</p>`
  );

  // sendEmail logs internally — check Vercel Function logs for the result.
  return NextResponse.json({ ok: true, message: `Email attempted to ${to} — check server logs for result` });
}
