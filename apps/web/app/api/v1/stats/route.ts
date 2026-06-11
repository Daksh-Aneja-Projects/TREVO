import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [metrics, marketPulse] = await Promise.all([
    db.aIStatSnapshot.findMany({
      orderBy: { recordedAt: "desc" },
      distinct: ["metric"],
      take: 20,
      select: {
        metric: true, value: true, unit: true, source: true, sourceUrl: true,
        label: true, delta: true, deltaPercent: true, trend30d: true,
        keyInsight: true, confidence: true, recordedAt: true,
      },
    }),
    db.newsArticle.findFirst({
      where: { category: "TREND_PULSE" },
      orderBy: { fetchedAt: "desc" },
      select: { summary: true, fetchedAt: true },
    }),
  ]);

  return NextResponse.json({
    metrics,
    marketPulse: marketPulse?.summary || null,
    lastUpdated: marketPulse?.fetchedAt || metrics[0]?.recordedAt || null,
  });
}
