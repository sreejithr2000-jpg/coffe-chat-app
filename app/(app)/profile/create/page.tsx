"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/toast-context";
import {
  Card, Button, Input, Select, TagInput, CheckboxGroup, TrackMultiSelect,
} from "@/components/ui";
import { ALL_TRACKS, TRACK_LABELS } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { Track, User, UserRole, ExperienceEntry, EducationEntry } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const TRACK_OPTIONS = ALL_TRACKS.map((t) => ({ value: t, label: TRACK_LABELS[t] }));

const SESSION_TYPE_OPTIONS = [
  { value: "coffee_chat",    label: "Coffee Chat",    description: "Casual 30-min career conversation" },
  { value: "mock_interview", label: "Mock Interview", description: "Structured practice session with feedback" },
];

const MONTHS = [
  { value: "01", label: "Jan" }, { value: "02", label: "Feb" },
  { value: "03", label: "Mar" }, { value: "04", label: "Apr" },
  { value: "05", label: "May" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Aug" },
  { value: "09", label: "Sep" }, { value: "10", label: "Oct" },
  { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
];

const DEGREE_OPTIONS = [
  { value: "bachelors", label: "Bachelors"              },
  { value: "masters",   label: "Masters"                },
  { value: "phd",       label: "PhD"                    },
  { value: "mba",       label: "MBA"                    },
  { value: "associate", label: "Associate"              },
  { value: "diploma",   label: "High School / Diploma"  },
  { value: "other",     label: "Other"                  },
];

const CY = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => {
  const y = String(CY - i);
  return { value: y, label: y };
});

const STEP_LABELS = ["Basic info", "Background", "Experience", "Education", "Goals"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcTotalExperience(entries: ExperienceEntry[]): number {
  const now = new Date();
  let totalMonths = 0;
  for (const exp of entries) {
    const sy = parseInt(exp.startYear ?? "0");
    const sm = parseInt(exp.startMonth ?? "1") - 1;
    if (!sy) continue;
    const start = new Date(sy, sm, 1);
    const end = exp.endYear
      ? new Date(parseInt(exp.endYear), parseInt(exp.endMonth ?? "12") - 1, 1)
      : now;
    totalMonths += Math.max(0,
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth())
    );
  }
  return Math.round(totalMonths / 12);
}

function calcEntryDuration(exp: ExperienceEntry): string {
  const sy = parseInt(exp.startYear ?? "0");
  const sm = parseInt(exp.startMonth ?? "1") - 1;
  if (!sy) return "";
  const start = new Date(sy, sm, 1);
  const end = exp.endYear
    ? new Date(parseInt(exp.endYear), parseInt(exp.endMonth ?? "12") - 1, 1)
    : new Date();
  const months = Math.max(0,
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  const parts: string[] = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs !== 1 ? "s" : ""}`);
  if (mos > 0) parts.push(`${mos} mo${mos !== 1 ? "s" : ""}`);
  return parts.join(" ") || "< 1 mo";
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  // Step 1 — Basic info
  name: string;
  headline: string;
  currentRole: string;
  overview: string;
  // Step 2 — Background
  primaryTrack: Track | "";
  secondaryTracks: Track[];
  skills: string[];
  domains: string[];
  resumeUrl: string;
  portfolioLinks: string[];
  // Step 3 — Experience
  experience: ExperienceEntry[];
  // Step 4 — Education
  education: EducationEntry[];
  // Step 5 — Goals (role-specific)
  targetRoles: string[];
  dreamRole: string;
  dreamCompanies: string[];
  sessionTypes: string[];
  sessionTags: string[];
  // Secondary track "Other"
  otherTrackSelected: boolean;
  otherTrackLabel: string;
}

interface FormErrors {
  name?: string;
  headline?: string;
  currentRole?: string;
  primaryTrack?: string;
  skills?: string;
  resume?: string;
  resumeFile?: string;
  // Step 3
  experience?: string;          // section-level (Auror: requires at least 1)
  experienceItems?: string[];   // per-entry errors indexed by position
  // Step 4
  education?: string;           // section-level (Seeker: requires at least 1)
  educationItems?: string[];    // per-entry errors indexed by position
}

const EMPTY_ENTRY: ExperienceEntry = {
  company: "", role: "", startMonth: "", startYear: "", endMonth: null, endYear: null, description: "",
};

const DEFAULT_FORM: FormState = {
  name: "", headline: "", currentRole: "", overview: "",
  primaryTrack: "", secondaryTracks: [],
  skills: [], domains: [],
  resumeUrl: "", portfolioLinks: [],
  experience: [], education: [],
  targetRoles: [], dreamRole: "", dreamCompanies: [],
  sessionTypes: [], sessionTags: [],
  otherTrackSelected: false, otherTrackLabel: "",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateProfilePage() {
  const router = useRouter();
  const { show: showToast } = useToast();
  const [role, setRole]         = useState<UserRole | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadState, setLoadState]     = useState<"loading" | "ready">("loading");

  // Resume upload
  const [resumeFile, setResumeFile]   = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) { router.push("/login"); return; }
    setUserId(id);

    fetch(`/api/users/${id}`)
      .then((r) => r.json() as Promise<User>)
      .then((user) => {
        setRole(user.role);
        if (user.profile) {
          const p = user.profile;
          setForm({
            name:            p.name,
            headline:        p.headline ?? "",
            currentRole:     p.currentRole ?? "",
            overview:        p.overview ?? "",
            primaryTrack:    p.primaryTrack ?? "",
            secondaryTracks: p.secondaryTracks,
            skills:          p.skills,
            domains:         p.domains,
            resumeUrl:       p.resumeUrl ?? "",
            portfolioLinks:  p.portfolioLinks ?? [],
            experience:      (p.experience as ExperienceEntry[]) ?? [],
            education:       (p.education as EducationEntry[]) ?? [],
            targetRoles:     p.targetRoles,
            dreamRole:       p.dreamRole ?? "",
            dreamCompanies:  p.dreamCompanies ?? [],
            sessionTypes:        p.sessionTypes,
            sessionTags:         p.sessionTags,
            otherTrackLabel:     p.otherTrackLabel ?? "",
            otherTrackSelected:  !!(p.otherTrackLabel),
          });
        }
        setLoadState("ready");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // ── State helpers ─────────────────────────────────────────────────────────

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setPrimaryTrack(value: Track | "") {
    setForm((prev) => ({
      ...prev,
      primaryTrack: value,
      secondaryTracks: prev.secondaryTracks.filter((t) => t !== value),
    }));
  }

  function addExperience() {
    set("experience", [...form.experience, { ...EMPTY_ENTRY }]);
  }
  function updateExperience(i: number, patch: Partial<ExperienceEntry>) {
    set("experience", form.experience.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  }
  function removeExperience(i: number) {
    set("experience", form.experience.filter((_, idx) => idx !== i));
  }

  function addEducation() {
    set("education", [...form.education, { school: "", degree: "", year: "", course: "" }]);
  }
  function updateEducation(i: number, field: keyof EducationEntry, val: string) {
    set("education", form.education.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }
  function removeEducation(i: number) {
    set("education", form.education.filter((_, idx) => idx !== i));
  }

  function addPortfolioLink() {
    if (form.portfolioLinks.length >= 3) return;
    set("portfolioLinks", [...form.portfolioLinks, ""]);
  }
  function updatePortfolioLink(i: number, val: string) {
    set("portfolioLinks", form.portfolioLinks.map((l, idx) => idx === i ? val : l));
  }
  function removePortfolioLink(i: number) {
    set("portfolioLinks", form.portfolioLinks.filter((_, idx) => idx !== i));
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validateStep(): boolean {
    const errs: FormErrors = {};

    if (step === 1) {
      if (!form.name.trim())        errs.name        = "Full name is required";
      if (!form.headline.trim())    errs.headline    = "Headline is required";
      if (!form.currentRole.trim()) errs.currentRole = "Current role is required";
    }

    if (step === 2) {
      if (!form.primaryTrack)
        errs.primaryTrack = "Please select a primary track";
      if (form.skills.length === 0)
        errs.skills = "At least one skill is required";
      if (!form.resumeUrl && !resumeFile)
        errs.resume = "Please upload a resume or provide a link";
    }

    if (step === 3) {
      if (role === "AUROR" && form.experience.length === 0)
        errs.experience = "Aurors must add at least one experience entry";

      const expItems: string[] = [];
      form.experience.forEach((exp, i) => {
        if (!exp.description?.trim()) expItems[i] = "Description is required";
      });
      if (expItems.some(Boolean)) errs.experienceItems = expItems;
    }

    if (step === 4) {
      if (role === "SEEKER" && form.education.length === 0)
        errs.education = "Please add at least one education entry";

      const eduItems: string[] = [];
      form.education.forEach((edu, i) => {
        const missing: string[] = [];
        if (!edu.degree?.trim()) missing.push("degree");
        if (!edu.course?.trim()) missing.push("field of study");
        if (missing.length) eduItems[i] = `Required: ${missing.join(", ")}`;
      });
      if (eduItems.some(Boolean)) errs.educationItems = eduItems;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => Math.min(s + 1, 5));
  }
  function prevStep() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Resume upload ─────────────────────────────────────────────────────────

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".doc", ".docx"].includes(ext)) {
      setErrors((prev) => ({ ...prev, resumeFile: "Only PDF, DOC, or DOCX files are accepted" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resumeFile: "File must be under 5 MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, resumeFile: undefined, resume: undefined }));
    setResumeFile(file);
    setUploadError(null);
  }

  async function uploadResume(file: File): Promise<string | null> {
    if (!userId) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", userId);
      const res = await fetch("/api/upload/resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Upload failed"); return null; }
      return data.url as string;
    } catch {
      setUploadError("Unable to upload resume. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep() || !userId) return;
    setSubmitting(true);
    setServerError(null);

    let finalResumeUrl = form.resumeUrl || null;
    if (resumeFile) {
      const uploaded = await uploadResume(resumeFile);
      if (!uploaded) { setSubmitting(false); return; }
      finalResumeUrl = uploaded;
    }

    const cleanExperience    = form.experience.filter((e) => e.company.trim() || e.role.trim());
    const cleanEducation     = form.education.filter((e) => e.school.trim() || e.degree.trim());
    const cleanPortfolioLinks = form.portfolioLinks.filter((l) => l.trim());
    const totalExp           = calcTotalExperience(cleanExperience);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name:            form.name.trim(),
          headline:        form.headline.trim(),
          experienceYears: totalExp,
          primaryTrack:    form.primaryTrack || null,
          secondaryTracks: form.secondaryTracks,
          skills:          form.skills,
          domains:         form.domains,
          targetRoles:     form.targetRoles,
          currentRole:     form.currentRole.trim(),
          totalExperience: totalExp,
          sessionTypes:    form.sessionTypes,
          sessionTags:     form.sessionTags,
          overview:        form.overview.trim() || null,
          experience:      cleanExperience.length ? cleanExperience : null,
          education:       cleanEducation.length  ? cleanEducation  : null,
          dreamCompanies:  form.dreamCompanies,
          dreamRole:       form.dreamRole.trim() || null,
          resumeUrl:        finalResumeUrl,
          portfolioLinks:   cleanPortfolioLinks,
          otherTrackLabel:  form.otherTrackSelected && form.otherTrackLabel.trim()
                              ? form.otherTrackLabel.trim()
                              : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      showToast("Profile updated successfully");
      router.push("/profile");
    } catch {
      setServerError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const isSeeker = role === "SEEKER";
  const isAuror  = role === "AUROR";
  const totalExp = calcTotalExperience(form.experience);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex justify-center py-10">
      <div className="w-full max-w-lg">
        {/* Guidance message */}
        <p className="mb-4 text-center text-[13px] text-neutral-500">
          Complete your profile to start booking sessions
        </p>

        <Card padding="lg">

          {/* Step indicator */}
          <StepBar step={step} total={5} labels={STEP_LABELS} />

          {/* Step content */}
          <div className="flex min-h-[300px] flex-col gap-5">

            {/* ── Step 1: Basic info ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                <Input
                  label="Full name *"
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                  autoFocus
                />
                <Input
                  label="Headline *"
                  placeholder={isSeeker ? "e.g. Aspiring PM breaking into tech" : "e.g. Senior PM at Series B startup"}
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  error={errors.headline}
                  hint="A short sentence about your role or goal"
                />
                <Input
                  label="Current role *"
                  placeholder="e.g. Product Manager at Acme"
                  value={form.currentRole}
                  onChange={(e) => set("currentRole", e.target.value)}
                  error={errors.currentRole}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">Overview</label>
                  <textarea
                    placeholder={isSeeker
                      ? "e.g. I'm a recent CS grad looking to break into product management…"
                      : "e.g. I've spent 8 years in B2B SaaS, leading product teams at…"}
                    value={form.overview}
                    onChange={(e) => set("overview", e.target.value)}
                    rows={4}
                    maxLength={600}
                    className={cn(
                      "w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5",
                      "text-[13px] text-neutral-900 placeholder:text-neutral-400",
                      "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    )}
                  />
                  <p className="text-[11px] text-neutral-400">{form.overview.length}/600</p>
                </div>
              </>
            )}

            {/* ── Step 2: Background ─────────────────────────────────────── */}
            {step === 2 && (
              <>
                <Select
                  label="Primary track *"
                  placeholder="Select a track…"
                  options={TRACK_OPTIONS}
                  value={form.primaryTrack}
                  onChange={(e) => setPrimaryTrack(e.target.value as Track | "")}
                  error={errors.primaryTrack}
                />
                <TrackMultiSelect
                  label="Secondary tracks"
                  hint={form.secondaryTracks.length >= 2 ? "Maximum 2 selected" : "Optional — pick up to 2 additional tracks"}
                  selected={form.secondaryTracks}
                  disabledTracks={form.primaryTrack ? [form.primaryTrack] : []}
                  max={2}
                  onChange={(tracks) => set("secondaryTracks", tracks)}
                  showOther
                  otherSelected={form.otherTrackSelected}
                  onOtherToggle={() => set("otherTrackSelected", !form.otherTrackSelected)}
                  otherValue={form.otherTrackLabel}
                  onOtherChange={(val) => set("otherTrackLabel", val)}
                />
                <div className="flex flex-col gap-1">
                  <TagInput
                    label="Skills *"
                    placeholder="e.g. python, sql, figma…"
                    value={form.skills}
                    onChange={(tags) => { set("skills", tags); if (tags.length > 0) setErrors((p) => ({ ...p, skills: undefined })); }}
                    max={10}
                    hint="Press Enter or comma to add · max 10"
                  />
                  {errors.skills && <p className="text-[12px] text-red-600">{errors.skills}</p>}
                </div>
                <TagInput
                  label="Domains"
                  placeholder="e.g. fintech, healthcare…"
                  value={form.domains}
                  onChange={(tags) => set("domains", tags)}
                  max={3}
                  hint="Press Enter or comma to add · max 3"
                />

                {/* Resume */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">
                    Resume <span className="text-red-400 text-[11px]">*</span>
                  </label>
                  {form.resumeUrl && !resumeFile && (
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 truncate text-[12px] text-primary-600 hover:underline">
                        Current resume
                      </a>
                      <button type="button" onClick={() => set("resumeUrl", "")}
                        className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors">
                        Remove
                      </button>
                    </div>
                  )}
                  <label className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border-2 border-dashed px-4 py-3 transition-colors",
                    resumeFile ? "border-emerald-300 bg-emerald-50" :
                    errors.resume ? "border-red-300 bg-red-50" :
                    "border-neutral-200 bg-neutral-50 hover:border-neutral-300",
                    uploading && "cursor-not-allowed opacity-50"
                  )}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-neutral-400">
                      <path d="M7 1v8M4 4l3-3 3 3M2 10h10v2H2v-2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[12px] text-neutral-600">{resumeFile ? resumeFile.name : "Choose file…"}</span>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} disabled={uploading} className="sr-only" />
                  </label>
                  <p className="text-[11px] text-neutral-400">PDF, DOC, or DOCX · max 5 MB</p>
                  {errors.resumeFile && <p className="text-[12px] text-red-600">{errors.resumeFile}</p>}
                  {errors.resume    && <p className="text-[12px] text-red-600">{errors.resume}</p>}
                  {uploadError      && <p className="text-[12px] text-red-600">{uploadError}</p>}
                </div>

                {/* Portfolio links */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-neutral-700">
                    Portfolio links{" "}
                    <span className="text-[11px] font-normal text-neutral-400">up to 3</span>
                  </label>
                  {form.portfolioLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://…"
                        value={link}
                        onChange={(e) => updatePortfolioLink(i, e.target.value)}
                        className={cn(
                          "flex-1 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-900",
                          "placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        )}
                      />
                      <button type="button" onClick={() => removePortfolioLink(i)}
                        className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors px-1">
                        Remove
                      </button>
                    </div>
                  ))}
                  {form.portfolioLinks.length < 3 && (
                    <button type="button" onClick={addPortfolioLink}
                      className="rounded-lg border border-dashed border-neutral-200 py-2 text-[12px] font-medium text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors">
                      + Add portfolio link
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── Step 3: Experience ─────────────────────────────────────── */}
            {step === 3 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <SectionDivider title="Experience" />
                </div>

                {isAuror && form.experience.length === 0 && !errors.experience && (
                  <p className="text-[12px] text-neutral-500">
                    Add at least one experience entry to continue.
                  </p>
                )}
                {errors.experience && (
                  <p className="text-[12px] text-red-600">{errors.experience}</p>
                )}

                {form.experience.map((exp, i) => {
                  const isCurrent = exp.endYear === null && exp.endMonth === null;
                  const dur = calcEntryDuration(exp);
                  const entryErr = errors.experienceItems?.[i];
                  return (
                    <div key={i} className={cn(
                      "flex flex-col gap-3 rounded-xl border bg-neutral-50 px-3 py-3",
                      entryErr ? "border-red-200" : "border-neutral-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-neutral-400">
                          Entry {i + 1}{dur ? ` · ${dur}` : ""}
                        </p>
                        <button type="button" onClick={() => removeExperience(i)}
                          className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      </div>

                      {/* Role + Company */}
                      <div className="grid grid-cols-2 gap-2">
                        <Input label="Role" placeholder="e.g. PM" value={exp.role}
                          onChange={(e) => updateExperience(i, { role: e.target.value })} />
                        <Input label="Company" placeholder="e.g. Acme" value={exp.company}
                          onChange={(e) => updateExperience(i, { company: e.target.value })} />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-medium text-neutral-600">Start</span>
                          <div className="flex gap-1.5">
                            <Select
                              placeholder="Month"
                              options={MONTHS}
                              value={exp.startMonth ?? ""}
                              onChange={(e) => updateExperience(i, { startMonth: e.target.value })}
                              className="flex-1"
                            />
                            <div className="w-[72px]">
                              <Input
                                placeholder="Year"
                                value={exp.startYear ?? ""}
                                onChange={(e) => updateExperience(i, { startYear: e.target.value })}
                                maxLength={4}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-medium text-neutral-600">End</span>
                          {isCurrent ? (
                            <p className="flex h-9 items-center text-[13px] font-medium text-emerald-600">
                              Present
                            </p>
                          ) : (
                            <div className="flex gap-1.5">
                              <Select
                                placeholder="Month"
                                options={MONTHS}
                                value={exp.endMonth ?? ""}
                                onChange={(e) => updateExperience(i, { endMonth: e.target.value || null })}
                                className="flex-1"
                              />
                              <div className="w-[72px]">
                                <Input
                                  placeholder="Year"
                                  value={exp.endYear ?? ""}
                                  onChange={(e) => updateExperience(i, { endYear: e.target.value || null })}
                                  maxLength={4}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Currently working toggle */}
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isCurrent}
                          onChange={(e) =>
                            updateExperience(i, e.target.checked
                              ? { endMonth: null, endYear: null }
                              : { endMonth: "", endYear: "" }
                            )
                          }
                          className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 accent-primary-600"
                        />
                        <span className="text-[12px] text-neutral-500">Currently working here</span>
                      </label>

                      {/* Description */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-medium text-neutral-600">
                          Description <span className="text-red-400 text-[11px]">*</span>
                        </label>
                        <textarea
                          placeholder="What did you do and achieve in this role?"
                          value={exp.description ?? ""}
                          onChange={(e) => {
                            updateExperience(i, { description: e.target.value });
                            if (e.target.value.trim() && errors.experienceItems) {
                              setErrors((prev) => {
                                const items = [...(prev.experienceItems ?? [])];
                                items[i] = "";
                                return { ...prev, experienceItems: items.some(Boolean) ? items : undefined };
                              });
                            }
                          }}
                          rows={3}
                          maxLength={400}
                          className={cn(
                            "w-full resize-none rounded-lg border px-3 py-2 bg-white",
                            "text-[13px] text-neutral-900 placeholder:text-neutral-400",
                            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
                            entryErr ? "border-red-300" : "border-neutral-200"
                          )}
                        />
                        {entryErr
                          ? <p className="text-[12px] text-red-600">{entryErr}</p>
                          : <p className="text-[11px] text-neutral-400">{exp.description?.length ?? 0}/400</p>
                        }
                      </div>
                    </div>
                  );
                })}

                <button type="button" onClick={addExperience}
                  disabled={form.experience.length >= 6}
                  className="rounded-lg border border-dashed border-neutral-200 py-2 text-[12px] font-medium text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                  + Add experience
                </button>

                {totalExp > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
                    <span className="text-[12px] font-semibold text-primary-700">
                      Total: {totalExp} yr{totalExp !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-primary-400">(auto-calculated)</span>
                  </div>
                )}

                {isSeeker && (
                  <p className="text-[11px] text-neutral-400">Experience is optional for Seekers.</p>
                )}
              </div>
            )}

            {/* ── Step 4: Education ──────────────────────────────────────── */}
            {step === 4 && (
              <div className="flex flex-col gap-3">
                <SectionDivider title="Education" />

                {isSeeker && form.education.length === 0 && !errors.education && (
                  <p className="text-[12px] text-neutral-500">
                    Add at least one education entry to continue.
                  </p>
                )}
                {errors.education && (
                  <p className="text-[12px] text-red-600">{errors.education}</p>
                )}

                {form.education.map((edu, i) => {
                  const entryErr = errors.educationItems?.[i];
                  return (
                    <div key={i} className={cn(
                      "flex flex-col gap-2 rounded-xl border bg-neutral-50 px-3 py-3",
                      entryErr ? "border-red-200" : "border-neutral-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-neutral-400">Entry {i + 1}</p>
                        <button type="button" onClick={() => removeEducation(i)}
                          className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      </div>

                      {/* Degree + Course */}
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          label="Degree *"
                          placeholder="Select…"
                          options={DEGREE_OPTIONS}
                          value={edu.degree ?? ""}
                          onChange={(e) => updateEducation(i, "degree", e.target.value)}
                        />
                        <Input
                          label="Field of study *"
                          placeholder="e.g. Computer Science"
                          value={edu.course ?? ""}
                          onChange={(e) => updateEducation(i, "course", e.target.value)}
                        />
                      </div>

                      {/* Institution + Year */}
                      <div className="grid grid-cols-2 gap-2">
                        <Input label="Institution" placeholder="e.g. UC Berkeley" value={edu.school}
                          onChange={(e) => updateEducation(i, "school", e.target.value)} />
                        <Input label="Year" placeholder="e.g. 2022" value={edu.year}
                          onChange={(e) => updateEducation(i, "year", e.target.value)} />
                      </div>

                      {entryErr && <p className="text-[12px] text-red-600">{entryErr}</p>}
                    </div>
                  );
                })}

                <button type="button" onClick={addEducation}
                  disabled={form.education.length >= 4}
                  className="rounded-lg border border-dashed border-neutral-200 py-2 text-[12px] font-medium text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                  + Add education
                </button>

                {isAuror && (
                  <p className="text-[11px] text-neutral-400">Education is optional for Aurors.</p>
                )}
              </div>
            )}

            {/* ── Step 5: Goals (role-specific) ──────────────────────────── */}
            {step === 5 && (
              <>
                {isSeeker && (
                  <>
                    <TagInput
                      label="Target roles"
                      placeholder="e.g. product manager, data analyst…"
                      value={form.targetRoles}
                      onChange={(tags) => set("targetRoles", tags)}
                      max={3}
                      hint="Roles you're actively targeting · max 3"
                    />
                    <Input
                      label="Dream role"
                      placeholder="e.g. Head of Product at a startup"
                      value={form.dreamRole}
                      onChange={(e) => set("dreamRole", e.target.value)}
                      hint="Your long-term aspiration"
                    />
                    <TagInput
                      label="Dream companies"
                      placeholder="e.g. Stripe, Notion…"
                      value={form.dreamCompanies}
                      onChange={(tags) => set("dreamCompanies", tags)}
                      max={3}
                      hint="Up to 3 companies you'd love to work at"
                    />
                  </>
                )}
                {isAuror && (
                  <>
                    <CheckboxGroup
                      label="Session types you offer"
                      options={SESSION_TYPE_OPTIONS}
                      selected={form.sessionTypes}
                      onChange={(vals) => set("sessionTypes", vals)}
                    />
                    <TagInput
                      label="Session tags"
                      placeholder="e.g. resume review, behavioral…"
                      value={form.sessionTags}
                      onChange={(tags) => set("sessionTags", tags)}
                      max={10}
                      hint="Topics you can help with · press Enter to add"
                    />
                  </>
                )}
                {serverError && <p className="text-[12px] text-red-600">{serverError}</p>}
              </>
            )}
          </div>

          {/* Required fields note */}
          {step < 5 && (
            <p className="mt-3 text-[11px] text-neutral-400">
              Fields marked with{" "}
              <span className="text-red-400 font-medium">*</span>{" "}
              are required to complete your profile ✨
            </p>
          )}

          {/* Navigation */}
          <div className="mt-4 flex items-center gap-3 border-t border-neutral-100 pt-5">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep} disabled={submitting || uploading}>
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button type="button" className="flex-1" onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Button type="button" className="flex-1" isLoading={submitting || uploading} onClick={handleSubmit}>
                Save profile
              </Button>
            )}
          </div>

        </Card>
      </div>
    </div>
  );
}

// ── StepBar ───────────────────────────────────────────────────────────────────

function StepBar({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-6">
      {/* Numbered step circles */}
      <div className="flex items-center">
        {Array.from({ length: total }, (_, i) => (
          <React.Fragment key={i}>
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
              i + 1 < step   ? "bg-emerald-500 text-white" :
              i + 1 === step ? "bg-primary-600 text-white" :
                               "bg-neutral-100 text-neutral-400"
            )}>
              {i + 1 < step ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (i + 1)}
            </div>
            {i < total - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-1 transition-colors",
                i + 1 < step ? "bg-emerald-300" : "bg-neutral-100"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step label + completion % */}
      <div className="mt-2.5 flex items-baseline justify-between">
        <p className="text-[16px] font-bold text-neutral-900">{labels[step - 1]}</p>
        <span className="text-[11px] font-semibold text-primary-600">{pct}% complete</span>
      </div>
      <p className="text-[12px] text-neutral-400">Step {step} of {total}</p>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── SectionDivider ────────────────────────────────────────────────────────────

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{title}</span>
      <div className="h-px flex-1 bg-neutral-100" />
    </div>
  );
}
