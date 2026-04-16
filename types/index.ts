// ---------------------------------------------------------------------------
// Domain types (mirrors Prisma models)
// ---------------------------------------------------------------------------

export type UserRole = "SEEKER" | "AUROR";

export type Track =
  | "SOFTWARE_ENGINEERING"
  | "HARDWARE_ENGINEERING"
  | "MECHANICAL_ENGINEERING"
  | "PRODUCT_MANAGEMENT";

export type SessionType = "coffee_chat" | "mock_interview";

export type RequestStatus = "pending" | "accepted" | "rejected" | "expired";
export type BookingStatus = "scheduled" | "completed" | "cancelled";

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  profile?: Profile | null;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  date: string;       // ISO string — UTC midnight of the slot date
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface Request {
  id: string;
  seekerId: string;
  aurorId: string;
  availabilitySlotId: string;
  status: RequestStatus;
  questions: string[];
  sessionType: string;   // "coffee" | "mock"
  duration: number;      // minutes
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface Booking {
  id: string;
  requestId: string;
  seekerId: string;
  aurorId: string;
  availabilitySlotId: string;
  status: BookingStatus;
  sessionType: string;   // "coffee" | "mock"
  duration: number;      // minutes
  scheduledAt: string;
  completedAt: string | null;
  meetingLink: string | null;
  lastMessageAt: string | null;
  seekerLastReadAt: string | null;
  aurorLastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  seekerId: string;
  aurorId: string;
  rating: number;
  attended: boolean;
  review: string | null;
  takeaways: string[];
  createdAt: string;
}

export interface BookingWithDetails extends Booking {
  auror?: { profile: { name: string } | null } | null;
  seeker?: { profile: { name: string } | null } | null;
  availabilitySlot: Pick<AvailabilitySlot, "date" | "startTime" | "endTime">;
  request?: { questions: string[]; status: string } | null;
  review?: { rating: number; takeaways: string[]; review: string | null } | null;
}

// Enriched version returned by GET /api/requests/seeker/[userId]
export interface RequestWithDetails extends Request {
  auror: {
    profile: { name: string; headline: string | null; currentRole: string | null } | null;
  };
  availabilitySlot: Pick<AvailabilitySlot, "date" | "startTime" | "endTime">;
}

// Enriched version returned by GET /api/requests/auror/[userId]
export interface AurorRequestWithDetails extends Request {
  seeker: {
    profile: {
      name: string;
      headline: string | null;
      resumeUrl: string | null;
      portfolioLinks: string[];
    } | null;
  };
  availabilitySlot: Pick<AvailabilitySlot, "date" | "startTime" | "endTime">;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startMonth: string;       // "01"–"12"
  startYear: string;        // "YYYY"
  endMonth: string | null;  // null = currently working here
  endYear: string | null;
}

export interface EducationEntry {
  school: string;
  degree: string;
  year: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  headline: string | null;
  experienceYears: number;
  primaryTrack: Track | null;
  secondaryTracks: Track[];
  skills: string[];
  domains: string[];
  targetRoles: string[];
  currentRole: string | null;
  totalExperience: number;
  sessionTypes: string[];
  sessionTags: string[];
  // Rich profile fields
  overview: string | null;
  experience: ExperienceEntry[] | null;
  education: EducationEntry[] | null;
  dreamCompanies: string[];
  dreamRole: string | null;
  resumeUrl: string | null;
  portfolioLinks: string[];
  // Identity
  username: string | null;
  country: string | null;
  timezone: string;
  createdAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  createdAt: string;
  expiresAt: string;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    role: UserRole;
    profile: { name: string } | null;
  };
}

// ---------------------------------------------------------------------------
// API payloads
// ---------------------------------------------------------------------------

export interface MockLoginPayload {
  role: UserRole;
}

export interface CreateProfilePayload {
  userId: string;
  name: string;
  headline: string;
  experienceYears: number;
  primaryTrack: Track | null;
  secondaryTracks: Track[];
  skills: string[];
  domains: string[];
  targetRoles: string[];
  currentRole: string;
  totalExperience: number;
  sessionTypes: string[];
  sessionTags: string[];
  // Rich profile fields
  overview?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  dreamCompanies?: string[];
  dreamRole?: string;
  resumeUrl?: string;
  portfolioLinks?: string[];
}

export interface CreateSlotPayload {
  userId: string;
  date: string;     // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
}

export interface CreateRequestPayload {
  seekerId: string;
  aurorId: string;
  availabilitySlotId: string;
  questions: string[];
  sessionType: "coffee" | "mock";
  duration: number;
}

// ---------------------------------------------------------------------------
// UI / utility types
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";
