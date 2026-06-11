# TREVO — Production Build Prompt

## 

\---

## PRIME DIRECTIVE

Build **TREVO** — a production-grade, market-ready community platform that serves as the trust infrastructure for the agentic era. *Trust. Evolved.*

This is NOT an MVP. Every feature shipped must be complete, polished, and production-hardened. No placeholder UI. No stub APIs. No TODO comments. No half-built pages.

**Code discipline:** No inline comments unless absolutely non-obvious. No docstrings unless public SDK. Clean self-documenting naming over explanatory noise. Every token in code must earn its place. 



CRITICAL: Do not use subagents: build it yourself.

\---

## WHAT YOU ARE BUILDING

TREVO is a community-governed ecosystem where human builders and AI agents earn verifiable trust through proof of real work. Trust compounds publicly, permanently, and without gatekeepers.

**The founding truth:**

> Builders solve real problems but stay invisible. Agents have capability but no verifiable identity. Enterprises won't adopt what they can't prove. TREVO fixes all three.

**Core loop:**

```
Problem posted → Agent/Builder picks it up → Solves it
→ Logged in Proof Archive → Community validates
→ Reputation compounds in Registry → Economy rewards flow
→ Commons gets smarter → Next problem solved faster
```

**Tagline:** *"Don't just build. Be proven."*

\---

## TECH STACK — NON-NEGOTIABLE

```
Frontend:      Next.js 14 (App Router), TypeScript strict, Tailwind CSS
UI Components: shadcn/ui (heavily customized), Radix primitives
Animation:     Framer Motion
Backend:       Next.js API Routes + tRPC for type-safe APIs
Database:      PostgreSQL via Prisma ORM
Cache/Queue:   Redis (Upstash) for sessions, queues, rate limiting
Auth:          Better Auth (email, GitHub OAuth)
AI Layer:      Anthropic Claude claude-sonnet-4-20250514 via official SDK
Search:        Meilisearch
Storage:       Cloudflare R2 (file uploads, proof artifacts)
Email:         Resend
Monitoring:    OpenTelemetry + Sentry
Deployment:    Dockerized, Railway or Render ready
Testing:       Vitest + Playwright
```

\---

## REPOSITORY STRUCTURE

```
trevo/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (auth)/               # Login, register, onboarding
│       │   ├── (dashboard)/          # Authenticated app shell
│       │   │   ├── registry/         # Agent \\\\\\\\\\\\\\\& builder profiles
│       │   │   ├── archive/          # Proof archive browser
│       │   │   ├── commons/          # Shared knowledge layer
│       │   │   ├── problems/         # Problem economy / bounties
│       │   │   ├── council/          # Micro-governance votes
│       │   │   ├── discover/         # Discovery engine
│       │   │   └── verticals/        # Domain verticals
│       │   ├── api/
│       │   │   └── trpc/
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/                   # shadcn base (customized)
│       │   ├── registry/
│       │   ├── archive/
│       │   ├── commons/
│       │   ├── problems/
│       │   ├── agents/
│       │   └── shared/
│       └── lib/
│           ├── agents/               # Agent orchestration layer
│           ├── trust/                # Trust scoring engine
│           ├── anti-gaming/          # Sybil \\\\\\\\\\\\\\\& manipulation detection
│           └── context-protocol/     # Cross-session context persistence
├── packages/
│   ├── db/                           # Prisma schema + migrations
│   ├── agents/                       # Shared agent definitions
│   └── types/                        # Shared TypeScript types
├── infra/
│   ├── docker-compose.yml
│   └── Dockerfile
└── scripts/
    └── seed.ts
```

\---

## DATABASE SCHEMA (Prisma)

Build all models with full relations, indexes, and constraints:

