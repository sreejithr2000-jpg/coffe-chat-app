import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const { userId, country, city, timezone } = (await request.json()) as {
      userId: string;
      country?: string;
      city?: string;
      timezone?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        country:  country?.trim()  || null,
        city:     city?.trim()     || null,
        timezone: timezone?.trim() || "UTC",
      },
    });

    return NextResponse.json(profile);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "P2025") {
      return NextResponse.json(
        { error: "Profile not found — complete your profile setup first." },
        { status: 404 }
      );
    }
    console.error("[settings/location PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
