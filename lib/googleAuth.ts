const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES    = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleOAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         GOOGLE_SCOPES.join(" "),
    access_type:   "offline",
    prompt:        "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{
    access_token:  string;
    refresh_token?: string;
    expires_in:    number;
    token_type:    string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    expires_in:   number;
  }>;
}

export async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get Google user info");
  return res.json() as Promise<{ id: string; email: string }>;
}

/** Returns a valid access token for userId, refreshing if expired. Null if not connected. */
export async function getValidToken(userId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  });

  if (!user?.googleAccessToken || !user.googleRefreshToken) return null;

  // Token still valid with 60-second buffer
  if (user.googleTokenExpiry && user.googleTokenExpiry.getTime() - Date.now() > 60_000) {
    return user.googleAccessToken;
  }

  try {
    const refreshed = await refreshAccessToken(user.googleRefreshToken);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { googleAccessToken: refreshed.access_token, googleTokenExpiry: newExpiry },
    });
    return refreshed.access_token;
  } catch {
    return null;
  }
}
