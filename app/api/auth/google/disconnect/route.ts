import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = (await request.json()) as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleId:           null,
        googleEmail:        null,
        googleAccessToken:  null,
        googleRefreshToken: null,
        googleTokenExpiry:  null,
        googleConnectedAt:  null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[google disconnect]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
