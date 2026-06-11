# TREVO — Production Build Prompt v2
## For Claude Opus 4.6 via Claude Code

---

## PRIME DIRECTIVE

Build **TREVO** — a production-grade, market-ready community platform that serves as the trust infrastructure for the agentic era. *Trust. Evolved.*

TREVO operates as a **two-sided community ecosystem**:
- **Builders & Orgs** — publish, verify, and showcase their agents and solutions
- **Community** — discover, follow, and connect with builders and agents — free, no login required

These are not separate user types. The same person builds today and buys tomorrow. TREVO is fluid.

This is NOT an MVP. Every feature shipped must be complete, polished, and production-hardened. No placeholder UI. No stub APIs. No TODO comments. No half-built pages.

**Code discipline:** No inline comments unless absolutely non-obvious. No docstrings unless public SDK. Clean self-documenting naming over explanatory noise. Every token in code must earn its place.

---

## WHAT YOU ARE BUILDING

TREVO is a community-governed ecosystem where human builders and AI agents earn verifiable trust through proof of real work. Trust compounds publicly, permanently, and without gatekeepers.

**The founding truth:**
> Builders solve real problems but stay invisible. Agents have capability but no verifiable identity. Enterprises won't adopt what they can't prove. The community has no trusted place to discover what's real. TREVO fixes all four.

**Core loop:**
```
Builder publishes agent → TREVO verifies it → Listed publicly on TREVO
→ Community discovers it free → Interested user contacts builder directly
→ Problem posted → Agent/Builder picks it up → Solves it
→ Logged in Proof Archive → Community validates
→ Reputation compounds in Registry → Economy rewards flow
→ Commons gets smarter → Next problem solved faster
```

**Tagline:** *"Don't just build. Be proven."*

---

## THE TWO SURFACES

### Surface 1 — Public Community Feed (zero login, always free)

Anyone who lands on TREVO sees:
- Live AI industry news (auto-fetched, cached, continuously updated)
- Live global AI growth statistics (charts, real data, visual)
- Trending and newly verified agents and solutions
- Full browsable agent and builder registry (read-only)
- Proof archive highlights
- Domain vertical activity

**No account needed. No paywall. No friction.**

### Surface 2 — Authenticated Platform

Login unlocks:
- Publishing an agent listing (builder flow)
- Sending an enquiry or booking request to any builder
- Submitting proofs, claiming problems, validating, voting
- Personal dashboard, inbox, notification centre
- Reputation and trust score

**Same account. One login. Builder and buyer in one.**

---

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
Storage:       Cloudflare R2 (file uploads, proof artifacts, agent assets)
Email:         Resend
Monitoring:    OpenTelemetry + Sentry
Deployment:    Dockerized, Railway or Render ready
Testing:       Vitest + Playwright
News:          NewsAPI (AI/tech news feed, cached in Redis + DB)
```

---

## REPOSITORY STRUCTURE

```
trevo/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (public)/                 # Zero-auth public surface
│       │   │   ├── page.tsx              # Landing — live feed, news, stats
│       │   │   ├── news/                 # Full AI news hub
│       │   │   ├── stats/                # AI growth dashboard
│       │   │   ├── registry/             # Public agent + builder directory
│       │   │   ├── archive/              # Public proof archive
│       │   │   ├── commons/              # Public knowledge commons
│       │   │   └── verticals/            # Domain hubs
│       │   ├── (auth)/                   # Login, register, onboarding
│       │   ├── (dashboard)/              # Authenticated app shell
│       │   │   ├── discover/             # Personalized discovery feed
│       │   │   ├── publish/              # Agent publishing wizard
│       │   │   ├── inbox/                # Enquiry + booking message centre
│       │   │   ├── bookings/             # Booking management
│       │   │   ├── notifications/        # Notification centre
│       │   │   ├── problems/             # Problem economy / bounties
│       │   │   ├── council/              # Micro-governance votes
│       │   │   └── dashboard/            # Personal activity + reputation
│       │   ├── api/
│       │   │   ├── trpc/
│       │   │   └── v1/                   # Public REST API
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/                       # shadcn base (customized)
│       │   ├── public/                   # Public surface components
│       │   │   ├── news/
│       │   │   ├── stats/
│       │   │   └── landing/
│       │   ├── registry/
│       │   ├── archive/
│       │   ├── commons/
│       │   ├── problems/
│       │   ├── agents/
│       │   ├── inbox/
│       │   ├── publish/
│       │   └── shared/
│       └── lib/
│           ├── agents/                   # Agent orchestration layer
│           ├── trust/                    # Trust scoring engine
│           ├── anti-gaming/              # Sybil & manipulation detection
│           ├── context-protocol/         # Cross-session context persistence
│           ├── news/                     # News fetch + cache pipeline
│           ├── stats/                    # AI growth data pipeline
│           └── routing/                  # Enquiry routing engine
├── packages/
│   ├── db/                              # Prisma schema + migrations
│   ├── agents/                          # Shared agent definitions
│   └── types/                           # Shared TypeScript types
├── infra/
│   ├── docker-compose.yml
│   └── Dockerfile
└── scripts/
    └── seed.ts
```

---

## DATABASE SCHEMA (Prisma)

Build all models with full relations, indexes, and constraints:

```prisma
// ─── Identity ───────────────────────────────────────────────────────────────

User              { id, email, username, displayName, bio?, website?,
                    role: BUILDER|VALIDATOR|COUNCIL,
                    tier: SEED|PROVEN|TRUSTED|SOVEREIGN,
                    trustScore, reputationPoints, domainVerticals[],
                    createdAt, verified, githubId, avatar,
                    notificationPrefs: Json }

