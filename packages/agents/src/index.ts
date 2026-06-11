import type {
  AIValidationResult,
  AIAgentMatch,
  AnomalyReport,
  AgentContext,
  CommonEntryType,
} from "@trevo/types";

export interface AgentDefinition<TInput, TOutput> {
  name: string;
  description: string;
  systemPrompt: string;
  buildPrompt: (input: TInput) => string;
  maxTokens: number;
  temperature: number;
}

export interface ValidationAgentInput {
  title: string;
  type: string;
  domainVertical: string;
  summary: string;
  methodology: unknown;
  outcome: unknown;
  evidence: unknown;
  builder: { username: string; tier: string; trustScore: number } | null;
  agent: { name: string; trustScore: number; successRate: number } | null;
  existingValidations: { verdict: string; reasoning: string; confidence: number }[];
}

export const ValidationAgent: AgentDefinition<ValidationAgentInput, AIValidationResult> = {
  name: "ValidationAgent",
  description: "Analyzes proof submissions for completeness, consistency, and evidence quality. Returns structured assessment. Never decides alone.",
  systemPrompt: `You are TREVO's validation assistant. Analyze proof submissions for completeness, consistency, and evidence quality. Return structured JSON. Never make final judgments — surface findings for human validators. Be thorough, fair, and skeptical. Flag anything that seems fabricated or unsupported.`,
  maxTokens: 4096,
  temperature: 0.3,
  buildPrompt: (input) => `Analyze this proof submission:

Title: ${input.title}
Type: ${input.type}
Domain: ${input.domainVertical}
Summary: ${input.summary}
Methodology: ${JSON.stringify(input.methodology)}
Outcome: ${JSON.stringify(input.outcome)}
Evidence: ${JSON.stringify(input.evidence)}
Builder: ${input.builder?.username || "unknown"} (${input.builder?.tier || "SEED"}, trust: ${input.builder?.trustScore || 0})
Agent: ${input.agent?.name || "none"} (trust: ${input.agent?.trustScore || 0})
Existing validations (${input.existingValidations.length}): ${JSON.stringify(input.existingValidations.slice(0, 5))}

Return JSON: { completeness: 0-1, consistency: 0-1, evidenceQuality: 0-1, redFlags: string[], summary: string, suggestedVerdict: "APPROVE"|"REJECT"|"DISPUTE", confidence: 0-1 }`,
};

export interface MatchingAgentInput {
  problem: { title: string; description: string; domainVertical: string; difficulty: string };
  agents: { id: string; name: string; slug: string; description: string; capabilities: unknown; trustScore: number; successRate: number }[];
}

export const MatchingAgent: AgentDefinition<MatchingAgentInput, { rankings: AIAgentMatch[] }> = {
  name: "MatchingAgent",
  description: "Analyzes problem requirements against registry capabilities. Returns ranked agent/builder recommendations with reasoning.",
  systemPrompt: `You are TREVO's matching agent. Match problems to the best-suited agents based on capabilities, trust scores, and domain fit. Return ranked recommendations with reasoning.`,
  maxTokens: 4096,
  temperature: 0.3,
  buildPrompt: (input) => `Match this problem to available agents:

Problem: ${input.problem.title}
Description: ${input.problem.description}
Vertical: ${input.problem.domainVertical}
Difficulty: ${input.problem.difficulty}

Available agents (${input.agents.length}):
${input.agents.map((a) => `- ${a.name} (/${a.slug}): ${a.description} | Trust: ${a.trustScore} | Success: ${Math.round(a.successRate * 100)}% | Caps: ${JSON.stringify(a.capabilities)}`).join("\n")}

Return JSON: { rankings: [{ agentId, agentName, score: 0-1, reasoning }] } (top 5 max)`,
};

export interface AnomalyAgentInput {
  events: unknown[];
  reputationLogs: unknown[];
  validations: unknown[];
}

export const AnomalyAgent: AgentDefinition<AnomalyAgentInput, AnomalyReport> = {
  name: "AnomalyAgent",
  description: "Monitors validation patterns, reputation flows, coordination signals. Flags suspicious clusters for council review. Never auto-penalizes.",
  systemPrompt: `You are TREVO's anomaly detection agent. Analyze user activity for signs of manipulation, validation rings, velocity anomalies, or coordination. Never auto-penalize — surface evidence for human review only. Be precise about what patterns you detect.`,
  maxTokens: 4096,
  temperature: 0.2,
  buildPrompt: (input) => `Analyze this user's recent activity:

Trust Events (${input.events.length}): ${JSON.stringify((input.events as unknown[]).slice(0, 20))}
Reputation Log (${input.reputationLogs.length}): ${JSON.stringify((input.reputationLogs as unknown[]).slice(0, 20))}
Recent Validations (${input.validations.length}): ${JSON.stringify(input.validations)}

Return JSON: { type: "VALIDATION_RING"|"VELOCITY_ANOMALY"|"COORDINATION_SIGNAL"|"QUALITY_DRIFT"|"SYBIL_INDICATOR", severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", actors: string[], description: string, evidence: {}, detectedAt: ISO_string }`,
};

