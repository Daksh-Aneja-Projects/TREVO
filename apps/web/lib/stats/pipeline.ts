import { db } from "@/lib/db";
import { cacheDel } from "@/lib/redis";
import { runStatsRefreshAgent } from "@/lib/agents/stats";

export async function runStatsPipeline(articleMetrics?: { metric: string; value: number; unit: string; source: string }[]) {
  const existingMetrics = await db.aIStatSnapshot.findMany({
    orderBy: { recordedAt: "desc" },
    distinct: ["metric"],
    take: 20,
    select: { metric: true, value: true, recordedAt: true },
  });

  const payload = await runStatsRefreshAgent(existingMetrics, articleMetrics || []);
  if (!payload) return { updated: 0 };

  let updated = 0;
  for (const metric of payload.metrics) {
    if (metric.confidence <= 0) continue;
    try {
      await db.aIStatSnapshot.create({
        data: {
          metric: metric.metric,
          value: metric.value,
          unit: metric.unit,
          source: metric.source,
          sourceUrl: metric.sourceUrl,
          label: metric.label,
          delta: metric.delta,
          deltaPercent: metric.deltaPercent,
          trend30d: metric.trend30d,
          keyInsight: metric.keyInsight,
          confidence: metric.confidence,
        },
      });
      updated++;
    } catch {}
  }

  await cacheDel("feed:stats");
  await cacheDel("feed:landing");

  return { updated, marketPulse: payload.marketPulse };
}