// ─── Agent Listings (Marketplace Layer) ─────────────────────────────────────

AgentListing      { id, ownerId→User, name, slug, tagline,
                    description, useCases: Json, specs: Json,
                    capabilities: string[], integrations: string[],
                    domainVerticals: string[],
                    contactEmail, websiteUrl?, demoUrl?, repoUrl?,
                    mediaAssets: Json,          // R2 URLs for screenshots, logo
                    // Verification layer tracking
                    listingStatus: DRAFT|PENDING_AUTO|NEEDS_FIXES|
                                   PENDING_COMMUNITY|PENDING_COUNCIL|
                                   VERIFIED|REJECTED|CHANGES_REQUESTED|ARCHIVED,
                    autoVerificationReport: Json?,   // AutoVerificationAgent output
                    communityConsensusScore: Float?, // weighted community verdict
                    verificationNote?,               // council rejection/change note
                    verifiedAt?,
                    agentProfileId→AgentProfile?,    // links to trust layer if exists
                    featured: Boolean,
                    viewCount, enquiryCount,
                    // FREE always — no pricing, no tiers, no paywalls
                    createdAt, updatedAt }

AgentListingAsset { id, listingId→AgentListing,
                    type: LOGO|SCREENSHOT|DEMO_VIDEO|DOCUMENT,
                    url, order, createdAt }

// ─── Enquiry & Contact System ────────────────────────────────────────────────

Enquiry           { id, senderId→User, recipientId→User,
                    listingId→AgentListing?,
                    subject, status: OPEN|READ|REPLIED|ARCHIVED|CLOSED,
                    createdAt, updatedAt }

EnquiryMessage    { id, enquiryId→Enquiry, authorId→User,
                    body, readAt?, createdAt }

// ─── Booking System ──────────────────────────────────────────────────────────

BookingRequest    { id, requesterId→User, builderId→User,
                    listingId→AgentListing?,
                    purpose, preferredDate, preferredTime, timezone,
                    notes?,
                    status: PENDING|ACCEPTED|DECLINED|CANCELLED|COMPLETED,
                    builderNote?,
                    respondedAt?, scheduledAt?,
                    createdAt }

// ─── Notifications ───────────────────────────────────────────────────────────

Notification      { id, userId→User,
                    type: ENQUIRY_RECEIVED|ENQUIRY_REPLIED|BOOKING_REQUEST|
                          BOOKING_ACCEPTED|BOOKING_DECLINED|PROOF_VALIDATED|
                          PROOF_DISPUTED|REPUTATION_CHANGE|VOTE_OPENED|MENTION,
                    title, body, linkUrl?,
                    read: Boolean, createdAt }

// ─── News & Stats (Public Feed) ──────────────────────────────────────────────

NewsArticle       { id, externalId, title, summary, url, source,
                    publishedAt, imageUrl?, category,
                    fetchedAt, featured: Boolean }

AIStatSnapshot    { id, metric, value: Float, unit, source,
                    label, recordedAt }

// ─── Trust Layer (unchanged from v1) ─────────────────────────────────────────

AgentProfile      { id, ownerId→User, name, slug, description,
                    capabilities: Json, ioContract: Json,
                    version, forkOf→AgentProfile, forks[],
                    trustScore, totalProofs, successRate,
                    listingId→AgentListing?,
                    status: ACTIVE|DEPRECATED|FLAGGED }

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

CommonEntry       { id, authorId→User?, agentId→AgentProfile?,
                    title, content: Text, domainVertical,
                    type: KNOWLEDGE|PATTERN|FAILURE_LESSON|STANDARD,
                    citations[], endorsements, qualityScore,
                    version, supersedes→CommonEntry? }

Problem           { id, posterId→User, title, description,
                    domainVertical, difficulty: SEED|ESTABLISHED|EXPERT,
                    status: OPEN|ACTIVE|VALIDATING|RESOLVED|DISPUTED,
                    reputationReward, monetaryReward?,
                    requiredTier, deadline?,
                    assignedTo→User?, assignedAgent→AgentProfile?,
                    proof→ProofEntry? }

TrustEvent        { id, actorId→User, targetId→User?,
                    type: VALIDATION|DISPUTE|ENDORSEMENT|FLAG,
                    weight, anomalyScore, reviewed }

ReputationLog     { id, userId→User, delta, reason, proofId?,
                    problemId?, snapshot, createdAt }

GovernanceVote    { id, proposerId→User, title, description,
                    type: STANDARD|INTEROP|GUARDRAIL|VERTICAL,
                    status: ACTIVE|PASSED|REJECTED|WITHDRAWN,
                    threshold, endsAt,
                    votes: GovernanceBallot[] }

GovernanceBallot  { id, voteId→GovernanceVote, voterId→User,
                    choice: YES|NO|ABSTAIN, weight, reasoning? }

AgentContext      { id, agentId→AgentProfile, sessionKey,
                    contextBlob: Json, ttl, updatedAt }