```prisma
// Identity
User              { id, email, username, role: BUILDER|VALIDATOR|COUNCIL,
                    tier: SEED|PROVEN|TRUSTED|SOVEREIGN,
                    trustScore, reputationPoints, domainVerticals\\\\\\\\\\\\\\\[],
                    createdAt, verified, githubId, avatar }

AgentProfile      { id, ownerId→User, name, slug, description,
                    capabilities: Json, ioContract: Json,
                    version, forkOf→AgentProfile, forks\\\\\\\\\\\\\\\[],
                    trustScore, totalProofs, successRate,
                    status: ACTIVE|DEPRECATED|FLAGGED }

// Proof System
ProofEntry        { id, agentId→AgentProfile?, builderId→User?,
                    problemId→Problem?, type: SUCCESS|FAILURE|PARTIAL,
                    title, summary, methodology: Json, outcome: Json,
                    evidence: Json, domainVertical,
                    validationStatus: PENDING|VALIDATED|DISPUTED|REJECTED,
                    validationCount, trustWeight,
                    createdAt, archivedAt }

ProofValidation   { id, proofId→ProofEntry, validatorId→User,
                    verdict: APPROVE|REJECT|DISPUTE,
                    reasoning, confidence: Float,
                    reputationStaked, createdAt }

// Commons
CommonEntry       { id, authorId→User?, agentId→AgentProfile?,
                    title, content: Text, domainVertical,
                    type: KNOWLEDGE|PATTERN|FAILURE\\\\\\\\\\\\\\\_LESSON|STANDARD,
                    citations\\\\\\\\\\\\\\\[], endorsements, qualityScore,
                    version, supersedes→CommonEntry? }

// Problem Economy
Problem           { id, posterId→User, title, description,
                    domainVertical, difficulty: SEED|ESTABLISHED|EXPERT,
                    status: OPEN|ACTIVE|VALIDATING|RESOLVED|DISPUTED,
                    reputationReward, monetaryReward?,
                    requiredTier, deadline?,
                    assignedTo→User?, assignedAgent→AgentProfile?,
                    proof→ProofEntry? }

// Anti-Gaming
TrustEvent        { id, actorId→User, targetId→User?,
                    type: VALIDATION|DISPUTE|ENDORSEMENT|FLAG,
                    weight, anomalyScore, reviewed }

ReputationLog     { id, userId→User, delta, reason, proofId?,
                    problemId?, snapshot, createdAt }

// Governance
GovernanceVote    { id, proposerId→User, title, description,
                    type: STANDARD|INTEROP|GUARDRAIL|VERTICAL,
                    status: ACTIVE|PASSED|REJECTED|WITHDRAWN,
                    threshold, endsAt,
                    votes: GovernanceBallot\\\\\\\\\\\\\\\[] }

GovernanceBallot  { id, voteId→GovernanceVote, voterId→User,
                    choice: YES|NO|ABSTAIN, weight, reasoning? }

// Context Protocol
AgentContext      { id, agentId→AgentProfile, sessionKey,
                    contextBlob: Json, ttl, updatedAt }
```

\---

## BACKEND — tRPC ROUTERS

Build fully implemented routers with Zod validation, auth middleware, and error handling:

**`registry.router`**

* `getAgent(slug)` — full profile with proof history
* `getBuilder(username)` — full profile with reputation timeline
* `listAgents({ vertical?, tier?, search?, cursor })` — paginated
* `registerAgent(input)` — validates I/O contract schema
* `forkAgent(agentId, modifications)` — creates fork with lineage
* `updateAgent(agentId, input)` — versioned update
* `deprecateAgent(agentId)` — soft deprecation with migration note
* `getLeaderboard({ vertical?, type: AGENT|BUILDER })` — trust-ranked

**`archive.router`**

* `submitProof(input)` — creates proof entry, triggers validation queue
* `getProof(id)` — full proof with validation thread
* `listProofs({ type?, vertical?, status?, cursor })` — paginated
* `validateProof(proofId, verdict, reasoning, confidence)` — stake reputation
* `disputeProof(proofId, evidence)` — opens dispute thread
* `resolveDispute(proofId, resolution)` — council-level action
* `getProofTimeline(agentId|builderId)` — chronological proof history

**`commons.router`**

* `submitEntry(input)` — create knowledge entry
* `searchCommons(query, vertical?)` — semantic search via Meilisearch
* `endorseEntry(entryId)` — stake reputation on quality
* `updateEntry(entryId, content)` — versioned update
* `getRelated(entryId)` — AI-powered related entries

**`problems.router`**

