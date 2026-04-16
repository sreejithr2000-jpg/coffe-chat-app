import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalised = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalised } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: { email: normalised, passwordHash: hashPassword(password) },
    });

    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("[auth/signup POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
