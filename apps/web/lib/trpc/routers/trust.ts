import { z } from "zod";
import { router, publicProcedure, authedProcedure, tierGate } from "../trpc";
import { calculateTrustScore, type TrustBreakdown } from "@/lib/trust/scoring";
import { runFullAnomaScan } from "@/lib/anti-gaming/detection";

export const trustRouter = router({
  getMyProfile: authedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
        select: {
          id: true, username: true, displayName: true, avatar: true,
          tier: true, trustScore: true, reputationPoints: true,
          domainVerticals: true, bio: true, email: true,
          createdAt: true,
          _count: { select: { proofs: true, agents: true, validations: true } },
        },
      });

      const reputationTimeline = await ctx.db.reputationLog.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { delta: true, snapshot: true, createdAt: true },
      });

      return { ...user, reputationTimeline };
    }),

  getScore: publicProcedure
    .input(z.object({
      userId: z.string().optional(),
      agentId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (input.userId) {
        return calculateTrustScore(input.userId);
      }
      if (input.agentId) {
        const agent = await ctx.db.agentProfile.findUnique({
          where: { id: input.agentId },
          select: { ownerId: true, trustScore: true },
        });
        if (!agent) return null;
        return calculateTrustScore(agent.ownerId);
      }
      return null;
    }),

  getTimeline: publicProcedure
    .input(z.object({
      userId: z.string().optional(),
      agentId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let targetUserId = input.userId;
      if (input.agentId) {
        const agent = await ctx.db.agentProfile.findUnique({
          where: { id: input.agentId },
          select: { ownerId: true },
        });
        targetUserId = agent?.ownerId;
      }
      if (!targetUserId) return [];

      return ctx.db.reputationLog.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "asc" },
        select: { delta: true, reason: true, snapshot: true, createdAt: true },
      });
    }),

  getAnomalies: tierGate("SOVEREIGN")
    .query(async ({ ctx }) => {
      const flaggedEvents = await ctx.db.trustEvent.findMany({
        where: { type: "FLAG", reviewed: false },
        orderBy: { anomalyScore: "desc" },
        take: 50,
        include: {
          actor: { select: { username: true, avatar: true, tier: true, trustScore: true } },
        },
      });
      return flaggedEvents;
    }),

  runScan: tierGate("SOVEREIGN")
    .mutation(async () => {
      return runFullAnomaScan();
    }),
});
