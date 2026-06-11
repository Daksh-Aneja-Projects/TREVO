import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { UserTier } from "@prisma/client";

interface TrustBreakdown {
  proofScore: number;
  consistencyScore: number;
  communityScore: number;
  contributionScore: number;
  governanceScore: number;
  longevityMultiplier: number;
  total: number;
  tier: UserTier;
}

const TIER_THRESHOLDS: { min: number; tier: UserTier }[] = [
  { min: 2000, tier: "SOVEREIGN" },
  { min: 500, tier: "TRUSTED" },
  { min: 100, tier: "PROVEN" },
  { min: 0, tier: "SEED" },
];

function determineTier(score: number): UserTier {
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min) return t.tier;
  }
  return "SEED";
}

export async function calculateTrustScore(userId: string): Promise<TrustBreakdown> {
  const cacheKey = `trust:${userId}`;
  const cached = await cacheGet<TrustBreakdown>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const accountAge = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  const proofs = await db.proofEntry.findMany({
    where: {
      OR: [{ builderId: userId }, { agent: { ownerId: userId } }],
      validationStatus: "VALIDATED",
    },
    select: { type: true, trustWeight: true, createdAt: true, validationCount: true },
  });

  let proofScore = 0;
  for (const proof of proofs) {
    const ageMs = now.getTime() - proof.createdAt.getTime();
    const recencyDecay = Math.max(0.3, 1 - ageMs / (180 * 24 * 60 * 60 * 1000));
    const qualityMultiplier = Math.min(2, 1 + proof.validationCount * 0.1);
    proofScore += proof.trustWeight * recencyDecay * qualityMultiplier * (proof.type === "SUCCESS" ? 10 : proof.type === "PARTIAL" ? 5 : 2);
  }

  const recentProofs = await db.proofEntry.findMany({
    where: {
      OR: [{ builderId: userId }, { agent: { ownerId: userId } }],
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { type: true },
  });

  const successCount = recentProofs.filter((p) => p.type === "SUCCESS").length;
  const totalRecent = recentProofs.length;
  const consistencyScore = totalRecent > 0 ? (successCount / totalRecent) * 50 : 0;

  const validations = await db.proofValidation.findMany({
    where: { validator: { id: userId } },
    select: { verdict: true, confidence: true },
  });

  const endorsementCount = await db.commonEntry.count({
    where: { authorId: userId, endorsements: { gt: 0 } },
  });

  const communityScore = validations.length * 3 + endorsementCount * 5;

  const commons = await db.commonEntry.findMany({
    where: { authorId: userId },
    select: { qualityScore: true, endorsements: true },
  });

  const contributionScore = commons.reduce(
    (sum, c) => sum + c.qualityScore * 2 + c.endorsements * 3,
    0
  );

  const ballots = await db.governanceBallot.count({ where: { voterId: userId } });
  const governanceScore = ballots * 5;

  const accountAgeMs = accountAge ? now.getTime() - accountAge.createdAt.getTime() : 0;
  const accountAgeDays = accountAgeMs / (24 * 60 * 60 * 1000);
  const longevityMultiplier = Math.min(1.5, 1 + Math.log10(Math.max(1, accountAgeDays / 30)) * 0.2);

  const rawTotal = proofScore + consistencyScore + communityScore + contributionScore + governanceScore;
  const total = Math.round(rawTotal * longevityMultiplier);
  const tier = determineTier(total);

  const breakdown: TrustBreakdown = {
    proofScore: Math.round(proofScore),
    consistencyScore: Math.round(consistencyScore),
    communityScore: Math.round(communityScore),
    contributionScore: Math.round(contributionScore),
    governanceScore: Math.round(governanceScore),
    longevityMultiplier: Math.round(longevityMultiplier * 100) / 100,
    total,
    tier,
  };

  await cacheSet(cacheKey, breakdown, 60);
  return breakdown;
}

export async function recalculateAndUpdateUser(userId: string): Promise<TrustBreakdown> {
  const breakdown = await calculateTrustScore(userId);
  await db.user.update({
    where: { id: userId },
    data: { trustScore: breakdown.total, tier: breakdown.tier },
  });
  return breakdown;
}

export async function logReputationEvent(
  userId: string,
  delta: number,
  reason: string,
  proofId?: string,
  problemId?: string
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { trustScore: true } });
  if (!user) return;

  await db.reputationLog.create({
    data: {
      userId,
      delta,
      reason,
      proofId,
      problemId,
      snapshot: user.trustScore + delta,
    },
  });

  await db.user.update({
    where: { id: userId },
    data: { reputationPoints: { increment: delta } },
  });

  await recalculateAndUpdateUser(userId);
}

export { determineTier, TIER_THRESHOLDS };
export type { TrustBreakdown };
