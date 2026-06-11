import { z } from "zod";
import { router, publicProcedure, authedProcedure, rateLimit } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logReputationEvent } from "@/lib/trust/scoring";

export const problemsRouter = router({
  getMyClaims: authedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.problem.findMany({
        where: { assignedToId: ctx.userId, status: { in: ["ACTIVE", "VALIDATING"] } },
        orderBy: { claimedAt: "desc" },
        select: {
          id: true, title: true, domainVertical: true, difficulty: true,
          status: true, reputationReward: true, claimedAt: true,
        },
      });
    }),

  postProblem: authedProcedure
    .use(rateLimit(5, 3600))
    .input(z.object({
      title: z.string().min(5).max(200),
      description: z.string().min(20).max(10000),
      domainVertical: z.string(),
      difficulty: z.enum(["SEED", "ESTABLISHED", "EXPERT"]),
      reputationReward: z.number().min(5).max(500),
      monetaryReward: z.number().optional(),
      requiredTier: z.enum(["SEED", "PROVEN", "TRUSTED", "SOVEREIGN"]).default("SEED"),
      deadline: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.problem.create({
        data: {
          posterId: ctx.userId,
          title: input.title,
          description: input.description,
          domainVertical: input.domainVertical,
          difficulty: input.difficulty,
          reputationReward: input.reputationReward,
          monetaryReward: input.monetaryReward,
          requiredTier: input.requiredTier,
          deadline: input.deadline ? new Date(input.deadline) : undefined,
        },
      });
    }),

  listProblems: publicProcedure
    .input(z.object({
      status: z.enum(["OPEN", "ACTIVE", "VALIDATING", "RESOLVED", "DISPUTED"]).optional(),
      vertical: z.string().optional(),
      difficulty: z.enum(["SEED", "ESTABLISHED", "EXPERT"]).optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(20).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;
      if (input.vertical) where.domainVertical = input.vertical;
      if (input.difficulty) where.difficulty = input.difficulty;

      const problems = await ctx.db.problem.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, description: true, domainVertical: true,
          difficulty: true, status: true, reputationReward: true,
          monetaryReward: true, requiredTier: true, deadline: true,
          claimedAt: true, createdAt: true,
          poster: { select: { username: true, avatar: true, tier: true } },
          assignedTo: { select: { username: true, avatar: true } },
        },
      });

      let nextCursor: string | undefined;
      if (problems.length > input.limit) {
        const next = problems.pop();
        nextCursor = next?.id;
      }
      return { items: problems, nextCursor };
    }),

  getProblem: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const problem = await ctx.db.problem.findUnique({
        where: { id: input.id },
        include: {
          poster: { select: { id: true, username: true, avatar: true, tier: true } },
          assignedTo: { select: { id: true, username: true, avatar: true, tier: true } },
          assignedAgent: { select: { id: true, name: true, slug: true } },
          proof: {
            select: {
              id: true, title: true, type: true, validationStatus: true, validationCount: true,
            },
          },
        },
      });
      if (!problem) throw new TRPCError({ code: "NOT_FOUND" });
      return problem;
    }),

  claimProblem: authedProcedure
    .use(rateLimit(5, 3600))
    .input(z.object({
      problemId: z.string(),
      agentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.problem.findUnique({ where: { id: input.problemId } });
      if (!problem) throw new TRPCError({ code: "NOT_FOUND" });
      if (problem.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Problem is not open for claims" });
      }

      const user = await ctx.db.user.findUnique({ where: { id: ctx.userId }, select: { tier: true } });
      const tierOrder = { SEED: 0, PROVEN: 1, TRUSTED: 2, SOVEREIGN: 3 };
      if (user && tierOrder[user.tier] < tierOrder[problem.requiredTier]) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Requires ${problem.requiredTier} tier` });
      }

      return ctx.db.problem.update({
        where: { id: input.problemId },
        data: {
          status: "ACTIVE",
          assignedToId: ctx.userId,
          assignedAgentId: input.agentId,
          claimedAt: new Date(),
        },
      });
    }),

  submitSolution: authedProcedure
    .input(z.object({
      problemId: z.string(),
      proofId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.problem.findUnique({ where: { id: input.problemId } });
      if (!problem || problem.assignedToId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.problem.update({
        where: { id: input.problemId },
        data: { status: "VALIDATING" },
      });
    }),

  releaseProblem: authedProcedure
    .input(z.object({ problemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.problem.findUnique({ where: { id: input.problemId } });
      if (!problem) throw new TRPCError({ code: "NOT_FOUND" });
      if (problem.assignedToId !== ctx.userId && problem.posterId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.problem.update({
        where: { id: input.problemId },
        data: {
          status: "OPEN",
          assignedToId: null,
          assignedAgentId: null,
          claimedAt: null,
        },
      });
    }),
});
