import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role } = body;

    if (role !== "SEEKER" && role !== "AUROR") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Reuse existing mock user for this role
    const existingUser = await prisma.user.findFirst({
      where: { role },
      include: { profile: true },
    });

    if (existingUser) {
      return NextResponse.json({ userId: existingUser.id });
    }

    // First login — create user + profile
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

    return NextResponse.json({ userId: user.id });
  } catch (error) {
    console.error("Mock login error:", error);
    return NextResponse.json({ error: "Mock login failed" }, { status: 500 });
  }
}
