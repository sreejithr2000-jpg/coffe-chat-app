import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateProfilePayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProfilePayload;
    const {
      userId, name, headline,
      experienceYears, primaryTrack, secondaryTracks,
      skills, domains,
      targetRoles,
      currentRole, totalExperience, sessionTypes, sessionTags,
      overview, experience, education, dreamCompanies, dreamRole, resumeUrl, portfolioLinks,
      otherTrackLabel,
    } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    const data = {
      name,
      headline,
      experienceYears,
      primaryTrack: primaryTrack ?? null,
      secondaryTracks: secondaryTracks ?? [],
      skills: skills ?? [],
      domains: domains ?? [],
      targetRoles: targetRoles ?? [],
      currentRole: currentRole ?? null,
      totalExperience: totalExperience ?? 0,
      sessionTypes: sessionTypes ?? [],
      sessionTags: sessionTags ?? [],
      overview: overview ?? null,
      experience: experience != null ? (experience as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      education: education != null ? (education as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      dreamCompanies: dreamCompanies ?? [],
      dreamRole: dreamRole ?? null,
      resumeUrl:       resumeUrl ?? null,
      portfolioLinks:  portfolioLinks ?? [],
      otherTrackLabel: otherTrackLabel ?? null,
    };

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("[profile POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
