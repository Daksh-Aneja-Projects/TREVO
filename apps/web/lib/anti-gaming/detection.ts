import { db } from "@/lib/db";

interface AnomalyReport {
  type: "VALIDATION_RING" | "VELOCITY_SPIKE" | "COORDINATION" | "QUALITY_DRIFT" | "SYBIL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actors: string[];
  evidence: Record<string, unknown>;
  description: string;
}

export async function detectValidationRings(windowDays = 7): Promise<AnomalyReport[]> {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const validations = await db.proofValidation.findMany({
    where: { createdAt: { gte: cutoff } },
    select: {
      validatorId: true,
      proof: { select: { builderId: true, agent: { select: { ownerId: true } } } },
    },
  });

  const graph: Record<string, Set<string>> = {};
  for (const v of validations) {
    const target = v.proof.builderId || v.proof.agent?.ownerId;
    if (!target || target === v.validatorId) continue;
    if (!graph[v.validatorId]) graph[v.validatorId] = new Set();
    graph[v.validatorId].add(target);
  }

  const reports: AnomalyReport[] = [];
  const users = Object.keys(graph);
  for (const a of users) {
    for (const b of graph[a] || []) {
      for (const c of graph[b] || []) {
        if (graph[c]?.has(a) && a !== b && b !== c && a !== c) {
          reports.push({
            type: "VALIDATION_RING",
            severity: "HIGH",
            actors: [a, b, c],
            evidence: { pattern: `${a} → ${b} → ${c} → ${a}`, window: `${windowDays} days` },
            description: "Mutual validation ring detected",
          });
        }
      }
    }
  }
  return reports;
}

export async function detectVelocityAnomalies(): Promise<AnomalyReport[]> {
  const reports: AnomalyReport[] = [];
  const recentWindow = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const historicalWindow = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const users = await db.user.findMany({
    where: { reputationLogs: { some: { createdAt: { gte: recentWindow } } } },
    select: { id: true, username: true },
  });

  for (const user of users) {
    const recentLogs = await db.reputationLog.findMany({
      where: { userId: user.id, createdAt: { gte: recentWindow } },
      select: { delta: true },
    });

    const historicalLogs = await db.reputationLog.findMany({
      where: { userId: user.id, createdAt: { gte: historicalWindow, lt: recentWindow } },
      select: { delta: true },
    });

    const recentGain = recentLogs.reduce((s, l) => s + Math.max(0, l.delta), 0);
    const weeklyAvg =
      historicalLogs.length > 0
        ? historicalLogs.reduce((s, l) => s + Math.max(0, l.delta), 0) / 12
        : 0;

    const values = historicalLogs.map((l) => Math.max(0, l.delta));
    const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const stddev = values.length > 1
      ? Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length)
      : mean;

    if (stddev > 0 && recentGain > mean + 3 * stddev) {
      reports.push({
        type: "VELOCITY_SPIKE",
        severity: recentGain > mean + 5 * stddev ? "CRITICAL" : "HIGH",
        actors: [user.id],
        evidence: { recentGain, weeklyAvg, stddev, threshold: mean + 3 * stddev },
        description: `Reputation gain ${recentGain} exceeds 3σ threshold (${Math.round(mean + 3 * stddev)})`,
      });
    }
  }
  return reports;
}

export async function detectCoordinationSignals(): Promise<AnomalyReport[]> {
  const reports: AnomalyReport[] = [];
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const recentValidations = await db.proofValidation.findMany({
    where: { createdAt: { gte: cutoff } },
    select: {
      proofId: true,
      validatorId: true,
      validator: { select: { createdAt: true } },
    },
  });

  const proofValidators: Record<string, { validatorId: string; accountAge: Date }[]> = {};
  for (const v of recentValidations) {
    if (!proofValidators[v.proofId]) proofValidators[v.proofId] = [];
    proofValidators[v.proofId].push({ validatorId: v.validatorId, accountAge: v.validator.createdAt });
  }

  for (const [proofId, validators] of Object.entries(proofValidators)) {
    if (validators.length < 3) continue;
    const newAccounts = validators.filter(
      (v) => Date.now() - v.accountAge.getTime() < 30 * 24 * 60 * 60 * 1000
    );
    if (newAccounts.length >= 3) {
      reports.push({
        type: "COORDINATION",
        severity: "HIGH",
        actors: newAccounts.map((v) => v.validatorId),
        evidence: { proofId, newAccountCount: newAccounts.length, totalValidators: validators.length },
        description: `${newAccounts.length} new accounts validated same proof within 48hrs`,
      });
    }
  }
  return reports;
}

export async function runFullAnomaScan(): Promise<AnomalyReport[]> {
  const [rings, velocity, coordination] = await Promise.all([
    detectValidationRings(),
    detectVelocityAnomalies(),
    detectCoordinationSignals(),
  ]);

  const allReports = [...rings, ...velocity, ...coordination];

  for (const report of allReports) {
    for (const actorId of report.actors) {
      await db.trustEvent.create({
        data: {
          actorId,
          type: "FLAG",
          weight: report.severity === "CRITICAL" ? 5 : report.severity === "HIGH" ? 3 : 1,
          anomalyScore: report.severity === "CRITICAL" ? 1 : report.severity === "HIGH" ? 0.7 : 0.3,
          metadata: report as unknown as Record<string, unknown>,
        },
      });
    }
  }

  return allReports;
}

export type { AnomalyReport };
