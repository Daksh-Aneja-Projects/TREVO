import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      capabilities: true,
      ioContract: true,
      trustScore: true,
      successRate: true,
      totalProofs: true,
      version: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: { username: true, tier: true, trustScore: true },
      },
      forkedFrom: {
        select: { name: true, slug: true },
      },
      _count: { select: { proofs: true, forks: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ data: agent });
}