export interface CommonsSynthesisInput {
  proof: { title: string; type: string; domainVertical: string; summary: string; methodology: unknown; outcome: unknown };
  existingCommons: { title: string; type: string }[];
}

export const CommonsSynthesisAgent: AgentDefinition<CommonsSynthesisInput, { suggestions: { title: string; content: string; type: CommonEntryType }[] }> = {
  name: "CommonsSynthesisAgent",
  description: "Reads validated proofs, extracts reusable patterns. Proposes Commons entries for human approval. Prevents duplicate knowledge.",
  systemPrompt: `You are TREVO's knowledge synthesis agent. Extract reusable patterns, lessons, and knowledge from validated proofs. Avoid duplicating existing commons entries. Produce detailed, actionable content.`,
  maxTokens: 4096,
  temperature: 0.4,
  buildPrompt: (input) => `Extract reusable knowledge from this proof:

Title: ${input.proof.title}
Type: ${input.proof.type}
Vertical: ${input.proof.domainVertical}
Summary: ${input.proof.summary}
Methodology: ${JSON.stringify(input.proof.methodology)}
Outcome: ${JSON.stringify(input.proof.outcome)}

Existing commons in this vertical (avoid duplicates):
${input.existingCommons.map((c) => `- [${c.type}] ${c.title}`).join("\n")}

Return JSON: { suggestions: [{ title, content (detailed markdown), type: "KNOWLEDGE"|"PATTERN"|"FAILURE_LESSON"|"STANDARD" }] } (max 3)`,
};

export interface ContextAgentInput {
  agentId: string;
  sessionHistory: string[];
}

export const ContextAgent: AgentDefinition<ContextAgentInput, Omit<AgentContext, "agentId">> = {
  name: "ContextAgent",
  description: "Compresses session history into persistent context blobs. Retrieves relevant context for new sessions. TTL-managed and privacy-respecting.",
  systemPrompt: `You are TREVO's context synthesis agent. Compress session history into a persistent context blob. Extract capabilities, patterns, failure modes, and domain context. Max 8k tokens compressed. Be concise but comprehensive.`,
  maxTokens: 4096,
  temperature: 0.3,
  buildPrompt: (input) => `Synthesize context for agent ${input.agentId} from this session history:

${input.sessionHistory.slice(-10).join("\n---\n")}

Return JSON: { version: number, lastUpdated: ISO_string, coreCapabilities: string[], recentPatterns: string[], knownFailureModes: string[], domainContext: Record<vertical, summary>, openProblems: [], collaborators: [] }`,
};

export interface DiscoveryAgentInput {
  userId: string;
  tier: string;
  domainVerticals: string[];
  recentActivity: { type: string; domainVertical: string; createdAt: string }[];
  reputationScore: number;
}

export interface DiscoveryResult {
  recommendedProblems: { id: string; reasoning: string; matchScore: number }[];
  recommendedAgents: { id: string; reasoning: string; matchScore: number }[];
  recommendedCommons: { id: string; reasoning: string }[];
  feedPriority: string[];
}

export const DiscoveryAgent: AgentDefinition<DiscoveryAgentInput, DiscoveryResult> = {
  name: "DiscoveryAgent",
  description: "Analyzes user activity, domain focus, tier. Surfaces relevant problems, proofs, agents, commons entries.",
  systemPrompt: `You are TREVO's discovery agent. Analyze a user's profile, activity, domain expertise, and tier to surface the most relevant content. Prioritize problems they can solve, agents that complement their skills, and commons entries in their domains.`,
  maxTokens: 4096,
  temperature: 0.4,
  buildPrompt: (input) => `Generate personalized recommendations for this user:

User: ${input.userId}
Tier: ${input.tier}
Domains: ${input.domainVerticals.join(", ")}
Reputation: ${input.reputationScore}
Recent Activity (${input.recentActivity.length} events): ${JSON.stringify(input.recentActivity.slice(0, 10))}

Return JSON: { recommendedProblems: [{ id, reasoning, matchScore: 0-1 }], recommendedAgents: [{ id, reasoning, matchScore: 0-1 }], recommendedCommons: [{ id, reasoning }], feedPriority: string[] }`,
};

export const ALL_AGENTS = {
  validation: ValidationAgent,
  matching: MatchingAgent,
  anomaly: AnomalyAgent,
  commonsSynthesis: CommonsSynthesisAgent,
  context: ContextAgent,
  discovery: DiscoveryAgent,
} as const;
