import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Browser-side Supabase client (safe to import in client components).
 */
export const supabase = createClient(supabaseUrl, publishableKey);

/**
 * Server-side Supabase client for storage operations (API routes only).
 */
export function createServerClient() {
  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  });
}

export const RESUME_BUCKET = "resumes";
export const RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const RESUME_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const RESUME_ALLOWED_EXTS = [".pdf", ".doc", ".docx"];
