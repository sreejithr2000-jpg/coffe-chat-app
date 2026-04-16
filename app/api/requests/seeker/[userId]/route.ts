import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const requests = await prisma.request.findMany({
      where: { seekerId: userId },
      include: {
        auror: {
          select: {
            profile: {
              select: {
                name: true,
                headline: true,
                currentRole: true,
              },
            },
          },
        },
        availabilitySlot: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-expire pending requests past their deadline
    const now = new Date();
    const settled = await Promise.all(
      requests.map(async (req) => {
        if (req.status === "pending" && now > req.expiresAt) {
          const updated = await prisma.request.update({
            where: { id: req.id },
            data: { status: "expired" },
            include: {
              auror: { select: { profile: { select: { name: true, headline: true, currentRole: true } } } },
              availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
            },
          });
          return updated;
        }
        return req;
      })
    );

    return NextResponse.json(settled);
  } catch (error) {
    console.error("[requests/seeker GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
