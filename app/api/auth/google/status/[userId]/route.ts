import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGoogleConfigured } from "@/lib/googleAuth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { googleEmail: true, googleConnectedAt: true, googleTokenExpiry: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connected = !!(user.googleEmail && user.googleConnectedAt);
    const expired   = connected && user.googleTokenExpiry
      ? user.googleTokenExpiry < new Date()
      : false;

    return NextResponse.json({
      configured:  isGoogleConfigured(),
      connected,
      expired,
      googleEmail: connected ? user.googleEmail : null,
      connectedAt: user.googleConnectedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[google status]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