* `postProblem(input)` — create bounty
* `listProblems({ status?, vertical?, difficulty?, cursor })` — paginated
* `claimProblem(problemId)` — assign to self, locks for 72hrs
* `submitSolution(problemId, proofId)` — links proof to problem
* `validateSolution(problemId, verdict)` — community validation
* `releaseProblem(problemId)` — unclaim if stuck

**`trust.router`**

* `getScore(userId|agentId)` — full trust breakdown
* `getTimeline(userId|agentId)` — reputation over time
* `getAnomalies()` — council-only flagged gaming patterns

**`council.router`**

* `createVote(input)` — propose standard/change
* `castBallot(voteId, choice, reasoning?)` — weighted by tier
* `listVotes({ status? })` — active and resolved
* `getVote(voteId)` — full vote with ballot breakdown

**`discover.router`**

* `getFeed(userId)` — personalized activity feed
* `getRecommendedProblems(userId)` — matched to skills/vertical
* `getRecommendedAgents(context)` — capability matching
* `onboard(input)` — guided first-time setup with vertical selection

**`ai.router`**

* `assistValidation(proofId)` — AI assists human validator
* `suggestCommons(proofId)` — extract reusable knowledge from proof
* `detectAnomaly(userId, recentEvents\\\\\\\\\\\\\\\[])` — gaming detection
* `matchProblemToAgent(problemId)` — capability matching
* `synthesizeContext(agentId, sessionHistory\\\\\\\\\\\\\\\[])` — context compression

\---

## AGENT ORCHESTRATION LAYER

Build a production agent system at `lib/agents/`:

**`ValidationAgent`**
Analyzes proof submissions for completeness, consistency, and evidence quality. Returns structured assessment, confidence score, red flags. Never decides alone — surfaces findings for human judgment.

**`ContextAgent`**
Compresses session history into persistent context blobs. Retrieves relevant context for new sessions. TTL-managed and privacy-respecting.

**`MatchingAgent`**
Analyzes problem requirements against registry capabilities. Returns ranked agent/builder recommendations with reasoning.

**`AnomalyAgent`**
Monitors validation patterns, reputation flows, coordination signals. Flags suspicious clusters for council review. Never auto-penalizes — surfaces evidence only.

**`CommonsSynthesisAgent`**
Reads validated proofs, extracts reusable patterns. Proposes Commons entries for human approval. Prevents duplicate knowledge, suggests merges.

**`DiscoveryAgent`**
Analyzes user activity, domain focus, tier. Surfaces relevant problems, proofs, agents, commons entries.

**Agent Base Pattern:**

```typescript
// Input schema (Zod) → prompt construction → Claude API call
// → structured output parsing → validation → typed result returned
// All agents log to telemetry. All failures graceful with fallback.
// No agent has write access — recommendations only.
// Humans and tRPC layer execute all writes.
```

Each agent implements: strongly typed I/O, structured output prompting, retry with exponential backoff, token budget management, response validation, telemetry spans.

\---

## TRUST SCORING ENGINE

Build at `lib/trust/`:

```typescript
// TrustScore = weighted composite:
// ProofScore:        validated proofs × quality × recency decay
// ConsistencyScore:  success/failure ratio over rolling 90 days
// CommunityScore:    endorsements × validator reputation weight
// ContributionScore: commons entries quality × endorsements
// GovernanceScore:   participation in council votes
// LongevityMultiplier: account age + consistent activity

// Tiers:
// SEED:      0–99      — post problems, claim, submit proofs
// PROVEN:    100–499   — validate proofs, endorse commons, vote
// TRUSTED:   500–1999  — dispute resolution, vertical moderation
// SOVEREIGN: 2000+     — propose governance votes, weighted disputes

// Score recalculates on every ReputationLog event
// Cached in Redis, 60s TTL
// Full recalculation job runs nightly
```

\---

## ANTI-GAMING LAYER

Build at `lib/anti-gaming/`:

```typescript
// 1. Validation Ring Detection
//    A validates B, B validates C, C validates A
//    3+ mutual validations in 7 days → anomaly flag

// 2. Velocity Anomaly
//    Reputation gain rate vs historical baseline
//    Sudden spike >3σ from personal mean → review queue

// 3. Coordination Signal
//    Multiple new accounts validating same entity within 48hrs
//    Account age + activity correlation check

// 4. Proof Quality Drift
//    Validators who consistently approve low-quality proofs lose weight

// 5. Sybil Indicators
//    IP clustering, behavioral fingerprinting, GitHub account age check

// All detections → AnomalyReport → TrustEvent → council queue
// No automatic penalties. Evidence surfaced for human review only.
```

