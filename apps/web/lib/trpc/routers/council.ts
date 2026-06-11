import { z } from "zod";
import { router, publicProcedure, tierGate, rateLimit } from "../trpc";
import { TRPCError } from "@trpc/server";

export const councilRouter = router({
  createVote: tierGate("SOVEREIGN")
    .use(rateLimit(3, 86400))
    .input(z.object({
      title: z.string().min(5).max(200),
      description: z.string().min(20).max(10000),
      type: z.enum(["STANDARD", "INTEROP", "GUARDRAIL", "VERTICAL"]),
      threshold: z.number().min(0.5).max(1).default(0.5),
      durationDays: z.number().min(1).max(30).default(7),
    }))
    .mutation(async ({ ctx, input }) => {
      const endsAt = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
      return ctx.db.governanceVote.create({
        data: {
          proposerId: ctx.userId,
          title: input.title,
          description: input.description,
          type: input.type,
          threshold: input.threshold,
          endsAt,
        },
      });
    }),

  castBallot: tierGate("PROVEN")
    .use(rateLimit(50, 86400))
    .input(z.object({
      voteId: z.string(),
      choice: z.enum(["YES", "NO", "ABSTAIN"]),
      reasoning: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vote = await ctx.db.governanceVote.findUnique({ where: { id: input.voteId } });
      if (!vote) throw new TRPCError({ code: "NOT_FOUND" });
      if (vote.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Vote is not active" });
      }
      if (new Date() > vote.endsAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Vote has ended" });
      }

      const user = await ctx.db.user.findUnique({ where: { id: ctx.userId }, select: { tier: true } });
      const tierWeights = { SEED: 1, PROVEN: 2, TRUSTED: 4, SOVEREIGN: 8 };
      const weight = user ? tierWeights[user.tier] : 1;

      const ballot = await ctx.db.governanceBallot.upsert({
        where: { voteId_voterId: { voteId: input.voteId, voterId: ctx.userId } },
        create: {
          voteId: input.voteId,
          voterId: ctx.userId,
          choice: input.choice,
          weight,
          reasoning: input.reasoning,
        },
        update: {
          choice: input.choice,
          weight,
          reasoning: input.reasoning,
        },
      });

      const allBallots = await ctx.db.governanceBallot.findMany({
        where: { voteId: input.voteId },
      });

      const totalWeight = allBallots.reduce((s, b) => s + b.weight, 0);
      const yesWeight = allBallots.filter((b) => b.choice === "YES").reduce((s, b) => s + b.weight, 0);

      if (totalWeight >= 10 && new Date() >= vote.endsAt) {
        const passed = yesWeight / totalWeight >= vote.threshold;
        await ctx.db.governanceVote.update({
          where: { id: input.voteId },
          data: { status: passed ? "PASSED" : "REJECTED" },
        });
      }

      return ballot;
    }),

  listVotes: publicProcedure
    .input(z.object({
      status: z.enum(["ACTIVE", "PASSED", "REJECTED", "WITHDRAWN"]).optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(20).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;

      const votes = await ctx.db.governanceVote.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, description: true, type: true,
          status: true, threshold: true, endsAt: true, createdAt: true,
          proposer: { select: { username: true, avatar: true, tier: true } },
          _count: { select: { ballots: true } },
        },
      });

      let nextCursor: string | undefined;
      if (votes.length > input.limit) {
        const next = votes.pop();
        nextCursor = next?.id;
      }
      return { items: votes, nextCursor };
    }),

  getVote: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vote = await ctx.db.governanceVote.findUnique({
        where: { id: input.id },
        include: {
          proposer: { select: { id: true, username: true, avatar: true, tier: true } },
          ballots: {
            include: {
              voter: { select: { username: true, avatar: true, tier: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!vote) throw new TRPCError({ code: "NOT_FOUND" });

      const totalWeight = vote.ballots.reduce((s, b) => s + b.weight, 0);
      const yesWeight = vote.ballots.filter((b) => b.choice === "YES").reduce((s, b) => s + b.weight, 0);
      const noWeight = vote.ballots.filter((b) => b.choice === "NO").reduce((s, b) => s + b.weight, 0);

      return { ...vote, totalWeight, yesWeight, noWeight, yesPercentage: totalWeight > 0 ? yesWeight / totalWeight : 0 };
    }),
});
