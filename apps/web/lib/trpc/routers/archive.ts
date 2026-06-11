import { z } from "zod";
import { router, publicProcedure, authedProcedure, tierGate, rateLimit } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logReputationEvent } from "@/lib/trust/scoring";

export const archiveRouter = router({
  getMyProofs: authedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.proofEntry.findMany({
        where: { builderId: ctx.userId },
        take: input.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, type: true, validationStatus: true,
          domainVertical: true, createdAt: true, validationCount: true,
        },
      });
    }),

  getPendingValidations: authedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.proofEntry.findMany({
        where: {
          validationStatus: "PENDING",
          builderId: { not: ctx.userId },
          validations: { none: { validatorId: ctx.userId } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, type: true, domainVertical: true,
          createdAt: true, validationCount: true,
        },
      });
    }),

  submitProof: authedProcedure
    .use(rateLimit(10, 3600))
    .input(z.object({
      agentId: z.string().optional(),
      problemId: z.string().optional(),
      type: z.enum(["SUCCESS", "FAILURE", "PARTIAL"]),
      title: z.string().min(5).max(200),
      summary: z.string().min(20).max(5000),
      methodology: z.object({
        approach: z.string(),
        tools: z.array(z.string()),
        steps: z.array(z.string()),
      }),
      outcome: z.object({
        result: z.string(),
        metrics: z.record(z.string(), z.unknown()).optional(),
        artifacts: z.array(z.string()).optional(),
      }),
      evidence: z.object({
        links: z.array(z.string()).optional(),
        screenshots: z.array(z.string()).optional(),
        logs: z.string().optional(),
      }),
      domainVertical: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.agentId) {
        const agent = await ctx.db.agentProfile.findUnique({ where: { id: input.agentId } });
        if (!agent || agent.ownerId !== ctx.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });
        }
      }

      const proof = await ctx.db.proofEntry.create({
        data: {
          builderId: ctx.userId,
          agentId: input.agentId,
          problemId: input.problemId,
          type: input.type,
          title: input.title,
          summary: input.summary,
          methodology: input.methodology,
          outcome: input.outcome,
          evidence: input.evidence,
          domainVertical: input.domainVertical,
        },
      });

      if (input.agentId) {
        await ctx.db.agentProfile.update({
          where: { id: input.agentId },
          data: { totalProofs: { increment: 1 } },
        });
      }

      await logReputationEvent(ctx.userId, 5, "Proof submitted", proof.id);
      return proof;
    }),

  getProof: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const proof = await ctx.db.proofEntry.findUnique({
        where: { id: input.id },
        include: {
          agent: { select: { id: true, name: true, slug: true, trustScore: true } },
          builder: { select: { id: true, username: true, avatar: true, tier: true } },
          problem: { select: { id: true, title: true, status: true } },
          validations: {
            include: {
              validator: { select: { id: true, username: true, avatar: true, tier: true, trustScore: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!proof) throw new TRPCError({ code: "NOT_FOUND" });
      return proof;
    }),

  listProofs: publicProcedure
    .input(z.object({
      type: z.enum(["SUCCESS", "FAILURE", "PARTIAL"]).optional(),
      vertical: z.string().optional(),
      status: z.enum(["PENDING", "VALIDATED", "DISPUTED", "REJECTED"]).optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(20).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.type) where.type = input.type;
      if (input.vertical) where.domainVertical = input.vertical;
      if (input.status) where.validationStatus = input.status;

      const proofs = await ctx.db.proofEntry.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, summary: true, type: true, domainVertical: true,
          validationStatus: true, validationCount: true, createdAt: true,
          agent: { select: { name: true, slug: true } },
          builder: { select: { username: true, avatar: true } },
        },
      });

      let nextCursor: string | undefined;
      if (proofs.length > input.limit) {
        const next = proofs.pop();
        nextCursor = next?.id;
      }

      return { items: proofs, nextCursor };
    }),

  validateProof: tierGate("PROVEN")
    .use(rateLimit(20, 3600))
    .input(z.object({
      proofId: z.string(),
      verdict: z.enum(["APPROVE", "REJECT", "DISPUTE"]),
      reasoning: z.string().min(20).max(2000),
      confidence: z.number().min(0).max(1),
      reputationStaked: z.number().min(0).max(100).default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const proof = await ctx.db.proofEntry.findUnique({ where: { id: input.proofId } });
      if (!proof) throw new TRPCError({ code: "NOT_FOUND" });

      const existingValidation = await ctx.db.proofValidation.findFirst({
        where: { proofId: input.proofId, validatorId: ctx.userId },
      });
      if (existingValidation) {
        throw new TRPCError({ code: "CONFLICT", message: "Already validated this proof" });
      }

      const validation = await ctx.db.proofValidation.create({
        data: {
          proofId: input.proofId,
          validatorId: ctx.userId,
          verdict: input.verdict,
          reasoning: input.reasoning,
          confidence: input.confidence,
          reputationStaked: input.reputationStaked,
        },
      });

      const validationCount = await ctx.db.proofValidation.count({
        where: { proofId: input.proofId },
      });

      const approvals = await ctx.db.proofValidation.count({
        where: { proofId: input.proofId, verdict: "APPROVE" },
      });

      let newStatus = proof.validationStatus;
      if (validationCount >= 3) {
        if (approvals / validationCount >= 0.67) newStatus = "VALIDATED";
        else if (input.verdict === "DISPUTE") newStatus = "DISPUTED";
        else if (approvals / validationCount < 0.33) newStatus = "REJECTED";
      }

      await ctx.db.proofEntry.update({
        where: { id: input.proofId },
        data: { validationCount, validationStatus: newStatus },
      });

      await ctx.db.trustEvent.create({
        data: {
          actorId: ctx.userId,
          targetId: proof.builderId || undefined,
          type: input.verdict === "DISPUTE" ? "DISPUTE" : "VALIDATION",
          weight: input.confidence,
        },
      });

      await logReputationEvent(ctx.userId, 3, "Validated a proof", input.proofId);

      if (newStatus === "VALIDATED" && proof.builderId) {
        await logReputationEvent(proof.builderId, 15, "Proof validated", proof.id);
      }

      return validation;
    }),

  disputeProof: tierGate("PROVEN")
    .input(z.object({
      proofId: z.string(),
      evidence: z.string().min(20).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const proof = await ctx.db.proofEntry.findUnique({ where: { id: input.proofId } });
      if (!proof) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.proofEntry.update({
        where: { id: input.proofId },
        data: { validationStatus: "DISPUTED" },
      });

      return ctx.db.proofValidation.create({
        data: {
          proofId: input.proofId,
          validatorId: ctx.userId,
          verdict: "DISPUTE",
          reasoning: input.evidence,
          confidence: 0.8,
          reputationStaked: 20,
        },
      });
    }),

  resolveDispute: tierGate("TRUSTED")
    .input(z.object({
      proofId: z.string(),
      resolution: z.enum(["VALIDATED", "REJECTED"]),
      reasoning: z.string().min(20),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.proofEntry.update({
        where: { id: input.proofId },
        data: { validationStatus: input.resolution },
      });
    }),

  getProofTimeline: publicProcedure
    .input(z.object({
      agentId: z.string().optional(),
      builderId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.agentId) where.agentId = input.agentId;
      if (input.builderId) where.builderId = input.builderId;

      return ctx.db.proofEntry.findMany({
        where,
        orderBy: { createdAt: "asc" },
        select: {
          id: true, title: true, type: true, validationStatus: true,
          domainVertical: true, createdAt: true, validationCount: true,
        },
      });
    }),
});
