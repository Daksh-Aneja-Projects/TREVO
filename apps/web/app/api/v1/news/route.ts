import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const cursor = searchParams.get("cursor");

  const where: Record<string, unknown> = { category: { notIn: ["TREND_PULSE", "EDITORS_PICK"] } };
  if (category) where.category = category;

  const items = await db.newsArticle.findMany({
    where: where as any,
    take: 21,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, title: true, summary: true, url: true, source: true,
      publishedAt: true, imageUrl: true, category: true, sentiment: true,
      insightTags: true,
    },
  });

  return NextResponse.json({
    items: items.slice(0, 20),
    nextCursor: items.length > 20 ? items[20].id : undefined,
  });
}
