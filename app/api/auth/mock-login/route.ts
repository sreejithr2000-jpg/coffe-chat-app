import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role } = body;

    if (role !== "SEEKER" && role !== "AUROR") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { role },
      include: { profile: true },
    });

    if (existingUser) {
      const res = NextResponse.json({ userId: existingUser.id });
      setSessionCookie(res, existingUser.id);
      return res;
    }

    const user = await prisma.user.create({
      data: {
        role,
        email: `mock-${role.toLowerCase()}@test.com`,
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        name: role === "SEEKER" ? "Test Seeker" : "Test Auror",
        headline: "Test User",
        experienceYears: 0,
        timezone: "UTC",
        country: "US",
        skills: [],
        domains: [],
        targetRoles: [],
        portfolioLinks: [],
        sessionTypes: [],
        sessionTags: [],
        overview: "",
        experience: [],
        education: [],
        dreamCompanies: [],
        dreamRole: "",
      },
    });

    const res = NextResponse.json({ userId: user.id });
    setSessionCookie(res, user.id);
    return res;
  } catch {
    return NextResponse.json({ error: "Mock login failed" }, { status: 500 });
  }
}
