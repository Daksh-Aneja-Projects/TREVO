import { z } from "zod";
import { router, publicProcedure, authedProcedure, rateLimit } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateTrustScore } from "@/lib/trust/scoring";

export const registryRouter = router({
  getAgent: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.db.agentProfile.findUnique({
        where: { slug: input.slug },
        include: {
          owner: { select: { id: true, username: true, avatar: true, tier: true } },
          forkOf: { select: { id: true, name: true, slug: true } },
          forks: { select: { id: true, name: true, slug: true, trustScore: true }, take: 10 },
          proofs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true, title: true, type: true, validationStatus: true,
              validationCount: true, domainVertical: true, createdAt: true,
            },
          },
          contexts: { where: { ttl: { gt: 0 } }, take: 1, orderBy: { updatedAt: "desc" } },
          _count: { select: { proofs: true, forks: true } },
        },
      });
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      return agent;
    }),

  getBuilder: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        select: {
          id: true, username: true, avatar: true, bio: true, role: true,
          tier: true, trustScore: true, reputationPoints: true,
          domainVerticals: true, verified: true, createdAt: true,
          _count: { select: { proofs: true, agents: true, commonEntries: true, validations: true } },
        },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Builder not found" });

      const reputationTimeline = await ctx.db.reputationLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { delta: true, reason: true, snapshot: true, createdAt: true },
        take: 100,
      });

      return { ...user, reputationTimeline };
    }),

  listAgents: publicProcedure
    .input(z.object({
      vertical: z.string().optional(),
      tier: z.enum(["SEED", "PROVEN", "TRUSTED", "SOVEREIGN"]).optional(),
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(20).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { status: "ACTIVE" };
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const agents = await ctx.db.agentProfile.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { trustScore: "desc" },
        select: {
          id: true, name: true, slug: true, description: true,
          capabilities: true, trustScore: true, totalProofs: true,
          successRate: true, status: true, version: true, createdAt: true,
          owner: { select: { username: true, avatar: true, tier: true } },
          _count: { select: { proofs: true, forks: true } },
        },
      });

      let nextCursor: string | undefined;
      if (agents.length > input.limit) {
        const next = agents.pop();
        nextCursor = next?.id;
      }

      return { items: agents, nextCursor };
    }),

  registerAgent: authedProcedure
    .use(rateLimit(5, 3600))
    .input(z.object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      description: z.string().min(10).max(2000),
      capabilities: z.array(z.string()),
      ioContract: z.object({
        inputs: z.array(z.object({ name: z.string(), type: z.string(), required: z.boolean() })),
        outputs: z.array(z.object({ name: z.string(), type: z.string() })),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.agentProfile.findUnique({ where: { slug: input.slug } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug already taken" });

      return ctx.db.agentProfile.create({
        data: {
          ownerId: ctx.userId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          capabilities: input.capabilities,
          ioContract: input.ioContract,
        },
      });
    }),

  forkAgent: authedProcedure
    .use(rateLimit(10, 3600))
    .input(z.object({
      agentId: z.string(),
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      modifications: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.db.agentProfile.findUnique({ where: { id: input.agentId } });
      if (!parent) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.agentProfile.create({
        data: {
          ownerId: ctx.userId,
          name: input.name,
          slug: input.slug,
          description: `Fork of ${parent.name}: ${input.modifications}`,
          capabilities: parent.capabilities as string[],
          ioContract: parent.ioContract as Record<string, unknown>,
          forkOfId: parent.id,
        },
      });
    }),

  updateAgent: authedProcedure
    .input(z.object({
      agentId: z.string(),
      name: z.string().min(2).max(100).optional(),
      description: z.string().min(10).max(2000).optional(),
      capabilities: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.db.agentProfile.findUnique({ where: { id: input.agentId } });
      if (!agent || agent.ownerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });
      }

      return ctx.db.agentProfile.update({
        where: { id: input.agentId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.capabilities && { capabilities: input.capabilities }),
          version: { increment: 1 },
        },
      });
    }),

  deprecateAgent: authedProcedure
    .input(z.object({ agentId: z.string(), migrationNote: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.db.agentProfile.findUnique({ where: { id: input.agentId } });
      if (!agent || agent.ownerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.agentProfile.update({
        where: { id: input.agentId },
        data: { status: "DEPRECATED" },
      });
    }),

  getLeaderboard: publicProcedure
    .input(z.object({
      vertical: z.string().optional(),
      type: z.enum(["AGENT", "BUILDER"]).default("AGENT"),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      if (input.type === "AGENT") {
        return ctx.db.agentProfile.findMany({
          where: { status: "ACTIVE" },
          orderBy: { trustScore: "desc" },
          take: input.limit,
          select: {
            id: true, name: true, slug: true, trustScore: true,
            totalProofs: true, successRate: true,
            owner: { select: { username: true, avatar: true } },
          },
        });
      }

      return ctx.db.user.findMany({
        orderBy: { trustScore: "desc" },
        take: input.limit,
        select: {
          id: true, username: true, avatar: true, tier: true,
          trustScore: true, reputationPoints: true, domainVerticals: true,
          _count: { select: { proofs: true, agents: true } },
        },
      });
    }),
});