\---

## CONTEXT PROTOCOL

Build at `lib/context-protocol/`:

```typescript
// Context blob structure:
// {
//   agentId, version, lastUpdated,
//   coreCapabilities: string\\\\\\\\\\\\\\\[],
//   recentPatterns: string\\\\\\\\\\\\\\\[],
//   knownFailureModes: string\\\\\\\\\\\\\\\[],
//   domainContext: Record<vertical, summary>,
//   openProblems: { id, summary, status }\\\\\\\\\\\\\\\[],
//   collaborators: { id, trustLevel }\\\\\\\\\\\\\\\[]
// }

// Flow: session starts → load context blob → ContextAgent synthesizes delta
// → delta merged (max 8k tokens compressed) → stored PostgreSQL + Redis
// TTL: active agents 30 days, inactive 7 days
// Privacy: context blobs private to agent owner
// Shareable: owner can publish read-only snapshot to Registry
```

\---

## DOMAIN VERTICALS

Ten first-class verticals — not tags, full entities with dedicated commons, trust standards, moderators, leaderboards:

```
ENGINEERING     — software, infrastructure, system design
LEGAL           — contracts, compliance, regulatory
FINANCE         — analysis, modeling, reporting
HEALTHCARE      — clinical workflows, data, operations
HR\\\\\\\\\\\\\\\_HCM          — workforce management, talent, payroll
MARKETING       — content, growth, analytics
RESEARCH        — academic, market, technical
OPERATIONS      — logistics, process, supply chain
EDUCATION       — curriculum, tutoring, assessment
CREATIVE        — design, writing, media
```

\---

## FRONTEND DESIGN SYSTEM

**Aesthetic: Dark Editorial Brutalism**

Not corporate. Not startup-generic. Bloomberg Terminal meets high-end editorial magazine. Built for serious people who hate noise and need proof.

**Design Tokens:**

```
Background:    #0A0A0A
Surface:       #111111 / #1A1A1A
Border:        #2A2A2A
Primary Text:  #F0F0F0
Secondary:     #888888
Accent:        #E8FF00  ← electric yellow, proof/validation actions
Danger:        #FF3B30
Success:       #00FF87
Warning:       #FF9500

Typography:
  Display:     "Fraunces" (serif, authoritative, weighted)
  Heading:     "Syne" (geometric, modern)
  Body:        "DM Sans" (clean, readable)
  Mono:        "JetBrains Mono" (scores, IDs, code)

Motion:
  Page transitions:   200ms ease-out, subtle Y-axis slide
  Data reveals:       staggered fade-in, 40ms delays
  Proof validation:   pulse animation on pending state
  Trust score change: counter animation (react-countup)
  Hover states:       border brightness shift, no scale transforms

Spatial:
  Dense information design — no wasted whitespace
  Hard edges — border-radius max 4px
  1px borders over shadows everywhere
  Yellow accent bars as structural elements
  16px base spacing unit
  Grid-breaking accent elements on key pages
```

**Components to build (all production-complete):**

`TrustScoreBadge` — animated score with tier indicator
`ProofCard` — status, validation count, methodology preview
`AgentCard` — capability chips, fork lineage, trust score
`BuilderCard` — domain badges, tier, reputation delta
`ReputationTimeline` — D3 chart, score over time
`ValidationThread` — threaded discussion with verdict indicators
`ProblemCard` — difficulty, domain, reward, claim status
`CommonEntry` — knowledge card with endorsement count
`GovernanceVote` — progress bar, ballot status, days remaining
`DiscoveryFeed` — infinite scroll, mixed content types
`ContextViewer` — structured agent context blob display
`AnomalyAlert` — council-only flagged pattern card
`TierBadge` — SEED/PROVEN/TRUSTED/SOVEREIGN with visual weight
`DomainBadge` — vertical indicator with icon
`LeaderboardRow` — ranked entity with delta indicators
`ProofArchiveItem` — success/failure type with color coding
`ClaimTimer` — 72hr countdown on active problem claims
`ValidationStake` — reputation stake input with risk indicator

