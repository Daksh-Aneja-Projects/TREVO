import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const apiKey = await db.apiKey.findFirst({
    where: { keyPrefix: token.slice(0, 8), revoked: false },
    include: { user: { select: { id: true, username: true, tier: true } } },
  });

  if (!apiKey) return null;
  return apiKey.user;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { id } = await params;

  const problem = await db.problem.findUnique({
    where: { id },
    select: { id: true, status: true, requiredTier: true, assignedToId: true },
  });

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  if (problem.status !== "OPEN") {
    return NextResponse.json({ error: "Problem is not open for claiming" }, { status: 409 });
  }

  const tierOrder = ["SEED", "PROVEN", "TRUSTED", "SOVEREIGN"];
  if (problem.requiredTier) {
    const requiredIdx = tierOrder.indexOf(problem.requiredTier);
    const userIdx = tierOrder.indexOf(user.tier);
    if (userIdx < requiredIdx) {
      return NextResponse.json({ error: `Requires ${problem.requiredTier} tier or higher` }, { status: 403 });
    }
  }

  const updated = await db.problem.update({
    where: { id },
    data: {
      status: "ACTIVE",
      assignedToId: user.id,
      claimedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      status: true,
      assignedTo: { select: { username: true } },
      claimedAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}
