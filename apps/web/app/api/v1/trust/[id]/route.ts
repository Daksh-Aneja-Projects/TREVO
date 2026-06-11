import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateTrustScore } from "@/lib/trust/scoring";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, username: true, tier: true, trustScore: true, reputationPoints: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const breakdown = await calculateTrustScore(id);

  return NextResponse.json({
    data: {
      userId: user.id,
      username: user.username,
      tier: user.tier,
      trustScore: user.trustScore,
      reputationPoints: user.reputationPoints,
      memberSince: user.createdAt,
      breakdown,
    },
  });
}
