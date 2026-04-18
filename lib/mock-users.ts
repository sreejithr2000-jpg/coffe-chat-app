// ---------------------------------------------------------------------------
// Static mock users — kept as a reference fixture.
// The real mock auth flow is handled via /api/auth/mock-login + DB.
// ---------------------------------------------------------------------------

import type { User } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "mock_seeker_01",
    email: "mock.seeker@dev.local",
    role: "SEEKER",
    createdAt: "2024-01-15T00:00:00.000Z",
    profile: {
      id: "profile_seeker_01",
      userId: "mock_seeker_01",
      name: "Alex Johnson",
      headline: "Aspiring Product Manager",
      experienceYears: 1,
      primaryTrack: "PRODUCT_MANAGEMENT",
      secondaryTracks: ["SOFTWARE_ENGINEERING"],
      skills: ["sql", "figma", "excel"],
      domains: ["fintech"],
      targetRoles: ["product manager", "associate pm"],
      currentRole: null,
      totalExperience: 0,
      sessionTypes: [],
      sessionTags: [],
      overview: null,
      experience: null,
      education: null,
      dreamCompanies: [],
      dreamRole: null,
      resumeUrl: null,
      portfolioLinks: [],
      otherTrackLabel: null,
      username: null,
      country: null,
      timezone: "UTC",

      createdAt: "2024-01-15T00:00:00.000Z",
    },
  },
  {
    id: "mock_auror_01",
    email: "mock.auror@dev.local",
    role: "AUROR",
    createdAt: "2024-01-10T00:00:00.000Z",
    profile: {
      id: "profile_auror_01",
      userId: "mock_auror_01",
      name: "Maya Patel",
      headline: "Senior PM · Helping folks break into product",
      experienceYears: 0,
      primaryTrack: "PRODUCT_MANAGEMENT",
      secondaryTracks: ["SOFTWARE_ENGINEERING"],
      skills: ["roadmapping", "stakeholder management", "sql"],
      domains: ["saas", "fintech"],
      targetRoles: [],
      currentRole: "Senior Product Manager",
      totalExperience: 6,
      sessionTypes: ["coffee_chat", "mock_interview"],
      sessionTags: ["resume review", "behavioral", "career advice"],
      overview: null,
      experience: null,
      education: null,
      dreamCompanies: [],
      dreamRole: null,
      resumeUrl: null,
      portfolioLinks: [],
      otherTrackLabel: null,
      username: null,
      country: null,
      timezone: "America/New_York",

      createdAt: "2024-01-10T00:00:00.000Z",
    },
  },
];
