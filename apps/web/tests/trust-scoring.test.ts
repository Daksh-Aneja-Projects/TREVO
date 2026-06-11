import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { calculateTrustScore, logReputationEvent } from "@/lib/trust/scoring";

vi.mock("@/lib/redis", () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

describe("Trust Scoring Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateTrustScore", () => {
    it("returns SEED tier for new user with no activity", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        createdAt: new Date(),
      } as any);
      vi.mocked(db.proofEntry.findMany).mockResolvedValue([]);
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([]);
      vi.mocked(db.commonEntry.count).mockResolvedValue(0);
      vi.mocked(db.commonEntry.findMany).mockResolvedValue([]);
      vi.mocked(db.governanceBallot.count).mockResolvedValue(0);

      const result = await calculateTrustScore("user-1");

      expect(result.tier).toBe("SEED");
      expect(result.total).toBe(0);
      expect(result.proofScore).toBe(0);
      expect(result.consistencyScore).toBe(0);
      expect(result.communityScore).toBe(0);
      expect(result.contributionScore).toBe(0);
      expect(result.governanceScore).toBe(0);
    });

    it("calculates PROVEN tier for active builder", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      } as any);

      vi.mocked(db.proofEntry.findMany)
        .mockResolvedValueOnce([
          { type: "SUCCESS", trustWeight: 10, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), validationCount: 3 },
          { type: "SUCCESS", trustWeight: 8, createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), validationCount: 2 },
          { type: "PARTIAL", trustWeight: 5, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), validationCount: 1 },
        ] as any)
        .mockResolvedValueOnce([
          { type: "SUCCESS" },
          { type: "SUCCESS" },
          { type: "PARTIAL" },
        ] as any);

      vi.mocked(db.proofValidation.findMany).mockResolvedValue(
        Array.from({ length: 5 }, () => ({ verdict: "APPROVE", confidence: 0.8 })) as any
      );
      vi.mocked(db.commonEntry.count).mockResolvedValue(2);
      vi.mocked(db.commonEntry.findMany).mockResolvedValue([
        { qualityScore: 7, endorsements: 3 },
      ] as any);
      vi.mocked(db.governanceBallot.count).mockResolvedValue(2);

      const result = await calculateTrustScore("user-2");

      expect(result.total).toBeGreaterThan(100);
      expect(result.tier).toBe("PROVEN");
      expect(result.proofScore).toBeGreaterThan(0);
      expect(result.consistencyScore).toBeGreaterThan(0);
      expect(result.communityScore).toBeGreaterThan(0);
      expect(result.longevityMultiplier).toBeGreaterThanOrEqual(1);
    });

    it("applies recency decay to old proofs", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ createdAt: new Date() } as any);
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([]);
      vi.mocked(db.commonEntry.count).mockResolvedValue(0);
      vi.mocked(db.commonEntry.findMany).mockResolvedValue([]);
      vi.mocked(db.governanceBallot.count).mockResolvedValue(0);

      vi.mocked(db.proofEntry.findMany)
        .mockResolvedValueOnce([
          { type: "SUCCESS", trustWeight: 10, createdAt: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000), validationCount: 1 },
        ] as any)
        .mockResolvedValueOnce([]);

      const oldProofResult = await calculateTrustScore("user-old");

      vi.clearAllMocks();
      vi.mocked(db.user.findUnique).mockResolvedValue({ createdAt: new Date() } as any);
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([]);
      vi.mocked(db.commonEntry.count).mockResolvedValue(0);
      vi.mocked(db.commonEntry.findMany).mockResolvedValue([]);
      vi.mocked(db.governanceBallot.count).mockResolvedValue(0);

      vi.mocked(db.proofEntry.findMany)
        .mockResolvedValueOnce([
          { type: "SUCCESS", trustWeight: 10, createdAt: new Date(), validationCount: 1 },
        ] as any)
        .mockResolvedValueOnce([{ type: "SUCCESS" }] as any);

      const newProofResult = await calculateTrustScore("user-new");

      expect(newProofResult.proofScore).toBeGreaterThan(oldProofResult.proofScore);
    });
  });

  describe("logReputationEvent", () => {
    it("creates a log entry and updates user reputation", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ trustScore: 50 } as any);
      vi.mocked(db.reputationLog.create).mockResolvedValue({} as any);
      vi.mocked(db.user.update).mockResolvedValue({} as any);

      vi.mocked(db.proofEntry.findMany).mockResolvedValue([]);
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([]);
      vi.mocked(db.commonEntry.count).mockResolvedValue(0);
      vi.mocked(db.commonEntry.findMany).mockResolvedValue([]);
      vi.mocked(db.governanceBallot.count).mockResolvedValue(0);

      await logReputationEvent("user-1", 10, "proof_validated", "proof-1");

      expect(db.reputationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          delta: 10,
          reason: "proof_validated",
          proofId: "proof-1",
          snapshot: 60,
        }),
      });

      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { reputationPoints: { increment: 10 } },
        })
      );
    });

    it("does nothing for nonexistent user", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);
      await logReputationEvent("nonexistent", 10, "test");
      expect(db.reputationLog.create).not.toHaveBeenCalled();
    });
  });
});
