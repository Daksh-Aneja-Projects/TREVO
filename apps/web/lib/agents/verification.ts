import { callAgent } from "@/lib/ai";
import { db } from "@/lib/db";

interface AutoVerificationReport {
  passedChecks: string[];
  failedChecks: string[];
  warnings: string[];
  autoScore: number;
  recommendation: "PASS_TO_COMMUNITY" | "NEEDS_FIXES" | "REJECT";
  details: {
    urlValidation: { valid: boolean; issues: string[] };
    capabilityCoherence: { score: number; reasoning: string };
    duplicateDetection: { hasDuplicate: boolean; similarSlug?: string; similarity?: number };
    contactValidity: { valid: boolean; issues: string[] };
    descriptionQuality: { score: number; reasoning: string };
    repoAnalysis?: { exists: boolean; stars?: number; lastCommit?: string; readmeScore?: number };
  };
}

export async function runAutoVerificationAgent(listingId: string): Promise<AutoVerificationReport | null> {
  const listing = await db.agentListing.findUnique({
    where: { id: listingId },
    include: { owner: { select: { username: true, tier: true, createdAt: true } } },
  });
  if (!listing) return null;

  const existingListings = await db.agentListing.findMany({
    where: { listingStatus: "VERIFIED", id: { not: listingId } },
    take: 50,
    select: { name: true, slug: true, description: true, capabilities: true },
  });

  return callAgent<AutoVerificationReport>(
    `You are TREVO's AutoVerificationAgent — Layer 1 of the 3-layer verification pipeline. You perform fully automated checks on new listing submissions. Be rigorous but fair.

Score 0-100:
- <40 → REJECT with detailed reasons
- 40-74 → PASS_TO_COMMUNITY with warnings
- 75+ → PASS_TO_COMMUNITY clean

Check these dimensions:
1. URL validation: website, demo URLs resolve, no parked domains
2. Capability coherence: claimed capabilities consistent with description and use cases
3. Duplicate detection: compare against existing listings for near-duplicates
4. Contact validity: email format check
5. Description quality: sufficient detail, not placeholder text, real value proposition
6. Repo analysis (if URL provided): does it look like a real project`,
    `Verify this listing submission:

Name: ${listing.name}
Tagline: ${listing.tagline}
Description: ${listing.description}
Use Cases: ${JSON.stringify(listing.useCases)}
Capabilities: ${JSON.stringify(listing.capabilities)}
Integrations: ${JSON.stringify(listing.integrations)}
Verticals: ${JSON.stringify(listing.domainVerticals)}
Contact: ${listing.contactEmail}
Website: ${listing.websiteUrl || "none"}
Demo: ${listing.demoUrl || "none"}
Repo: ${listing.repoUrl || "none"}
Owner: ${listing.owner.username} (${listing.owner.tier}, joined ${listing.owner.createdAt.toISOString()})

Existing verified listings (check for duplicates):
${existingListings.map((l) => `- ${l.name} (/${l.slug}): ${l.description.slice(0, 100)}`).join("\n")}

Return JSON: { passedChecks: string[], failedChecks: string[], warnings: string[], autoScore: 0-100, recommendation: "PASS_TO_COMMUNITY"|"NEEDS_FIXES"|"REJECT", details: { urlValidation: { valid, issues[] }, capabilityCoherence: { score: 0-1, reasoning }, duplicateDetection: { hasDuplicate, similarSlug?, similarity? }, contactValidity: { valid, issues[] }, descriptionQuality: { score: 0-1, reasoning }, repoAnalysis?: { exists, stars?, lastCommit?, readmeScore? } } }`
  );
}

interface CommunityConsensus {
  approveWeight: number;
  rejectWeight: number;
  needsWorkWeight: number;
  totalVerdicts: number;
  consensusScore: number;
  recommendation: "PASS_TO_COUNCIL" | "RETURN_TO_BUILDER" | "ESCALATE";
  gamingFlags: string[];
  summaryBrief: string;
}