\---

## ALL PAGES (fully functional, no stubs)

```
/                           Landing — editorial hero, live stats, feed preview
/discover                   Personalized feed — mixed content types
/registry                   Agent + builder directory, search + filter
/registry/\\\\\\\\\\\\\\\[slug]            Agent profile — proofs, capabilities, forks, context
/builders/\\\\\\\\\\\\\\\[username]        Builder profile — timeline, domains, reputation
/archive                    Proof archive — filter by type/vertical/status
/archive/\\\\\\\\\\\\\\\[id]               Single proof — evidence, validation thread, methodology
/problems                   Problem board — open bounties, filters
/problems/\\\\\\\\\\\\\\\[id]              Problem detail — description, claims, linked proofs
/commons                    Knowledge commons — search, browse by vertical
/commons/\\\\\\\\\\\\\\\[id]               Single entry — content, citations, endorsements
/council                    Active votes + recent decisions
/council/\\\\\\\\\\\\\\\[id]               Vote detail — proposal, ballots, discussion
/verticals/\\\\\\\\\\\\\\\[slug]           Domain hub — leaderboard, problems, commons
/onboarding                 Guided setup — role, vertical, first action
/dashboard                  Personal — activity, reputation, open items
/settings                   Profile, notifications, API keys
```

\---

## AUTHENTICATION \& AUTHORIZATION

```typescript
// Better Auth:
// - Email/password with verification
// - GitHub OAuth (auto-populates builder profile)
// - 30 day rolling sessions, Redis-backed
// - API keys for agent-to-platform programmatic access

// Authorization tiers on every route:
// PUBLIC:    landing, registry/archive/commons (read)
// AUTHED:    submit proof, claim problem
// PROVEN+:   validate proofs, endorse commons, vote
// TRUSTED+:  dispute resolution, vertical moderation
// SOVEREIGN: governance proposals, anomaly review
```

\---

## PUBLIC REST API

```
GET  /api/v1/agents/:slug
GET  /api/v1/agents/:slug/context
GET  /api/v1/proofs/:id
POST /api/v1/proofs                    (API key auth)
GET  /api/v1/problems
GET  /api/v1/trust/:id
POST /api/v1/problems/:id/claim        (API key auth)
```

Rate limited by tier. API keys scoped to agent profiles.

\---

## REAL-TIME (SSE)

* Live validation count updates on proof pages
* Problem claim/release notifications
* Governance vote live tally
* Discovery feed new item indicator
* Trust score change notifications

\---

## SEARCH (Meilisearch)

```
agents\\\\\\\\\\\\\\\_index:    name, description, capabilities\\\\\\\\\\\\\\\[], vertical, tier, trustScore
builders\\\\\\\\\\\\\\\_index:  username, domains\\\\\\\\\\\\\\\[], tier, trustScore
proofs\\\\\\\\\\\\\\\_index:    title, summary, methodology, outcome, vertical, type, status
problems\\\\\\\\\\\\\\\_index:  title, description, vertical, difficulty, status, reward
commons\\\\\\\\\\\\\\\_index:   title, content, vertical, type, qualityScore
```

All indexed on write via BullMQ background jobs.

\---

## PERFORMANCE REQUIREMENTS

* Core Web Vitals: LCP < 1.2s, FID < 50ms, CLS < 0.05
* API P95: < 200ms cached, < 800ms uncached
* Cursor-based pagination, max 20 items per page
* Next.js Image component, R2-hosted, WebP
* No page > 150kb JS (code split by route)
* Redis cache: trust scores, leaderboards, feeds (60s TTL)
* DB indexes on every FK and filtered query

\---

## DOCKER

```yaml
services:
  web:          Next.js app
  postgres:     PostgreSQL 16
  redis:        Redis 7
  meilisearch:  Latest stable
```

Single `docker-compose up` starts everything. Health checks on all services.

\---

## ENVIRONMENT VARIABLES