```

---

## BACKEND — tRPC ROUTERS

Build fully implemented routers with Zod validation, auth middleware, and error handling:

### NEW ROUTERS

**`marketplace.router`**
- `listListings({ vertical?, search?, status?, cursor })` — public, paginated
- `getListing(slug)` — full listing with owner profile, assets, enquiry count
- `getFeaturedListings()` — curated featured agents for landing page
- `getTrendingListings()` — by view + enquiry velocity, last 7 days
- `submitListing(input)` — builder submits new listing, triggers verification
- `updateListing(id, input)` — draft/edit own listing
- `deleteListing(id)` — soft archive
- `getMyListings()` — builder's own listings with status
- `trackView(listingId)` — anonymous view increment (rate limited)

**`enquiry.router`**
- `sendEnquiry(input)` — auth required; routes to recipient inbox + email notification
- `replyEnquiry(enquiryId, body)` — sender or recipient can reply
- `getEnquiry(enquiryId)` — full thread, auth required, parties only
- `listInboxEnquiries({ status?, cursor })` — received enquiries
- `listSentEnquiries({ cursor })` — sent enquiries
- `markRead(enquiryId)` — marks enquiry and all messages as read
- `archiveEnquiry(enquiryId)` — soft archive

**`booking.router`**
- `requestBooking(input)` — auth required; sends booking to builder + email
- `respondBooking(id, status, builderNote?)` — builder accepts or declines
- `cancelBooking(id)` — either party can cancel
- `listMyBookings({ role: REQUESTER|HOST, status?, cursor })` — manage bookings
- `getBooking(id)` — detail view, parties only

**`notifications.router`**
- `list({ unreadOnly?, cursor })` — paginated notification list
- `markRead(ids[])` — mark selected as read
- `markAllRead()` — clear badge
- `getUnreadCount()` — for bell indicator

**`feed.router`** (public — no auth)
- `getNews({ category?, cursor })` — AI news articles, cached
- `getStats()` — current AI growth metrics snapshot
- `getLandingFeed()` — combined: featured listings + news + stats + proofs
- `refreshNews()` — internal/cron trigger to re-fetch from NewsAPI

### EXISTING ROUTERS (unchanged)

**`registry.router`**
- `getAgent(slug)` — full profile with proof history
- `getBuilder(username)` — full profile with reputation timeline
- `listAgents({ vertical?, tier?, search?, cursor })` — paginated
- `registerAgent(input)` — validates I/O contract schema
- `forkAgent(agentId, modifications)` — creates fork with lineage
- `updateAgent(agentId, input)` — versioned update
- `deprecateAgent(agentId)` — soft deprecation with migration note
- `getLeaderboard({ vertical?, type: AGENT|BUILDER })` — trust-ranked

**`archive.router`**
- `submitProof(input)` — creates proof entry, triggers validation queue
- `getProof(id)` — full proof with validation thread
- `listProofs({ type?, vertical?, status?, cursor })` — paginated
- `validateProof(proofId, verdict, reasoning, confidence)` — stake reputation
- `disputeProof(proofId, evidence)` — opens dispute thread
- `resolveDispute(proofId, resolution)` — council-level action
- `getProofTimeline(agentId|builderId)` — chronological proof history

**`commons.router`**
- `submitEntry(input)` — create knowledge entry
- `searchCommons(query, vertical?)` — semantic search via Meilisearch
- `endorseEntry(entryId)` — stake reputation on quality
- `updateEntry(entryId, content)` — versioned update
- `getRelated(entryId)` — AI-powered related entries

**`problems.router`**
- `postProblem(input)` — create bounty
- `listProblems({ status?, vertical?, difficulty?, cursor })` — paginated
- `claimProblem(problemId)` — assign to self, locks for 72hrs
- `submitSolution(problemId, proofId)` — links proof to problem
- `validateSolution(problemId, verdict)` — community validation
- `releaseProblem(problemId)` — unclaim if stuck

**`trust.router`**
- `getScore(userId|agentId)` — full trust breakdown
- `getTimeline(userId|agentId)` — reputation over time
- `getAnomalies()` — council-only flagged gaming patterns

**`council.router`**
- `createVote(input)` — propose standard/change
- `castBallot(voteId, choice, reasoning?)` — weighted by tier
- `listVotes({ status? })` — active and resolved
- `getVote(voteId)` — full vote with ballot breakdown

**`discover.router`**
- `getFeed(userId)` — personalized activity feed
- `getRecommendedProblems(userId)` — matched to skills/vertical
- `getRecommendedAgents(context)` — capability matching
- `onboard(input)` — guided first-time setup with vertical selection

**`ai.router`**
- `assistValidation(proofId)` — AI assists human validator
- `suggestCommons(proofId)` — extract reusable knowledge from proof
- `detectAnomaly(userId, recentEvents[])` — gaming detection
- `matchProblemToAgent(problemId)` — capability matching
- `synthesizeContext(agentId, sessionHistory[])` — context compression
- `reviewListing(listingId)` — AI pre-reviews submitted listing before human/community verification

---

## AGENT ORCHESTRATION LAYER

Build a production agent system at `lib/agents/`:

**`AutoVerificationAgent`** ← NEW — Layer 1 of 3
Runs immediately on listing submission. Fully automated checks — no human or community involved at this stage. Executes in parallel:
- **GitHub check**: if repo URL provided, validates it exists, is public, checks README quality score, star count, last commit recency, open issues ratio
- **Live API test**: if API endpoint provided, sends a structured probe request and validates response shape against claimed I/O contract
- **URL validation**: website and demo URLs resolve, no redirects to parked domains, SSL valid
- **Duplicate detection**: embedding similarity vs all existing listings (threshold: >0.88 cosine similarity = flag)
- **Capability coherence**: NLP check that claimed capabilities are consistent with description and use cases
- **Contact validity**: email format + MX record check, no disposable email domains
Returns a structured `AutoVerificationReport`: { passedChecks[], failedChecks[], warnings[], autoScore: 0–100, recommendation: PASS_TO_COMMUNITY | NEEDS_FIXES | REJECT }. If autoScore < 40 → auto-rejected with detailed reasons sent to builder. If 40–74 → passes to Layer 2 with warnings. If 75+ → passes to Layer 2 clean.

**`CommunityVerificationAgent`** ← NEW — Layer 2 of 3
Triggered after AutoVerificationAgent passes a listing. Opens a 72-hour community validation window using the existing proof system infrastructure. Orchestrates:
- Posts a structured `VerificationTask` to a dedicated verification queue visible to PROVEN+ users
- Generates a community review brief: summary of the listing, what reviewers should check, specific questions to answer (e.g. "Does the described capability match a real use case you can validate?")
- Aggregates incoming community verdicts (APPROVE / NEEDS_WORK / REJECT) weighted by reviewer trust score
- Monitors for gaming signals (coordinated approvals, same-IP cluster, new-account surge) and flags to anti-gaming layer
- After 72hr window or 10+ verdicts (whichever first): computes weighted consensus score
- If consensus ≥ 0.70 APPROVE → passes to Layer 3. If consensus ≤ 0.40 → returned to builder with community feedback. Between → escalates to Layer 3 with notes.
Never writes the final verdict — surfaces weighted consensus + full evidence to Layer 3.

**`TREVOCouncilReviewAgent`** ← NEW — Layer 3 of 3
Final human-in-the-loop gate. Surfaces to SOVEREIGN-tier council members (and designated TREVO reviewers) a consolidated review package: AutoVerificationReport + community consensus + flagged concerns + full listing content. Council member reviews and casts a final APPROVE / REJECT / REQUEST_CHANGES verdict via the council UI. On APPROVE → listing status set to VERIFIED, VerifiedBadge unlocked, builder notified, listing goes live. On REJECT → detailed rejection note sent to builder, listing archived. On REQUEST_CHANGES → builder receives structured change list, can resubmit (restarts at Layer 1). Council review target SLA: 48 hours from escalation. If no council member reviews within 48hr → auto-escalated to all SOVEREIGN users with reminder notification.

**Verification status flow:**
```
DRAFT → [submit] → PENDING_AUTO → [AutoVerificationAgent]
  → NEEDS_FIXES (returned to builder)
  → PENDING_COMMUNITY → [CommunityVerificationAgent 72hr]
    → PENDING_COUNCIL → [TREVOCouncilReviewAgent]
      → VERIFIED (live, public, badge shown)
      → REJECTED (archived, builder notified)
      → CHANGES_REQUESTED (back to builder)