export async function runCommunityVerificationAgent(listingId: string): Promise<CommunityConsensus | null> {
  const listing = await db.agentListing.findUnique({
    where: { id: listingId },
    select: { name: true, autoVerificationReport: true, communityVerifyOpenedAt: true },
  });
  if (!listing) return null;

  const validations = await db.proofValidation.findMany({
    where: { proof: { agentId: listingId } },
    include: { validator: { select: { tier: true, trustScore: true, createdAt: true } } },
  });

  return callAgent<CommunityConsensus>(
    `You are TREVO's CommunityVerificationAgent — Layer 2 of verification. Aggregate community verdicts weighted by reviewer trust score. Check for gaming signals. Never write the final verdict.

Consensus thresholds:
- ≥0.70 APPROVE weighted → PASS_TO_COUNCIL
- ≤0.40 → RETURN_TO_BUILDER
- Between → ESCALATE with notes`,
    `Aggregate community verification for listing "${listing.name}":

Auto-verification report: ${JSON.stringify(listing.autoVerificationReport)}
Community review opened: ${listing.communityVerifyOpenedAt?.toISOString()}

Community verdicts (${validations.length}):
${validations.map((v) => `- ${v.verdict} (confidence: ${v.confidence}, validator trust: ${v.validator.trustScore}, tier: ${v.validator.tier}, account age: ${Math.round((Date.now() - v.validator.createdAt.getTime()) / 86400000)}d)`).join("\n")}

Return JSON: { approveWeight, rejectWeight, needsWorkWeight, totalVerdicts, consensusScore: 0-1, recommendation: "PASS_TO_COUNCIL"|"RETURN_TO_BUILDER"|"ESCALATE", gamingFlags: string[], summaryBrief: string }`
  );
}

interface CouncilReviewPackage {
  listingSummary: string;
  autoVerificationHighlights: string[];
  communityConsensusNote: string;
  concerns: string[];
  recommendation: "APPROVE" | "REJECT" | "REQUEST_CHANGES";
  reasoning: string;
}

export async function runCouncilReviewAgent(listingId: string): Promise<CouncilReviewPackage | null> {
  const listing = await db.agentListing.findUnique({
    where: { id: listingId },
    include: {
      owner: { select: { username: true, tier: true, trustScore: true } },
      assets: true,
    },
  });
  if (!listing) return null;

  return callAgent<CouncilReviewPackage>(
    `You are TREVO's Council Review Agent — Layer 3 (final). Prepare a consolidated review package for SOVEREIGN-tier council members. Surface all evidence, never decide alone. Present facts clearly.`,
    `Prepare council review package for listing "${listing.name}":

Full listing:
${JSON.stringify({ name: listing.name, tagline: listing.tagline, description: listing.description, useCases: listing.useCases, capabilities: listing.capabilities, verticals: listing.domainVerticals, website: listing.websiteUrl, demo: listing.demoUrl, repo: listing.repoUrl })}

Owner: ${listing.owner.username} (${listing.owner.tier}, trust: ${listing.owner.trustScore})
Auto-verification: ${JSON.stringify(listing.autoVerificationReport)}
Community consensus: ${listing.communityConsensusScore}
Verification note: ${listing.verificationNote || "none"}

Return JSON: { listingSummary, autoVerificationHighlights: string[], communityConsensusNote, concerns: string[], recommendation: "APPROVE"|"REJECT"|"REQUEST_CHANGES", reasoning }`
  );
}

interface EnquiryScreening {
  isSpam: boolean;
  isInappropriate: boolean;
  flags: string[];
  confidence: number;
  draftAcknowledgement: string;
}

export async function runEnquiryRouterAgent(subject: string, body: string, senderUsername: string): Promise<EnquiryScreening> {
  return callAgent<EnquiryScreening>(
    `You are TREVO's enquiry screening agent. Screen enquiry messages for spam, inappropriate content, or abuse. Be lenient — genuine business enquiries should always pass. Only flag clear spam, harassment, or illegal content. Draft a polite auto-acknowledgement.`,
    `Screen this enquiry:
From: ${senderUsername}
Subject: ${subject}
Body: ${body}

Return JSON: { isSpam: boolean, isInappropriate: boolean, flags: string[], confidence: 0-1, draftAcknowledgement: string }`
  );
}
