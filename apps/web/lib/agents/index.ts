import { callAgent } from "@/lib/ai";
import { db } from "@/lib/db";

interface ValidationAssessment {
  completeness: number;
  consistency: number;
  evidenceQuality: number;
  redFlags: string[];
  summary: string;
  confidence: number;
}

export async function runValidationAgent(proofId: string): Promise<ValidationAssessment | null> {
  const proof = await db.proofEntry.findUnique({
    where: { id: proofId },
    include: {
      validations: { select: { verdict: true, reasoning: true, confidence: true } },
      builder: { select: { username: true, tier: true, trustScore: true } },
      agent: { select: { name: true, trustScore: true, successRate: true } },
    },
  });

  if (!proof) return null;

  return callAgent<ValidationAssessment>(
    `You are TREVO's validation assistant. Analyze proof submissions for completeness, consistency, and evidence quality. Return structured JSON. Never make final judgments — surface findings for human validators. Be thorough, fair, and skeptical. Flag anything that seems fabricated or unsupported.`,
    `Analyze this proof submission:

Title: ${proof.title}
Type: ${proof.type}
Domain: ${proof.domainVertical}
Summary: ${proof.summary}
Methodology: ${JSON.stringify(proof.methodology)}
Outcome: ${JSON.stringify(proof.outcome)}
Evidence: ${JSON.stringify(proof.evidence)}
Builder: ${proof.builder?.username} (${proof.builder?.tier}, trust: ${proof.builder?.trustScore})
Agent: ${proof.agent?.name || "none"} (trust: ${proof.agent?.trustScore || 0})
Existing validations (${proof.validations.length}): ${JSON.stringify(proof.validations.slice(0, 5))}

Return JSON: { completeness: 0-1, consistency: 0-1, evidenceQuality: 0-1, redFlags: string[], summary: string, confidence: 0-1 }`
  );
}

interface MatchResult {
  rankings: { agentId: string; agentName: string; score: number; reasoning: string }[];
}

export async function runMatchingAgent(problemId: string): Promise<MatchResult | null> {
  const problem = await db.problem.findUnique({ where: { id: problemId } });
  if (!problem) return null;

  const agents = await db.agentProfile.findMany({
    where: { status: "ACTIVE" },
    orderBy: { trustScore: "desc" },
    take: 20,
    select: { id: true, name: true, slug: true, description: true, capabilities: true, trustScore: true, successRate: true },
  });

  return callAgent<MatchResult>(
    `You are TREVO's matching agent. Match problems to the best-suited agents based on capabilities, trust scores, and domain fit. Return ranked recommendations with reasoning.`,
    `Match this problem to available agents:

Problem: ${problem.title}
Description: ${problem.description}
Vertical: ${problem.domainVertical}
Difficulty: ${problem.difficulty}

Available agents (${agents.length}):
${agents.map((a) => `- ${a.name} (/${a.slug}): ${a.description} | Trust: ${a.trustScore} | Success: ${Math.round(a.successRate * 100)}% | Caps: ${JSON.stringify(a.capabilities)}`).join("\n")}

Return JSON: { rankings: [{ agentId, agentName, score: 0-1, reasoning }] } (top 5 max)`
  );
}

interface AnomalyReport {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  patterns: string[];
  recommendation: string;
  confidence: number;
}