```

**`EnquiryRouterAgent`** ← NEW
When an enquiry is submitted, determines if it should be flagged (spam signals, inappropriate content). Returns routing decision and a draft auto-acknowledgement. Never sends autonomously — tRPC layer executes all sends.

**`NewsPickerAgent`** ← NEW — Stage 1 of news pipeline
Fetches raw articles from NewsAPI every 30 minutes (topics: artificial intelligence, LLMs, AI agents, machine learning, automation, generative AI). For each article batch, runs a relevance + quality scoring pass:
- Relevance score (0–1): how directly the article relates to AI/agents/builders — filters out tangentially AI-adjacent noise
- Quality score (0–1): source credibility (tier-1 press, research institutions, notable blogs score highest), article length vs depth signal, no clickbait headline patterns
- Novelty score (0–1): embedding similarity against last 48hr of already-stored articles — suppresses near-duplicate stories
Selects top 12–15 articles per fetch cycle that score ≥ 0.65 across all three dimensions. Returns a ranked, deduplicated selection list. Never persists — passes clean list to NewsInsightAgent.

**`NewsInsightAgent`** ← NEW — Stage 2 of news pipeline
Receives the curated article list from NewsPickerAgent. For each article:
- Generates a 2-sentence plain-English summary (no jargon, no fluff)
- Extracts 2–3 key insight tags (e.g. "model release", "funding", "regulation", "benchmark", "agent framework")
- Assigns a sentiment signal: POSITIVE / NEUTRAL / CAUTIONARY
- Classifies into display category: INDUSTRY | RESEARCH | PRODUCT | POLICY | COMMUNITY

Then, across the full batch, generates:
- **Trend pulse**: a 3-sentence synthesis of what the current batch collectively signals about the state of AI this cycle
- **Dashboard metrics delta**: extracts any quantitative claims from articles (funding amounts, model scores, job numbers, user counts) and maps them to the AIStatSnapshot schema for the stats pipeline to ingest
- **Editor's pick**: selects 1 article as the featured story for the landing hero, with a 1-sentence editorial note explaining why

Output: fully structured `NewsIngestionPayload` → BullMQ job persists to NewsArticle table, updates AIStatSnapshot where applicable, indexes to Meilisearch, invalidates Redis feed cache. The Trend Pulse and Editor's Pick are stored as special `NewsArticle` record types and displayed prominently in the dashboard.

**`StatsRefreshAgent`** ← NEW — Advanced analytics pipeline
Runs on a 6-hour cron AND on-demand when NewsInsightAgent surfaces new quantitative data. Two input streams:
1. **Structured public API pulls**: queries configured public data endpoints (AI job postings aggregator, GitHub model release tracker, PapersWithCode benchmark feed, Crunchbase AI funding API, patent office API) — normalises units, handles pagination, validates numeric ranges
2. **Article-extracted metrics**: receives quantitative claims from NewsInsightAgent — validates against expected ranges, cross-references existing snapshots for plausibility

For each metric, computes:
- Current value, previous value, delta (absolute + percentage)
- 30-day trend line array (pre-shaped for Recharts sparklines)
- Anomaly flag if delta > 2σ from rolling 90-day mean
- Confidence score based on source count + recency

Returns a fully structured `StatsRefreshPayload` containing:
- Per-metric snapshots → AIStatSnapshot table
- Chart-ready time series arrays for `/stats` dashboard
- A `KeyInsight` string per metric (e.g. "AI job postings up 18% this week — fastest growth in 6 months")
- A top-level `MarketPulse`: 2-sentence synthesis of what this cycle tells us about AI momentum

All metrics source-attributed with URL + timestamp. Never fabricates — unavailable sources show "data unavailable" with last-known value.

**`ValidationAgent`**
Analyzes proof submissions for completeness, consistency, and evidence quality. Returns structured assessment, confidence score, red flags. Never decides alone — surfaces findings for human judgment.

**`ContextAgent`**
Compresses session history into persistent context blobs. Retrieves relevant context for new sessions. TTL-managed and privacy-respecting.

**`MatchingAgent`**
Analyzes problem requirements against registry capabilities. Returns ranked agent/builder recommendations with reasoning. Also powers marketplace "similar agents" feature.

**`AnomalyAgent`**
Monitors validation patterns, reputation flows, coordination signals. Flags suspicious clusters for council review. Never auto-penalizes — surfaces evidence only.

**`CommonsSynthesisAgent`**
Reads validated proofs, extracts reusable patterns. Proposes Commons entries for human approval. Prevents duplicate knowledge, suggests merges.

**`DiscoveryAgent`**
Analyzes user activity, domain focus, tier. Surfaces relevant problems, proofs, agents, commons entries, and marketplace listings.

**Agent Base Pattern:**
```typescript
// Input schema (Zod) → prompt construction → Claude API call
// → structured output parsing → validation → typed result returned
// All agents log to telemetry. All failures graceful with fallback.
// No agent has write access — recommendations only.
// Humans and tRPC layer execute all writes.
```

Each agent implements: strongly typed I/O, structured output prompting, retry with exponential backoff, token budget management, response validation, telemetry spans.

---

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
// SEED:      0–99      — post problems, claim, submit proofs, send enquiries
// PROVEN:    100–499   — validate proofs, endorse commons, vote
// TRUSTED:   500–1999  — dispute resolution, vertical moderation
// SOVEREIGN: 2000+     — propose governance votes, weighted disputes

// Score recalculates on every ReputationLog event
// Cached in Redis, 60s TTL
// Full recalculation job runs nightly
```

