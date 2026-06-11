import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proof = await db.proofEntry.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      methodology: true,
      outcome: true,
      evidence: true,
      domainVertical: true,
      validationStatus: true,
      validationCount: true,
      trustWeight: true,
      createdAt: true,
      builder: {
        select: { username: true, tier: true, trustScore: true },
      },
      agent: {
        select: { name: true, slug: true, trustScore: true },
      },
      validations: {
        select: {
          id: true,
          verdict: true,
          reasoning: true,
          confidence: true,
          reputationStaked: true,
          createdAt: true,
          validator: {
            select: { username: true, tier: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      problem: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  if (!proof) {
    return NextResponse.json({ error: "Proof not found" }, { status: 404 });
  }

  return NextResponse.json({ data: proof });
}
