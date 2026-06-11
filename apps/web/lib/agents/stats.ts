import { callAgent } from "@/lib/ai";

interface MetricSnapshot {
  metric: string;
  value: number;
  unit: string;
  source: string;
  sourceUrl?: string;
  label: string;
  delta?: number;
  deltaPercent?: number;
  trend30d: number[];
  keyInsight?: string;
  confidence: number;
}

interface StatsRefreshPayload {
  metrics: MetricSnapshot[];
  marketPulse: string;
}

export async function runStatsRefreshAgent(
  existingMetrics: { metric: string; value: number; recordedAt: Date }[],
  articleExtracted: { metric: string; value: number; unit: string; source: string }[]
): Promise<StatsRefreshPayload> {
  return callAgent<StatsRefreshPayload>(
    `You are TREVO's StatsRefreshAgent. Process incoming metric data from two streams:
1. Article-extracted metrics from news pipeline
2. Historical metric snapshots for delta calculation

For each metric compute: current value, delta from previous, 30-day trend array (for sparkline charts), anomaly flag if >2σ, confidence score based on source count, and a 1-sentence key insight.
Generate a 2-sentence MarketPulse synthesis across all metrics.
Never fabricate data — mark unavailable sources as confidence: 0.`,
    `Process metrics refresh:

Existing metrics (${existingMetrics.length}):
${existingMetrics.map((m) => `- ${m.metric}: ${m.value} (recorded: ${m.recordedAt.toISOString()})`).join("\n")}

Article-extracted metrics (${articleExtracted.length}):
${articleExtracted.map((m) => `- ${m.metric}: ${m.value} ${m.unit} (source: ${m.source})`).join("\n")}

Return JSON: {
  metrics: [{ metric, value, unit, source, sourceUrl?, label, delta?, deltaPercent?, trend30d: number[], keyInsight?, confidence: 0-1 }],
  marketPulse: string (2 sentences)
}`
  );
}

export type { MetricSnapshot, StatsRefreshPayload };