---

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

// 6. Enquiry Spam Detection  ← NEW
//    Same user sending >5 enquiries in 1hr → rate limit + flag
//    Identical body across multiple enquiries → auto-hold for review

// All detections → AnomalyReport → TrustEvent → council queue
// No automatic penalties. Evidence surfaced for human review only.
```

---

## NEWS & STATS PIPELINE

Build at `lib/news/` and `lib/stats/`:

```typescript
// ─── News Pipeline (two-agent, fully automated) ──────────────────────────────
//
// Every 30 minutes:
// Cron trigger
//   → NewsPickerAgent
//       fetches NewsAPI (topics: AI, LLMs, agents, ML, automation, GenAI)
//       scores each article: relevance × quality × novelty
//       selects top 12–15 articles scoring ≥ 0.65
//       deduplicates vs last 48hr via embedding similarity
//   → NewsInsightAgent
//       per article: 2-sentence summary, insight tags, sentiment, category
//       across batch: Trend Pulse (3-sentence synthesis)
//       extracts quantitative claims → pipes to StatsRefreshAgent
//       selects Editor's Pick with 1-sentence editorial note
//   → BullMQ persist job
//       NewsArticle rows upserted (externalId dedup key)
//       Trend Pulse + Editor's Pick stored as special record types
//       Meilisearch news_index updated
//       Redis invalidated: feed.getLandingFeed, feed.getNews
//
// Fallback: if NewsAPI unavailable → serve last cached batch, no gaps shown

// ─── Stats Pipeline (two-stream, chart-ready) ────────────────────────────────
//
// Every 6 hours + on-demand from NewsInsightAgent:
// StatsRefreshAgent
//   Stream 1 — Public API pulls:
//     - AI job postings (weekly delta %)          ← jobs aggregator API
//     - Global AI investment ($B, quarterly)       ← Crunchbase public API
//     - Open source model releases (monthly)       ← GitHub topics API
//     - LLM benchmark scores (tracked families)   ← PapersWithCode API
//     - AI patents filed (monthly)                ← USPTO open data
//     - AI research papers published (weekly)     ← arXiv API
//   Stream 2 — Article-extracted metrics from NewsInsightAgent
//     (funding rounds, user counts, model scores mentioned in news)
//
//   Per metric output:
//     - currentValue, previousValue, delta (abs + %)
//     - trend30d: number[] (Recharts/D3 sparkline ready)
//     - anomalyFlag: boolean (>2σ from 90-day rolling mean)
//     - confidenceScore: 0–1 (source count × recency)
//     - keyInsight: string (one-liner for dashboard callout)
//     - sourceUrl, sourceName, recordedAt
//
//   Top-level:
//     - marketPulse: string (2-sentence cross-metric synthesis)
//
//   → AIStatSnapshot rows persisted
//   → Redis invalidated: feed.getStats
//   → /stats page served with: animated counters, sparklines,
//       KeyInsight callouts, MarketPulse banner, full source disclosure
//
// All stats show "data unavailable" + last-known value if source fails
// /stats page uses ISR with 6hr revalidation — always fast, never stale
```

---

## ENQUIRY ROUTING ENGINE

Build at `lib/routing/`:

```typescript
// Flow when user submits enquiry:
// 1. EnquiryRouterAgent screens for spam/inappropriate content
// 2. If flagged → held for review, sender notified
// 3. If clean → Enquiry + first EnquiryMessage persisted
// 4. Notification created for recipient (type: ENQUIRY_RECEIVED)
// 5. Email sent via Resend to recipient with preview + link to inbox
// 6. listingId.enquiryCount incremented
//
// Fallback:
// If recipient has no email verified → notification only
// If recipient hasn't logged in for 14 days → secondary email reminder after 48hrs

