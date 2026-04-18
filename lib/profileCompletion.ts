import type { Profile, UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  points: number;
}

// ---------------------------------------------------------------------------
// Checklist — role-specific items that drive the completion score
// ---------------------------------------------------------------------------

export function getProfileChecklist(profile: Profile, role: UserRole): ChecklistItem[] {
  if (role === "SEEKER") {
    return [
      {
        key: "headline",
        label: "Add a headline",
        done: !!profile.headline?.trim(),
        points: 15,
      },
      {
        key: "primaryTrack",
        label: "Choose a primary track",
        done: !!profile.primaryTrack,
        points: 10,
      },
      {
        key: "skills",
        label: "Add at least one skill",
        done: profile.skills.length > 0,
        points: 15,
      },
      {
        key: "education",
        label: "Add education",
        done: (profile.education ?? []).length > 0,
        points: 20,
      },
      {
        key: "resume",
        label: "Upload your resume",
        done: !!profile.resumeUrl,
        points: 20,
      },
      {
        key: "goals",
        label: "Set your goals",
        done: !!(profile.dreamRole?.trim() || profile.targetRoles.length > 0),
        points: 20,
      },
    ];
  }

  // AUROR
  return [
    {
      key: "headline",
      label: "Add a headline",
      done: !!profile.headline?.trim(),
      points: 15,
    },
    {
      key: "currentRole",
      label: "Set your current role",
      done: !!profile.currentRole?.trim(),
      points: 10,
    },
    {
      key: "experience",
      label: "Add work experience",
      done: (profile.experience ?? []).length > 0,
      points: 25,
    },
    {
      key: "sessionTags",
      label: "Add mentoring topics",
      done: profile.sessionTags.length > 0,
      points: 20,
    },
    {
      key: "overview",
      label: "Write a bio",
      done: !!profile.overview?.trim(),
      points: 15,
    },
    {
      key: "sessionTypes",
      label: "Set session types",
      done: profile.sessionTypes.length > 0,
      points: 15,
    },
  ];
}

// ---------------------------------------------------------------------------
// Score — sum of points for completed items (0–100)
// ---------------------------------------------------------------------------

export function getProfileScore(profile: Profile, role: UserRole): number {
  return getProfileChecklist(profile, role)
    .filter((item) => item.done)
    .reduce((sum, item) => sum + item.points, 0);
}

// ---------------------------------------------------------------------------
// Micro reward — positive message at milestone thresholds
// ---------------------------------------------------------------------------

export function getMilestoneMessage(score: number): string | null {
  if (score >= 100) return "Your profile is complete 🎉";
  if (score >= 80)  return "Almost there — strong profiles get noticed";
  if (score >= 50)  return "Your profile is taking shape ✨";
  return null;
}

// ---------------------------------------------------------------------------
// Role nudge — motivating copy shown inside the banner
// ---------------------------------------------------------------------------

export function getRoleNudge(role: UserRole): string {
  return role === "SEEKER"
    ? "A complete profile helps Aurors tailor their advice to your goals."
    : "Detailed profiles build trust and attract more bookings from seekers.";
}
