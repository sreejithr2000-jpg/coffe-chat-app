import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/googleAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=${error}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=missing_params`);
  }

  // CSRF: state must match cookie set during authorize
  const cookieState = request.cookies.get("google_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=invalid_state`);
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString()) as {
      userId: string;
      ts: number;
    };
    if (Date.now() - decoded.ts > 10 * 60 * 1000) throw new Error("State expired");
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=state_decode_failed`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokens   = await exchangeCodeForTokens(code, redirectUri);
    const userInfo = await getGoogleUserInfo(tokens.access_token);
    const expiry   = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleId:          userInfo.id,
        googleEmail:       userInfo.email,
        googleAccessToken: tokens.access_token,
        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
        googleTokenExpiry: expiry,
        googleConnectedAt: new Date(),
      },
    });

    const response = NextResponse.redirect(`${appUrl}/settings?google=connected`);
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (err) {
    console.error("[google callback]", err);
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=token_exchange_failed`);
  }
}
