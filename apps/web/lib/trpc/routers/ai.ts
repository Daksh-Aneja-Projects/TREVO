import { z } from "zod";
import { router, authedProcedure, tierGate } from "../trpc";
import { callAgent } from "@/lib/ai";

export const aiRouter = router({
  assistValidation: authedProcedure
    .input(z.object({ proofId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const proof = await ctx.db.proofEntry.findUnique({
        where: { id: input.proofId },
        include: {
          validations: { select: { verdict: true, reasoning: true, confidence: true } },
        },
      });
      if (!proof) return null;

      return callAgent<{
        completeness: number;
        consistency: number;
        evidenceQuality: number;
        redFlags: string[];
        summary: string;
        confidence: number;
      }>(
        `You are a proof validation assistant for TREVO, a trust platform. Analyze proof submissions for completeness, consistency, and evidence quality. Return structured JSON with: completeness (0-1), consistency (0-1), evidenceQuality (0-1), redFlags (string[]), summary (string), confidence (0-1). Be thorough but fair. Never make final judgments—surface findings for human validators.`,
        `Analyze this proof submission:\n\nTitle: ${proof.title}\nType: ${proof.type}\nSummary: ${proof.summary}\nMethodology: ${JSON.stringify(proof.methodology)}\nOutcome: ${JSON.stringify(proof.outcome)}\nEvidence: ${JSON.stringify(proof.evidence)}\n\nExisting validations: ${JSON.stringify(proof.validations)}`
      );
    }),

  suggestCommons: authedProcedure
    .input(z.object({ proofId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const proof = await ctx.db.proofEntry.findUnique({
        where: { id: input.proofId },
        select: { title: true, summary: true, methodology: true, outcome: true, domainVertical: true },
      });
      if (!proof) return null;

      return callAgent<{
        suggestions: { title: string; content: string; type: string }[];
      }>(
        `You are a knowledge synthesis agent for TREVO. Extract reusable patterns, lessons, and knowledge from validated proofs. Return JSON with suggestions array, each having: title, content (detailed markdown), type (KNOWLEDGE|PATTERN|FAILURE_LESSON|STANDARD).`,
        `Extract reusable knowledge from this proof:\n\nTitle: ${proof.title}\nVertical: ${proof.domainVertical}\nSummary: ${proof.summary}\nMethodology: ${JSON.stringify(proof.methodology)}\nOutcome: ${JSON.stringify(proof.outcome)}`
      );
    }),

  detectAnomaly: tierGate("SOVEREIGN")
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const recentEvents = await ctx.db.trustEvent.findMany({
        where: { actorId: input.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const recentLogs = await ctx.db.reputationLog.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return callAgent<{
        riskLevel: string;
        patterns: string[];
        recommendation: string;
        confidence: number;
      }>(
        `You are an anti-gaming detection agent for TREVO. Analyze user activity for signs of manipulation, coordination, or gaming. Return JSON with: riskLevel (LOW|MEDIUM|HIGH|CRITICAL), patterns (string[]), recommendation (string), confidence (0-1). Never auto-penalize—surface evidence only.`,
        `Analyze this user's recent activity:\n\nTrust Events: ${JSON.stringify(recentEvents)}\nReputation Logs: ${JSON.stringify(recentLogs)}`
      );
    }),

  matchProblemToAgent: authedProcedure
    .input(z.object({ problemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.problem.findUnique({ where: { id: input.problemId } });
      if (!problem) return null;

      const agents = await ctx.db.agentProfile.findMany({
        where: { status: "ACTIVE" },
        orderBy: { trustScore: "desc" },
        take: 20,
        select: {
          id: true, name: true, slug: true, description: true,
          capabilities: true, trustScore: true, successRate: true,
        },
      });

      return callAgent<{
        rankings: { agentId: string; score: number; reasoning: string }[];
      }>(
        `You are a matching agent for TREVO. Match problems to the best-suited agents based on capabilities, trust scores, and track records. Return JSON with rankings array, each having: agentId, score (0-1), reasoning.`,
        `Match this problem to available agents:\n\nProblem: ${problem.title}\nDescription: ${problem.description}\nVertical: ${problem.domainVertical}\nDifficulty: ${problem.difficulty}\n\nAvailable agents: ${JSON.stringify(agents)}`
      );
    }),

  synthesizeContext: authedProcedure
    .input(z.object({
      agentId: z.string(),
      sessionHistory: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return callAgent<{
        coreCapabilities: string[];
        recentPatterns: string[];
        knownFailureModes: string[];
        domainContext: Record<string, string>;
        summary: string;
      }>(
        `You are a context synthesis agent for TREVO. Compress session history into a persistent context blob. Return JSON with: coreCapabilities, recentPatterns, knownFailureModes, domainContext (vertical→summary), summary. Max 8k tokens compressed.`,
        `Synthesize context from this session history:\n\n${input.sessionHistory.join("\n---\n")}`
      );
    }),
});
