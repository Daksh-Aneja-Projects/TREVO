import { z } from "zod";
import { router, publicProcedure, authedProcedure, tierGate, rateLimit } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logReputationEvent } from "@/lib/trust/scoring";

export const commonsRouter = router({
  submitEntry: authedProcedure
    .use(rateLimit(10, 3600))
    .input(z.object({
      title: z.string().min(5).max(200),
      content: z.string().min(50).max(50000),
      domainVertical: z.string(),
      type: z.enum(["KNOWLEDGE", "PATTERN", "FAILURE_LESSON", "STANDARD"]),
      citations: z.array(z.string()).default([]),
      agentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.commonEntry.create({
        data: {
          authorId: ctx.userId,
          agentId: input.agentId,
          title: input.title,
          content: input.content,
          domainVertical: input.domainVertical,
          type: input.type,
          citations: input.citations,
        },
      });
      await logReputationEvent(ctx.userId, 8, "Commons entry submitted");
      return entry;
    }),

  searchCommons: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      vertical: z.string().optional(),
      type: z.enum(["KNOWLEDGE", "PATTERN", "FAILURE_LESSON", "STANDARD"]).optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(20).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        OR: [
          { title: { contains: input.query, mode: "insensitive" } },
          { content: { contains: input.query, mode: "insensitive" } },
        ],
      };
      if (input.vertical) where.domainVertical = input.vertical;
      if (input.type) where.type = input.type;

      const entries = await ctx.db.commonEntry.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { qualityScore: "desc" },
        select: {
          id: true, title: true, content: true, domainVertical: true,
          type: true, endorsements: true, qualityScore: true,
          version: true, createdAt: true,
          author: { select: { username: true, avatar: true, tier: true } },
        },
      });

      let nextCursor: string | undefined;
      if (entries.length > input.limit) {
        const next = entries.pop();
        nextCursor = next?.id;
      }
      return { items: entries, nextCursor };
    }),

  getEntry: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.commonEntry.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, username: true, avatar: true, tier: true } },
          supersedes: { select: { id: true, title: true } },
          supersededBy: { select: { id: true, title: true } },
        },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      return entry;
    }),

  endorseEntry: tierGate("PROVEN")
    .use(rateLimit(20, 3600))
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.commonEntry.findUnique({ where: { id: input.entryId } });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.commonEntry.update({
        where: { id: input.entryId },
        data: {
          endorsements: { increment: 1 },
          qualityScore: { increment: 1.5 },
        },
      });

      await ctx.db.trustEvent.create({
        data: {
          actorId: ctx.userId,
          targetId: entry.authorId || undefined,
          type: "ENDORSEMENT",
          weight: 1,
        },
      });

      if (entry.authorId) {
        await logReputationEvent(entry.authorId, 3, "Commons entry endorsed");
      }

      return updated;
    }),

  updateEntry: authedProcedure
    .input(z.object({
      entryId: z.string(),
      content: z.string().min(50).max(50000),
      title: z.string().min(5).max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.commonEntry.findUnique({ where: { id: input.entryId } });
      if (!entry || entry.authorId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.commonEntry.update({
        where: { id: input.entryId },
        data: {
          content: input.content,
          ...(input.title && { title: input.title }),
          version: { increment: 1 },
        },
      });
    }),
});