export async function runAnomalyAgent(userId: string): Promise<AnomalyReport | null> {
  const [events, logs, validations] = await Promise.all([
    db.trustEvent.findMany({ where: { actorId: userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.reputationLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.proofValidation.findMany({ where: { validatorId: userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return callAgent<AnomalyReport>(
    `You are TREVO's anomaly detection agent. Analyze user activity for signs of manipulation, validation rings, velocity anomalies, or coordination. Never auto-penalize — surface evidence for human review only. Be precise about what patterns you detect.`,
    `Analyze this user's recent activity:

Trust Events (${events.length}): ${JSON.stringify(events.slice(0, 20))}
Reputation Log (${logs.length}): ${JSON.stringify(logs.slice(0, 20))}
Recent Validations (${validations.length}): ${JSON.stringify(validations)}

Return JSON: { riskLevel: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", patterns: string[], recommendation: string, confidence: 0-1 }`
  );
}

interface CommonsSuggestion {
  suggestions: { title: string; content: string; type: "KNOWLEDGE" | "PATTERN" | "FAILURE_LESSON" | "STANDARD" }[];
}

export async function runCommonsSynthesisAgent(proofId: string): Promise<CommonsSuggestion | null> {
  const proof = await db.proofEntry.findUnique({
    where: { id: proofId },
    select: { title: true, summary: true, methodology: true, outcome: true, domainVertical: true, type: true },
  });

  if (!proof) return null;

  const existingCommons = await db.commonEntry.findMany({
    where: { domainVertical: proof.domainVertical },
    take: 10,
    select: { title: true, type: true },
  });

  return callAgent<CommonsSuggestion>(
    `You are TREVO's knowledge synthesis agent. Extract reusable patterns, lessons, and knowledge from validated proofs. Avoid duplicating existing commons entries. Produce detailed, actionable content.`,
    `Extract reusable knowledge from this proof:

Title: ${proof.title}
Type: ${proof.type}
Vertical: ${proof.domainVertical}
Summary: ${proof.summary}
Methodology: ${JSON.stringify(proof.methodology)}
Outcome: ${JSON.stringify(proof.outcome)}

Existing commons in this vertical (avoid duplicates):
${existingCommons.map((c) => `- [${c.type}] ${c.title}`).join("\n")}

Return JSON: { suggestions: [{ title, content (detailed markdown), type: "KNOWLEDGE"|"PATTERN"|"FAILURE_LESSON"|"STANDARD" }] } (max 3)`
  );
}

interface ContextSynthesis {
  coreCapabilities: string[];
  recentPatterns: string[];
  knownFailureModes: string[];
  domainContext: Record<string, string>;
  summary: string;
}

export async function runContextAgent(agentId: string, sessionHistory: string[]): Promise<ContextSynthesis | null> {
  return callAgent<ContextSynthesis>(
    `You are TREVO's context synthesis agent. Compress session history into a persistent context blob. Extract capabilities, patterns, failure modes, and domain context. Max 8k tokens compressed. Be concise but comprehensive.`,
    `Synthesize context for agent ${agentId} from this session history:

${sessionHistory.slice(-10).join("\n---\n")}

Return JSON: { coreCapabilities: string[], recentPatterns: string[], knownFailureModes: string[], domainContext: Record<vertical, summary>, summary: string }`
  );
}

interface DiscoveryResult {
  recommendedProblems: { id: string; reasoning: string; matchScore: number }[];
  recommendedAgents: { id: string; reasoning: string; matchScore: number }[];
  recommendedCommons: { id: string; reasoning: string }[];
  feedPriority: string[];
}

export async function runDiscoveryAgent(userId: string): Promise<DiscoveryResult | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true, domainVerticals: true, trustScore: true, reputationPoints: true },
  });

  if (!user) return null;

  const [recentProofs, recentValidations, openProblems] = await Promise.all([
    db.proofEntry.findMany({
      where: { builderId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { type: true, domainVertical: true, validationStatus: true, createdAt: true },
    }),
    db.proofValidation.findMany({
      where: { validatorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { verdict: true, createdAt: true },
    }),
    db.problem.findMany({
      where: { status: "OPEN" },
      take: 15,
      select: { id: true, title: true, domainVertical: true, difficulty: true, reputationReward: true },
    }),
  ]);

  return callAgent<DiscoveryResult>(
    `You are TREVO's discovery agent. Analyze a user's profile, activity, domain expertise, and tier to surface the most relevant content. Prioritize problems they can solve, agents that complement their skills, and commons entries in their domains. Return IDs from the provided data only.`,
    `Generate personalized recommendations:

User tier: ${user.tier}
Domains: ${JSON.stringify(user.domainVerticals)}
Trust score: ${user.trustScore}
Reputation: ${user.reputationPoints}

Recent proofs (${recentProofs.length}): ${JSON.stringify(recentProofs)}
Recent validations (${recentValidations.length}): ${JSON.stringify(recentValidations)}

Open problems (${openProblems.length}):
${openProblems.map((p) => `- ${p.id}: ${p.title} [${p.domainVertical}] ${p.difficulty} +${p.reputationReward}`).join("\n")}

Return JSON: { recommendedProblems: [{ id, reasoning, matchScore: 0-1 }], recommendedAgents: [{ id, reasoning, matchScore: 0-1 }], recommendedCommons: [{ id, reasoning }], feedPriority: string[] }`
  );
}