// Booking flow:
// 1. BookingRequest persisted
// 2. Notification: BOOKING_REQUEST to builder
// 3. Email to builder with details + accept/decline deep link
// 4. On response: Notification to requester (BOOKING_ACCEPTED or BOOKING_DECLINED)
// 5. On accept: calendar .ics file generated and emailed to both parties
```

---

## CONTEXT PROTOCOL

Build at `lib/context-protocol/`:

```typescript
// Context blob structure:
// {
//   agentId, version, lastUpdated,
//   coreCapabilities: string[],
//   recentPatterns: string[],
//   knownFailureModes: string[],
//   domainContext: Record<vertical, summary>,
//   openProblems: { id, summary, status }[],
//   collaborators: { id, trustLevel }[]
// }

// Flow: session starts → load context blob → ContextAgent synthesizes delta
// → delta merged (max 8k tokens compressed) → stored PostgreSQL + Redis
// TTL: active agents 30 days, inactive 7 days
// Privacy: context blobs private to agent owner
// Shareable: owner can publish read-only snapshot to Registry
```

---

## DOMAIN VERTICALS

Ten first-class verticals — not tags, full entities with dedicated commons, trust standards, moderators, leaderboards:

```
ENGINEERING     — software, infrastructure, system design
LEGAL           — contracts, compliance, regulatory
FINANCE         — analysis, modeling, reporting
HEALTHCARE      — clinical workflows, data, operations
HR_HCM          — workforce management, talent, payroll
MARKETING       — content, growth, analytics
RESEARCH        — academic, market, technical
OPERATIONS      — logistics, process, supply chain
EDUCATION       — curriculum, tutoring, assessment
CREATIVE        — design, writing, media
```

---

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
Accent:        #E8FF00  ← electric yellow, proof/validation/contact actions
Danger:        #FF3B30
Success:       #00FF87
Warning:       #FF9500

Typography:
  Display:     "Fraunces" (serif, authoritative, weighted)
  Heading:     "Syne" (geometric, modern)
  Body:        "DM Sans" (clean, readable)
  Mono:        "JetBrains Mono" (scores, IDs, code, stats)

Motion:
  Page transitions:     200ms ease-out, subtle Y-axis slide
  Data reveals:         staggered fade-in, 40ms delays
  Proof validation:     pulse animation on pending state
  Trust score change:   counter animation (react-countup)
  Stats counters:       animated increment on scroll-enter
  News ticker:          smooth horizontal scroll, pause on hover
  Hover states:         border brightness shift, no scale transforms

Spatial:
  Dense information design — no wasted whitespace
  Hard edges — border-radius max 4px
  1px borders over shadows everywhere
  Yellow accent bars as structural elements
  16px base spacing unit
  Grid-breaking accent elements on key pages
```

**Components to build (all production-complete):**

*Original components (unchanged):*
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

*New components:*
`NewsCard` — AI news article with source, date, summary, external link
`NewsTicker` — horizontally scrolling live news bar for landing hero
`AIStatCard` — single metric with value, delta, chart sparkline, source
`AIStatsDashboard` — full stats grid with animated counters
`AgentListingCard` — marketplace card: name, tagline, verticals, verified badge, CTA
`ListingDetailPanel` — full listing view with assets, specs, use cases
`VerifiedBadge` — green verified indicator with tooltip: what verification means
`PublishWizard` — multi-step listing submission: details → specs → assets → review
`PublishStepIndicator` — step progress bar for wizard
`ContactButton` — "Send Enquiry" CTA, yellow accent, auth-gate with modal
`BookButton` — "Book a Call" CTA, opens booking request form
`EnquiryComposer` — subject + body with char limit, send button
`EnquiryThread` — message thread view with timestamps + read status
`InboxItem` — list item: avatar, subject, preview, unread dot, time
`BookingRequestCard` — booking detail with accept/decline controls
`BookingStatusBadge` — PENDING|ACCEPTED|DECLINED|COMPLETED with color coding
`NotificationBell` — nav icon with unread count badge, popover preview
`NotificationItem` — single notification with icon, message, relative time, link
`AuthGateModal` — intercepts unauthed contact/book actions, prompts login
`VerificationStatusBanner` — shows listing owners their current verification state

---

## ALL PAGES (fully functional, no stubs)