```
DATABASE\\\\\\\\\\\\\\\_URL
REDIS\\\\\\\\\\\\\\\_URL
MEILISEARCH\\\\\\\\\\\\\\\_HOST
MEILISEARCH\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\_KEY
ANTHROPIC\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\_KEY
BETTER\\\\\\\\\\\\\\\_AUTH\\\\\\\\\\\\\\\_SECRET
BETTER\\\\\\\\\\\\\\\_AUTH\\\\\\\\\\\\\\\_URL
GITHUB\\\\\\\\\\\\\\\_CLIENT\\\\\\\\\\\\\\\_ID
GITHUB\\\\\\\\\\\\\\\_CLIENT\\\\\\\\\\\\\\\_SECRET
CLOUDFLARE\\\\\\\\\\\\\\\_R2\\\\\\\\\\\\\\\_BUCKET
CLOUDFLARE\\\\\\\\\\\\\\\_R2\\\\\\\\\\\\\\\_ENDPOINT
CLOUDFLARE\\\\\\\\\\\\\\\_R2\\\\\\\\\\\\\\\_ACCESS\\\\\\\\\\\\\\\_KEY
CLOUDFLARE\\\\\\\\\\\\\\\_R2\\\\\\\\\\\\\\\_SECRET\\\\\\\\\\\\\\\_KEY
RESEND\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\_KEY
SENTRY\\\\\\\\\\\\\\\_DSN
NEXT\\\\\\\\\\\\\\\_PUBLIC\\\\\\\\\\\\\\\_APP\\\\\\\\\\\\\\\_URL
```

\---

## SEED DATA

`scripts/seed.ts` creates:

* 10 domain verticals
* 10 agent profiles across verticals
* 20 builders with varied tiers and reputations
* 30 proof entries (mix of SUCCESS/FAILURE/PARTIAL)
* 15 validated proofs with full validation threads
* 10 open problems across difficulties and domains
* 20 commons entries
* 3 active governance votes
* Realistic trust scores and reputation logs

\---

## PRODUCTION CHECKLIST (build all)

* \[ ] Input sanitization on all user-submitted content
* \[ ] CSRF protection on all mutations
* \[ ] Rate limiting per-user per-route in Redis
* \[ ] SQL injection prevention via Prisma parameterized queries
* \[ ] XSS prevention + DOMPurify on rich text
* \[ ] Content Security Policy headers
* \[ ] API key hashing (bcrypt, never stored plain)
* \[ ] Audit log for all reputation-affecting actions
* \[ ] Graceful degradation when AI agents fail
* \[ ] Database connection pooling (PgBouncer ready)
* \[ ] Structured JSON logging with OpenTelemetry
* \[ ] Error boundaries on all page sections
* \[ ] Loading skeletons for every data-fetched component
* \[ ] Empty states for every list view
* \[ ] 404 and 500 pages styled to design system

\---

## EXECUTION ORDER

```
1.  Monorepo setup + Docker environment
2.  Database schema + migrations + seed
3.  Auth system (Better Auth)
4.  tRPC setup + base middleware
5.  Trust scoring engine + anti-gaming (pure logic)
6.  Registry router + pages
7.  Archive (proof) router + pages
8.  Agent orchestration layer
9.  Commons router + pages
10. Problems router + pages
11. Council router + pages
12. Context protocol
13. AI routers
14. Discovery engine + feed
15. Real-time SSE
16. Meilisearch integration
17. Public REST API
18. Design system components
19. Landing page
20. Polish: animations, empty states, error states, skeletons
21. Performance audit + optimization
22. Docker production build verification
```

\---

## BRANDING IN CODE

```typescript
// App name:    TREVO
// Tagline:     "Don't just build. Be proven."
// Domain:      trevo.ai (use as NEXT\\\\\\\\\\\\\\\_PUBLIC\\\\\\\\\\\\\\\_APP\\\\\\\\\\\\\\\_URL)
// Brand color: #E8FF00 (electric yellow — the proof accent)
// Dark base:   #0A0A0A
```

\---

## FINAL INSTRUCTION

This is TREVO. A production system for the agentic era's trust infrastructure.

Ship every feature complete or don't ship it. No TODOs. No stubs. No placeholder text. No default shadcn components without TREVO customization. Every page fully functional and visually cohesive from day one.

The codebase reads like one opinionated senior engineer wrote it — consistent patterns, clean abstractions, zero redundancy, zero noise.

*Trust. Evolved.*

