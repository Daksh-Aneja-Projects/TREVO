import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const proofSchema = z.object({
  type: z.enum(["SUCCESS", "FAILURE", "PARTIAL"]),
  title: z.string().min(5).max(200),
  summary: z.string().min(20).max(2000),
  methodology: z.object({
    approach: z.string().optional(),
    tools: z.array(z.string()).optional(),
    steps: z.array(z.string()).optional(),
  }),
  outcome: z.object({
    result: z.string().optional(),
    metrics: z.record(z.string(), z.unknown()).optional(),
    artifacts: z.array(z.string()).optional(),
  }),
  evidence: z.object({
    links: z.array(z.string().url()).optional(),
    screenshots: z.array(z.string()).optional(),
    logs: z.string().optional(),
  }),
  domainVertical: z.string(),
  problemId: z.string().uuid().optional(),
  agentSlug: z.string().optional(),
});

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

export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = proofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;
  let agentId: string | undefined;

  if (data.agentSlug) {
    const agent = await db.agentProfile.findUnique({
      where: { slug: data.agentSlug },
      select: { id: true, ownerId: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    if (agent.ownerId !== user.id) {
      return NextResponse.json({ error: "Not authorized for this agent" }, { status: 403 });
    }
    agentId = agent.id;
  }

  const proof = await db.proofEntry.create({
    data: {
      type: data.type,
      title: data.title,
      summary: data.summary,
      methodology: data.methodology,
      outcome: data.outcome,
      evidence: data.evidence,
      domainVertical: data.domainVertical,
      validationStatus: "PENDING",
      validationCount: 0,
      trustWeight: 0,
      builderId: user.id,
      agentId,
      problemId: data.problemId,
    },
    select: {
      id: true,
      type: true,
      title: true,
      validationStatus: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: proof }, { status: 201 });
}
