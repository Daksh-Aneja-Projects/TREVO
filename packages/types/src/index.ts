export type UserRole = "BUILDER" | "VALIDATOR" | "COUNCIL";
export type UserTier = "SEED" | "PROVEN" | "TRUSTED" | "SOVEREIGN";
export type AgentStatus = "ACTIVE" | "DEPRECATED" | "FLAGGED";
export type ProofType = "SUCCESS" | "FAILURE" | "PARTIAL";
export type ValidationStatus = "PENDING" | "VALIDATED" | "DISPUTED" | "REJECTED";
export type ValidationVerdict = "APPROVE" | "REJECT" | "DISPUTE";
export type ProblemDifficulty = "SEED" | "ESTABLISHED" | "EXPERT";
export type ProblemStatus = "OPEN" | "ACTIVE" | "VALIDATING" | "RESOLVED" | "DISPUTED";
export type CommonEntryType = "KNOWLEDGE" | "PATTERN" | "FAILURE_LESSON" | "STANDARD";
export type GovernanceVoteType = "STANDARD" | "INTEROP" | "GUARDRAIL" | "VERTICAL";
export type GovernanceVoteStatus = "ACTIVE" | "PASSED" | "REJECTED" | "WITHDRAWN";
export type BallotChoice = "YES" | "NO" | "ABSTAIN";
export type TrustEventType = "VALIDATION" | "DISPUTE" | "ENDORSEMENT" | "FLAG";

export type DomainVertical =
  | "engineering"
  | "legal"
  | "finance"
  | "healthcare"
  | "hr-hcm"
  | "marketing"
  | "research"
  | "operations"
  | "education"
  | "creative";

export interface VerticalDefinition {
  slug: DomainVertical;
  label: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  tier: UserTier;
  trustScore: number;
  reputationPoints: number;
  domainVerticals: DomainVertical[];
  bio: string | null;
  avatar: string | null;
  githubId: string | null;
  verified: boolean;
  createdAt: Date;
}

export interface AgentProfile {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  capabilities: string[];
  ioContract: AgentIOContract | null;
  version: number;
  trustScore: number;
  totalProofs: number;
  successRate: number;
  status: AgentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentIOContract {
  inputs?: { name: string; type: string; required?: boolean }[];
  outputs?: { name: string; type: string }[];
}

export interface ProofEntry {
  id: string;
  type: ProofType;
  title: string;
  summary: string;
  methodology: ProofMethodology;
  outcome: ProofOutcome;
  evidence: ProofEvidence;
  domainVertical: string;
  validationStatus: ValidationStatus;
  validationCount: number;
  trustWeight: number;
  builderId: string | null;
  agentId: string | null;
  problemId: string | null;
  createdAt: Date;
}

export interface ProofMethodology {
  approach?: string;
  tools?: string[];
  steps?: string[];
}

export interface ProofOutcome {
  result?: string;
  metrics?: Record<string, unknown>;
  artifacts?: string[];
}

export interface ProofEvidence {
  links?: string[];
  screenshots?: string[];
  logs?: string;
}

export interface ProofValidation {
  id: string;
  proofId: string;
  validatorId: string;
  verdict: ValidationVerdict;
  reasoning: string;
  confidence: number;
  reputationStaked: number;
  createdAt: Date;
}

export interface Problem {
  id: string;
  posterId: string;
  title: string;
  description: string;
  domainVertical: string;
  difficulty: ProblemDifficulty;
  status: ProblemStatus;
  reputationReward: number;
  monetaryReward: number | null;
  requiredTier: UserTier | null;
  deadline: Date | null;
  assignedToId: string | null;
  claimedAt: Date | null;
  createdAt: Date;
}

export interface CommonEntry {
  id: string;
  authorId: string | null;
  agentId: string | null;
  title: string;
  content: string;
  domainVertical: string;
  type: CommonEntryType;
  citations: string[];
  endorsements: number;
  qualityScore: number;
  version: number;
  supersedesId: string | null;
  createdAt: Date;
}

export interface GovernanceVote {
  id: string;
  proposerId: string;
  title: string;
  description: string;
  type: GovernanceVoteType;
  status: GovernanceVoteStatus;
  threshold: number;
  endsAt: Date;
  createdAt: Date;
}

export interface GovernanceBallot {
  id: string;
  voteId: string;
  voterId: string;
  choice: BallotChoice;
  weight: number;
  reasoning: string | null;
  createdAt: Date;
}

export interface TrustEvent {
  id: string;
  actorId: string;
  targetId: string | null;
  type: TrustEventType;
  weight: number;
  anomalyScore: number;
  reviewed: boolean;
  createdAt: Date;
}

export interface ReputationLog {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  proofId: string | null;
  problemId: string | null;
  snapshot: number;
  createdAt: Date;
}

export interface AgentContext {
  agentId: string;
  version: number;
  lastUpdated: string;
  coreCapabilities: string[];
  recentPatterns: string[];
  knownFailureModes: string[];
  domainContext: Record<string, string>;
  openProblems: { id: string; summary: string; status: string }[];
  collaborators: { id: string; trustLevel: number }[];
}

export interface TrustScoreBreakdown {
  proofScore: number;
  consistencyScore: number;
  communityScore: number;
  contributionScore: number;
  governanceScore: number;
  longevityMultiplier: number;
  total: number;
}

export interface AnomalyReport {
  type: "VALIDATION_RING" | "VELOCITY_ANOMALY" | "COORDINATION_SIGNAL" | "QUALITY_DRIFT" | "SYBIL_INDICATOR";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actors: string[];
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: Date;
}

export interface AIValidationResult {
  completeness: number;
  consistency: number;
  evidenceQuality: number;
  summary: string;
  redFlags: string[];
  suggestedVerdict: ValidationVerdict;
  confidence: number;
}

export interface AIAgentMatch {
  agentId: string;
  agentName: string;
  score: number;
  reasoning: string;
}

export const TIER_THRESHOLDS: Record<UserTier, { min: number; max: number }> = {
  SEED: { min: 0, max: 99 },
  PROVEN: { min: 100, max: 499 },
  TRUSTED: { min: 500, max: 1999 },
  SOVEREIGN: { min: 2000, max: Infinity },
};

export const TIER_ORDER: UserTier[] = ["SEED", "PROVEN", "TRUSTED", "SOVEREIGN"];

export function tierFromScore(score: number): UserTier {
  if (score >= 2000) return "SOVEREIGN";
  if (score >= 500) return "TRUSTED";
  if (score >= 100) return "PROVEN";
  return "SEED";
}

export function canPerformAction(tier: UserTier, requiredTier: UserTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(requiredTier);
}
