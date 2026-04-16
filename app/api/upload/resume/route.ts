import { NextRequest, NextResponse } from "next/server";
import {
  createServerClient,
  RESUME_BUCKET,
  RESUME_MAX_BYTES,
  RESUME_ALLOWED_TYPES,
  RESUME_ALLOWED_EXTS,
} from "@/lib/supabase";

export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: "file and userId are required" }, { status: 400 });
    }

    // Validate type
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!RESUME_ALLOWED_TYPES.includes(file.type) && !RESUME_ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: "Only PDF, DOC, and DOCX files are accepted" },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > RESUME_MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 5 MB" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Deterministic path: one file per user, overwrites on re-upload
    const safeExt = ext === ".docx" ? ".docx" : ext === ".doc" ? ".doc" : ".pdf";
    const filePath = `${userId}/resume${safeExt}`;

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(filePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload/resume]", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(RESUME_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("[upload/resume]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
