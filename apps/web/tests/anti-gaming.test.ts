import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { detectValidationRings, detectVelocityAnomalies, detectCoordinationSignals, runFullAnomaScan } from "@/lib/anti-gaming/detection";

describe("Anti-Gaming Detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detectValidationRings", () => {
    it("detects A→B→C→A mutual validation ring", async () => {
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([
        { validatorId: "alice", proof: { builderId: "bob", agent: null } },
        { validatorId: "bob", proof: { builderId: "carol", agent: null } },
        { validatorId: "carol", proof: { builderId: "alice", agent: null } },
      ] as any);

      const reports = await detectValidationRings(7);

      expect(reports.length).toBeGreaterThan(0);
      expect(reports[0].type).toBe("VALIDATION_RING");
      expect(reports[0].severity).toBe("HIGH");
      expect(reports[0].actors).toHaveLength(3);
    });

    it("returns empty for non-circular validations", async () => {
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([
        { validatorId: "alice", proof: { builderId: "bob", agent: null } },
        { validatorId: "alice", proof: { builderId: "carol", agent: null } },
        { validatorId: "bob", proof: { builderId: "carol", agent: null } },
      ] as any);

      const reports = await detectValidationRings(7);
      expect(reports).toHaveLength(0);
    });

    it("ignores self-validation", async () => {
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([
        { validatorId: "alice", proof: { builderId: "alice", agent: null } },
      ] as any);

      const reports = await detectValidationRings(7);
      expect(reports).toHaveLength(0);
    });
  });

  describe("detectVelocityAnomalies", () => {
    it("flags user with 3σ reputation spike", async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([
        { id: "spammer", username: "spammer" },
      ] as any);

      vi.mocked(db.reputationLog.findMany)
        .mockResolvedValueOnce([
          { delta: 500 },
          { delta: 300 },
        ] as any)
        .mockResolvedValueOnce(
          Array.from({ length: 12 }, () => ({ delta: 5 })) as any
        );

      const reports = await detectVelocityAnomalies();

      expect(reports.length).toBeGreaterThan(0);
      expect(reports[0].type).toBe("VELOCITY_SPIKE");
    });

    it("does not flag normal activity", async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([
        { id: "normal", username: "normal" },
      ] as any);

      vi.mocked(db.reputationLog.findMany)
        .mockResolvedValueOnce([{ delta: 10 }] as any)
        .mockResolvedValueOnce(
          Array.from({ length: 12 }, () => ({ delta: 10 })) as any
        );

      const reports = await detectVelocityAnomalies();
      expect(reports).toHaveLength(0);
    });
  });

  describe("detectCoordinationSignals", () => {
    it("flags 3+ new accounts validating same proof within 48hrs", async () => {
      const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([
        { proofId: "proof-1", validatorId: "new-1", validator: { createdAt: recentDate } },
        { proofId: "proof-1", validatorId: "new-2", validator: { createdAt: recentDate } },
        { proofId: "proof-1", validatorId: "new-3", validator: { createdAt: recentDate } },
      ] as any);

      const reports = await detectCoordinationSignals();

      expect(reports.length).toBe(1);
      expect(reports[0].type).toBe("COORDINATION");
      expect(reports[0].actors).toHaveLength(3);
    });

    it("does not flag established accounts", async () => {
      const oldDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([
        { proofId: "proof-1", validatorId: "old-1", validator: { createdAt: oldDate } },
        { proofId: "proof-1", validatorId: "old-2", validator: { createdAt: oldDate } },
        { proofId: "proof-1", validatorId: "old-3", validator: { createdAt: oldDate } },
      ] as any);

      const reports = await detectCoordinationSignals();
      expect(reports).toHaveLength(0);
    });
  });

  describe("runFullAnomaScan", () => {
    it("aggregates all detection types and creates trust events", async () => {
      vi.mocked(db.proofValidation.findMany).mockResolvedValue([]);
      vi.mocked(db.user.findMany).mockResolvedValue([]);
      vi.mocked(db.trustEvent.create).mockResolvedValue({} as any);

      const reports = await runFullAnomaScan();
      expect(Array.isArray(reports)).toBe(true);
    });
  });
});