### Public Surface (no login)
```
/                           Landing — live news ticker, AI stats hero,
                                      featured listings, community feed preview,
                                      proof highlights, call to explore
/news                       AI news hub — full article list, category filter,
                                          search, source attribution
/stats                      AI growth dashboard — animated metrics,
                                                   charts, source citations, last updated
/registry                   Agent + builder directory, search + filter, public read
/registry/[slug]            Agent listing — specs, use cases, assets, verified badge,
                                            trust profile (if linked), Contact CTA
/builders/[username]        Builder profile — listings, timeline, domains, reputation,
                                              Contact CTA
/archive                    Proof archive — filter by type/vertical/status
/archive/[id]               Single proof — evidence, validation thread, methodology
/commons                    Knowledge commons — search, browse by vertical
/commons/[id]               Single entry — content, citations, endorsements
/verticals/[slug]           Domain hub — leaderboard, listings, problems, commons
```

### Authenticated Surface (login required)
```
/discover                   Personalized feed — mixed listings, proofs, problems
/publish                    Agent publishing wizard — multi-step listing creation
/publish/[id]/edit          Edit own draft or live listing
/inbox                      Enquiry message centre — received + sent threads
/inbox/[enquiryId]          Full enquiry thread — messages, reply composer
/bookings                   Booking management — as requester and as host
/bookings/[id]              Booking detail — info, status, respond controls
/notifications              Full notification history
/problems                   Problem board — open bounties, filters
/problems/[id]              Problem detail — description, claims, linked proofs
/council                    Active votes + recent decisions
/council/[id]               Vote detail — proposal, ballots, discussion
/onboarding                 Guided setup — role, vertical, publish or explore
/dashboard                  Personal — listings, activity, reputation, open items
/settings                   Profile, notifications, API keys
```

---

## AUTHENTICATION & AUTHORIZATION

```typescript
// Better Auth:
// - Email/password with verification
// - GitHub OAuth (auto-populates builder profile)
// - 30 day rolling sessions, Redis-backed
// - API keys for agent-to-platform programmatic access

// Authorization matrix:
// PUBLIC (no login):
//   - Full read: landing, news, stats, registry, archive, commons, verticals
//   - View listings, builder profiles, proofs
//   - Seeing contact/book buttons → clicking triggers AuthGateModal

// AUTHED (any logged-in user):
//   - Send enquiries + booking requests
//   - Publish listings (submit for verification)
//   - Submit proof, claim problem

// PROVEN+:
//   - Validate proofs, endorse commons, vote

// TRUSTED+:
//   - Dispute resolution, vertical moderation

// SOVEREIGN:
//   - Governance proposals, anomaly review, listing rejection
```

---

## PUBLIC REST API

```
GET  /api/v1/listings                  — public marketplace listings
GET  /api/v1/listings/:slug            — single listing
GET  /api/v1/agents/:slug              — agent trust profile
GET  /api/v1/agents/:slug/context      — agent context snapshot
GET  /api/v1/proofs/:id                — proof detail
POST /api/v1/proofs                    (API key auth)
GET  /api/v1/problems                  — open problems
GET  /api/v1/trust/:id                 — trust score
POST /api/v1/problems/:id/claim        (API key auth)
GET  /api/v1/news                      — latest AI news
GET  /api/v1/stats                     — AI growth metrics snapshot
```

Rate limited by tier. API keys scoped to agent profiles.

---

## REAL-TIME (SSE)

- Live validation count updates on proof pages
- Problem claim/release notifications
- Governance vote live tally
- Discovery feed new item indicator
- Trust score change notifications
- Inbox unread count updates (new enquiry arrived)
- Landing page live news ticker (new article ingested)

---

## SEARCH (Meilisearch)

```
listings_index:  name, tagline, description, capabilities[], verticals[], status
agents_index:    name, description, capabilities[], vertical, tier, trustScore
builders_index:  username, domains[], tier, trustScore
proofs_index:    title, summary, methodology, outcome, vertical, type, status
problems_index:  title, description, vertical, difficulty, status, reward
commons_index:   title, content, vertical, type, qualityScore
news_index:      title, summary, source, category, publishedAt
```

All indexed on write via BullMQ background jobs.

---

## BACKGROUND JOBS (BullMQ)

```
news-ingestion           every 30min     → NewsPickerAgent → NewsInsightAgent → persist + index
stats-refresh            every 6hr       → StatsRefreshAgent → persist + chart data
trust-recalculate        nightly         → full trust score recalculation
listing-auto-verify      on submit       → AutoVerificationAgent → report + route
listing-community-open   after auto pass → open 72hr community verification window
listing-community-close  72hr after open → CommunityVerificationAgent → consensus → escalate to council
council-review-reminder  48hr after esc  → notify all SOVEREIGN users if unclaimed
enquiry-reminder         48hr after send → if no reply, email builder reminder
search-index-sync        on write        → sync relevant model to Meilisearch
```

---

## PERFORMANCE REQUIREMENTS

- Core Web Vitals: LCP < 1.2s, FID < 50ms, CLS < 0.05
- API P95: < 200ms cached, < 800ms uncached
- Cursor-based pagination, max 20 items per page
- Next.js Image component, R2-hosted, WebP
- No page > 150kb JS (code split by route)
- Redis cache: trust scores, leaderboards, feeds, news, stats (60s TTL for feeds, 30min for news, 6hr for stats)
- DB indexes on every FK and filtered query
- News + stats pages: ISR with 5min revalidation (fast public load, always fresh)
- Landing page hero: streaming SSR so stats/news render without blocking

---

## DOCKER

```yaml
services:
  web:          Next.js app
  postgres:     PostgreSQL 16
  redis:        Redis 7
  meilisearch:  Latest stable
  worker:       BullMQ background jobs (separate process)
```

