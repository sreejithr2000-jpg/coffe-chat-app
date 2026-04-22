import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthUrl, isGoogleConfigured } from "@/lib/googleAuth";

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google integration not yet configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable." },
      { status: 503 }
    );
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const url = getGoogleOAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   600,
    path:     "/",
  });
  return response;
}
