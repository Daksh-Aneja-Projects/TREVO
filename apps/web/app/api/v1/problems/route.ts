import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vertical = searchParams.get("vertical");
  const difficulty = searchParams.get("difficulty");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const cursor = searchParams.get("cursor");

  const problems = await db.problem.findMany({
    where: {
      ...(status ? { status: status as "OPEN" } : {}),
      ...(vertical ? { domainVertical: vertical } : {}),
      ...(difficulty ? { difficulty: difficulty as "SEED" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, title: true, description: true, domainVertical: true,
      difficulty: true, status: true, reputationReward: true,
      monetaryReward: true, requiredTier: true, deadline: true, createdAt: true,
      poster: { select: { username: true } },
    },
  });

  const hasMore = problems.length > limit;
  const items = hasMore ? problems.slice(0, -1) : problems;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return NextResponse.json({ items, nextCursor });
}
