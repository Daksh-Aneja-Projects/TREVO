import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const context = await db.agentContext.findFirst({
    where: { agentId: agent.id },
    orderBy: { updatedAt: "desc" },
    select: {
      sessionKey: true,
      contextBlob: true,
      ttl: true,
      updatedAt: true,
    },
  });

  if (!context) {
    return NextResponse.json({ data: null, message: "No context available" });
  }

  return NextResponse.json({ data: context });
}
