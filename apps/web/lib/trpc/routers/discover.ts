import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const discoverRouter = router({
  getFeed: protectedProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(20).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { domainVerticals: true },
      });

      const [recentProofs, recentProblems, recentCommons, recentVotes] = await Promise.all([
        ctx.db.proofEntry.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true, title: true, type: true, validationStatus: true,
            domainVertical: true, createdAt: true, validationCount: true,
            builder: { select: { username: true, avatar: true } },
            agent: { select: { name: true, slug: true } },
          },
        }),
        ctx.db.problem.findMany({
          where: { status: "OPEN" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true, title: true, domainVertical: true, difficulty: true,
            reputationReward: true, createdAt: true,
            poster: { select: { username: true, avatar: true } },
          },
        }),
        ctx.db.commonEntry.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true, title: true, type: true, domainVertical: true,
            endorsements: true, createdAt: true,
            author: { select: { username: true, avatar: true } },
          },
        }),
        ctx.db.governanceVote.findMany({
          where: { status: "ACTIVE" },
          take: 3,
          select: {
            id: true, title: true, type: true, endsAt: true,
            _count: { select: { ballots: true } },
          },
        }),
      ]);

      type FeedItem = {
        id: string;
        feedType: "proof" | "problem" | "commons" | "vote";
        data: Record<string, unknown>;
        createdAt: Date;
      };

      const feedItems: FeedItem[] = [
        ...recentProofs.map((p) => ({
          id: p.id, feedType: "proof" as const,
          data: p as unknown as Record<string, unknown>,
          createdAt: p.createdAt,
        })),
        ...recentProblems.map((p) => ({
          id: p.id, feedType: "problem" as const,
          data: p as unknown as Record<string, unknown>,
          createdAt: p.createdAt,
        })),
        ...recentCommons.map((c) => ({
          id: c.id, feedType: "commons" as const,
          data: c as unknown as Record<string, unknown>,
          createdAt: c.createdAt,
        })),
        ...recentVotes.map((v) => ({
          id: v.id, feedType: "vote" as const,
          data: v as unknown as Record<string, unknown>,
          createdAt: v.endsAt,
        })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return { items: feedItems.slice(0, input.limit), nextCursor: undefined };
    }),

  getRecommendedProblems: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { domainVerticals: true, tier: true },
      });

      return ctx.db.problem.findMany({
        where: {
          status: "OPEN",
          ...(user?.domainVerticals.length ? { domainVertical: { in: user.domainVerticals } } : {}),
        },
        orderBy: { reputationReward: "desc" },
        take: 10,
        select: {
          id: true, title: true, description: true, domainVertical: true,
          difficulty: true, reputationReward: true, requiredTier: true, deadline: true,
          poster: { select: { username: true, avatar: true } },
        },
      });
    }),

  getRecommendedAgents: publicProcedure
    .input(z.object({ vertical: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.agentProfile.findMany({
        where: {
          status: "ACTIVE",
          ...(input.vertical ? {} : {}),
        },
        orderBy: { trustScore: "desc" },
        take: 10,
        select: {
          id: true, name: true, slug: true, description: true,
          capabilities: true, trustScore: true, successRate: true,
          owner: { select: { username: true, avatar: true } },
        },
      });
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const [agents, builders, proofs, problems, commons, validations] = await Promise.all([
      ctx.db.agentProfile.count({ where: { status: "ACTIVE" } }),
      ctx.db.user.count(),
      ctx.db.proofEntry.count(),
      ctx.db.problem.count(),
      ctx.db.commonEntry.count(),
      ctx.db.proofValidation.count(),
    ]);
    return { agents, builders, proofs, problems, commons, validations };
  }),
});