Single `docker-compose up` starts everything. Health checks on all services.

---

## ENVIRONMENT VARIABLES

```
DATABASE_URL
REDIS_URL
MEILISEARCH_HOST
MEILISEARCH_API_KEY
ANTHROPIC_API_KEY
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
CLOUDFLARE_R2_BUCKET
CLOUDFLARE_R2_ENDPOINT
CLOUDFLARE_R2_ACCESS_KEY
CLOUDFLARE_R2_SECRET_KEY
RESEND_API_KEY
SENTRY_DSN
NEWS_API_KEY
NEXT_PUBLIC_APP_URL
```

---

## SEED DATA

`scripts/seed.ts` creates:
- 10 domain verticals
- 20 agent listings across verticals (mix of VERIFIED/PENDING/DRAFT)
- 10 agent profiles across verticals (linked to listings where VERIFIED)
- 20 builders with varied tiers and reputations
- 30 proof entries (mix of SUCCESS/FAILURE/PARTIAL)
- 15 validated proofs with full validation threads
- 10 open problems across difficulties and domains
- 20 commons entries
- 3 active governance votes
- Realistic trust scores and reputation logs
- 30 news articles across categories (seeded static, as if fetched)
- 8 AI stat snapshots across all tracked metrics
- 10 enquiry threads with message exchanges
- 5 booking requests in various states

---

## PRODUCTION CHECKLIST (build all)

- [ ] Input sanitization on all user-submitted content
- [ ] CSRF protection on all mutations
- [ ] Rate limiting per-user per-route in Redis
- [ ] SQL injection prevention via Prisma parameterized queries
- [ ] XSS prevention + DOMPurify on rich text
- [ ] Content Security Policy headers
- [ ] API key hashing (bcrypt, never stored plain)
- [ ] Audit log for all reputation-affecting actions
- [ ] Graceful degradation when AI agents fail
- [ ] Database connection pooling (PgBouncer ready)
- [ ] Structured JSON logging with OpenTelemetry
- [ ] Error boundaries on all page sections
- [ ] Loading skeletons for every data-fetched component
- [ ] Empty states for every list view
- [ ] 404 and 500 pages styled to design system
- [ ] AuthGateModal on all contact/book CTAs for unauthed users
- [ ] Listing submission is ALWAYS FREE — no payment integration, no credit gates, no premium tiers on publishing. Enforce at router level: any attempt to introduce a payment check on listing submission is a build error.
- [ ] Enquiry and booking sending is ALWAYS FREE — same rule
- [ ] Enquiry spam rate limiting (5/hr per user)
- [ ] NewsAPI failure fallback (serve last cached batch)
- [ ] Listing asset upload: file type + size validation (max 5MB per asset)
- [ ] .ics calendar invite generation on booking accept
- [ ] Email notification on every enquiry and booking state change
- [ ] News + stats ISR revalidation configured
- [ ] BullMQ worker graceful shutdown handling

---

## EXECUTION ORDER

```
1.  Monorepo setup + Docker environment
2.  Database schema + migrations + seed
3.  Auth system (Better Auth)
4.  tRPC setup + base middleware
5.  Trust scoring engine + anti-gaming (pure logic)
6.  NewsPickerAgent + NewsInsightAgent + StatsRefreshAgent
7.  News & stats pipeline (BullMQ jobs, cron, Redis cache)
8.  feed.router + public landing page + /news + /stats
9.  Marketplace: listings DB + marketplace.router
10. Public registry + listing pages
11. AutoVerificationAgent + CommunityVerificationAgent + TREVOCouncilReviewAgent
12. Verification pipeline (BullMQ jobs, status flow, email notifications)
13. Agent publish wizard + listing status tracking UI
14. Enquiry system: enquiry.router + inbox pages
15. Booking system: booking.router + bookings pages
16. Notification system: notifications.router + bell component
17. Enquiry routing engine + email flows
18. Archive (proof) router + pages
19. Agent orchestration layer (ValidationAgent, ContextAgent, MatchingAgent, etc.)
20. Commons router + pages
21. Problems router + pages
22. Council router + pages
23. Context protocol
24. AI routers
25. Discovery engine + personalized feed
26. Real-time SSE
27. Meilisearch integration (all indexes)
28. Public REST API
29. Design system components (all new + existing)
30. Polish: animations, empty states, error states, skeletons
31. Performance audit + optimization (ISR, streaming, cache)
32. Docker production build verification
```

---

## BRANDING IN CODE

```typescript
// App name:    TREVO
// Tagline:     "Don't just build. Be proven."
// Domain:      trevo.ai (use as NEXT_PUBLIC_APP_URL)
// Brand color: #E8FF00 (electric yellow — the proof accent)
// Dark base:   #0A0A0A
```

---

## FINAL INSTRUCTION

This is TREVO. A production system for the agentic era's trust infrastructure — and its community home.

The public surface is TREVO's front door. It earns trust before a visitor creates an account. The news feeds, the live stats, the verified listings — all free, all real, all signal. This is how builders get discovered and how the community stays informed.

The authenticated surface is where builders prove themselves and where community members connect directly. No gatekeepers between a curious user and the person who built something worth using.

Ship every feature complete or don't ship it. No TODOs. No stubs. No placeholder text. No default shadcn components without TREVO customization. Every page fully functional and visually cohesive from day one.

The codebase reads like one opinionated senior engineer wrote it — consistent patterns, clean abstractions, zero redundancy, zero noise.

*Trust. Evolved.*
```
