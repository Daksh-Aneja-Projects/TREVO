import { PrismaClient, UserRole, UserTier, AgentStatus, ProofType, ValidationStatus, ValidationVerdict, CommonType, ProblemDifficulty, ProblemStatus, GovernanceType, GovernanceStatus, BallotChoice, ListingStatus, EnquiryStatus, BookingStatus, NotificationType, NewsCategory, NewsSentiment } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

const VERTICALS = ["engineering", "legal", "finance", "healthcare", "hr-hcm", "marketing", "research", "operations", "education", "creative"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Seeding TREVO database...\n");

  await db.notification.deleteMany();
  await db.enquiryMessage.deleteMany();
  await db.enquiry.deleteMany();
  await db.bookingRequest.deleteMany();
  await db.agentListingAsset.deleteMany();
  await db.agentListing.deleteMany();
  await db.newsArticle.deleteMany();
  await db.aIStatSnapshot.deleteMany();
  await db.governanceBallot.deleteMany();
  await db.governanceVote.deleteMany();
  await db.reputationLog.deleteMany();
  await db.trustEvent.deleteMany();
  await db.proofValidation.deleteMany();
  await db.proofEntry.deleteMany();
  await db.commonEntry.deleteMany();
  await db.problem.deleteMany();
  await db.agentContext.deleteMany();
  await db.apiKey.deleteMany();
  await db.agentProfile.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verification.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("trevo2024", 10);

  const users = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const tiers: UserTier[] = ["SEED", "SEED", "SEED", "PROVEN", "PROVEN", "PROVEN", "TRUSTED", "TRUSTED", "SOVEREIGN", "SEED"];
      const tier = tiers[i % tiers.length];
      const trustScores = { SEED: rand(0, 99), PROVEN: rand(100, 499), TRUSTED: rand(500, 1999), SOVEREIGN: rand(2000, 3500) };
      const displayNames = [
        "Arya Mehta", "Leo Nakamura", "Priya Desai", "Noah Chen", "Zara Williams",
        "Marcus Rivera", "Isha Patel", "Samuel Okonkwo", "Emma Lindqvist", "Rohan Gupta",
        "Sofia Morales", "Jin Park", "Amara Johnson", "Kai Fischer", "Luna Zhang",
        "Oliver Dubois", "Nadia Kowalski", "Aiden Murphy", "Fatima Al-Rashid", "James Okafor",
      ];

      return db.user.create({
        data: {
          email: `builder${i + 1}@trevo.ai`,
          username: `builder${i + 1}`,
          displayName: displayNames[i],
          passwordHash,
          role: i < 15 ? "BUILDER" : i < 18 ? "VALIDATOR" : "COUNCIL",
          tier,
          trustScore: trustScores[tier],
          reputationPoints: trustScores[tier] * 2,
          domainVerticals: [pick(VERTICALS), pick(VERTICALS)].filter((v, idx, arr) => arr.indexOf(v) === idx),
          verified: i < 15,
          bio: `Building at the intersection of ${pick(VERTICALS)} and ${pick(VERTICALS)}. Shipping real work on TREVO.`,
          website: Math.random() > 0.5 ? `https://${displayNames[i].toLowerCase().replace(" ", "")}.dev` : undefined,
        },
      });
    })
  );

  console.log(`✓ ${users.length} users`);

  const agents = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const names = ["CodeReviewer", "LegalDrafter", "DataAnalyst", "ClinicalAssist", "TalentMatcher", "ContentOptimizer", "ResearchSynth", "OpsPlanner", "CurriculumGen", "DesignCritic"];
      const capabilities = [
        ["code-review", "refactoring", "testing"], ["contract-analysis", "compliance"], ["data-viz", "modeling", "forecasting"],
        ["patient-intake", "scheduling"], ["resume-parsing", "skill-matching"], ["seo", "copy-editing", "a-b-testing"],
        ["literature-review", "summarization"], ["process-mapping", "scheduling"], ["lesson-planning", "assessment"],
        ["ui-review", "accessibility-audit"],
      ];

      return db.agentProfile.create({
        data: {
          ownerId: users[i].id,
          name: names[i],
          slug: names[i].toLowerCase(),
          description: `A specialized ${VERTICALS[i]} agent with proven capabilities in ${capabilities[i].join(", ")}.`,
          capabilities: capabilities[i],
          ioContract: { inputs: [{ name: "task", type: "string", required: true }], outputs: [{ name: "result", type: "object" }] },
          trustScore: rand(50, 800),
          totalProofs: rand(1, 15),
          successRate: Math.random() * 0.4 + 0.6,
        },
      });
    })
  );

  console.log(`✓ ${agents.length} agents`);

  // --- Agent Listings (20 across verticals, mix of statuses) ---
  const listingData = [
    { name: "CodeSentry", tagline: "AI-powered code review that catches what humans miss", vertical: "engineering" },
    { name: "ContractIQ", tagline: "Intelligent contract analysis and compliance checking", vertical: "legal" },
    { name: "FinSight", tagline: "Real-time financial modeling and forecasting engine", vertical: "finance" },
    { name: "MedFlow", tagline: "Clinical workflow optimization for modern healthcare", vertical: "healthcare" },
    { name: "TalentLens", tagline: "AI talent matching that understands context, not just keywords", vertical: "hr-hcm" },
    { name: "GrowthPilot", tagline: "Data-driven content strategy and SEO automation", vertical: "marketing" },
    { name: "PaperMind", tagline: "Research synthesis that turns papers into actionable insights", vertical: "research" },
    { name: "LogiFlow", tagline: "Supply chain optimization with predictive intelligence", vertical: "operations" },
    { name: "EduForge", tagline: "Adaptive curriculum design powered by learning science", vertical: "education" },
    { name: "DesignLint", tagline: "Automated design review for accessibility and consistency", vertical: "creative" },
    { name: "SecurityMesh", tagline: "Continuous security posture monitoring for cloud-native", vertical: "engineering" },
    { name: "ComplianceBot", tagline: "Regulatory compliance automation for financial services", vertical: "legal" },
    { name: "DataWeave", tagline: "No-code data pipeline builder with AI transformations", vertical: "finance" },
    { name: "HealthSync", tagline: "Patient data interoperability across EHR systems", vertical: "healthcare" },
    { name: "PeopleOS", tagline: "Modern workforce analytics and engagement platform", vertical: "hr-hcm" },
    { name: "AdSynth", tagline: "AI creative generation with brand safety guardrails", vertical: "marketing" },
    { name: "LabAssist", tagline: "Lab experiment tracking and protocol optimization", vertical: "research" },
    { name: "FleetMinds", tagline: "Intelligent fleet management with route optimization", vertical: "operations" },
    { name: "QuizCraft", tagline: "Automated assessment generation aligned to learning objectives", vertical: "education" },
    { name: "PixelPerfect", tagline: "AI-powered responsive design testing and optimization", vertical: "creative" },
  ];

  const statuses: ListingStatus[] = ["VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED", "PENDING_COMMUNITY", "PENDING_AUTO", "DRAFT", "VERIFIED", "VERIFIED", "PENDING_COUNCIL", "VERIFIED", "DRAFT", "VERIFIED", "VERIFIED", "NEEDS_FIXES", "VERIFIED"];

  const listings = await Promise.all(
    listingData.map(async (ld, i) => {
      const status = statuses[i];
      return db.agentListing.create({
        data: {
          ownerId: users[i].id,
          name: ld.name,
          slug: ld.name.toLowerCase(),
          tagline: ld.tagline,
          description: `${ld.name} is a production-ready AI agent specializing in ${ld.vertical}. ${ld.tagline}. Built by experienced practitioners, verified by the TREVO community, and backed by real proof of work.`,
          useCases: [
            { title: "Automated analysis", description: `Automatically analyze ${ld.vertical} data and generate actionable reports` },
            { title: "Workflow integration", description: `Integrates seamlessly with existing ${ld.vertical} toolchains` },
            { title: "Continuous monitoring", description: `24/7 monitoring and alerting for ${ld.vertical} metrics` },
          ],
          capabilities: [`${ld.vertical}-analysis`, "reporting", "automation", "api-integration"],
          integrations: ["slack", "api", pick(["github", "jira", "notion", "confluence"])],
          domainVerticals: [ld.vertical],
          contactEmail: `${ld.name.toLowerCase()}@trevo.ai`,
          websiteUrl: `https://${ld.name.toLowerCase()}.ai`,
          demoUrl: Math.random() > 0.3 ? `https://demo.${ld.name.toLowerCase()}.ai` : undefined,
          repoUrl: Math.random() > 0.5 ? `https://github.com/trevo/${ld.name.toLowerCase()}` : undefined,
          listingStatus: status,
          featured: status === "VERIFIED" && i < 6,
          viewCount: status === "VERIFIED" ? rand(50, 2000) : 0,
          enquiryCount: status === "VERIFIED" ? rand(2, 50) : 0,
          verifiedAt: status === "VERIFIED" ? new Date(Date.now() - rand(1, 60) * 24 * 60 * 60 * 1000) : undefined,
          agentProfileId: i < 10 && status === "VERIFIED" ? agents[i].id : undefined,
          autoVerificationReport: status !== "DRAFT" ? { passedChecks: ["url_valid", "description_quality", "contact_valid"], failedChecks: [], warnings: [], autoScore: rand(65, 95), recommendation: "PASS_TO_COMMUNITY" } : undefined,
          communityConsensusScore: status === "VERIFIED" || status === "PENDING_COUNCIL" ? Math.random() * 0.3 + 0.7 : undefined,
        },
      });
    })
  );

  console.log(`✓ ${listings.length} agent listings`);

  // --- Proofs ---
  const proofs = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const types: ProofType[] = ["SUCCESS", "SUCCESS", "SUCCESS", "FAILURE", "PARTIAL"];
      const vStatuses: ValidationStatus[] = ["PENDING", "VALIDATED", "VALIDATED", "VALIDATED", "DISPUTED"];

      return db.proofEntry.create({
        data: {
          builderId: pick(users).id,
          agentId: Math.random() > 0.3 ? pick(agents).id : undefined,
          type: pick(types),
          title: `Proof #${i + 1}: ${pick(["Automated", "Manual", "Hybrid", "AI-Assisted"])} ${pick(["code review", "contract analysis", "data pipeline", "workflow optimization", "security audit", "performance tuning"])}`,
          summary: `Completed ${pick(["comprehensive", "thorough", "focused", "targeted"])} ${pick(["analysis", "review", "implementation", "optimization"])} of ${pick(["legacy system", "new deployment", "critical infrastructure", "client deliverable"])}.`,
          methodology: { approach: "Systematic analysis with automated tooling", tools: [pick(["Claude", "GPT-4", "Custom Script"]), pick(["Prisma", "PostgreSQL", "Redis"])], steps: ["Initial assessment", "Detailed analysis", "Implementation", "Verification"] },
          outcome: { result: pick(["Successfully completed", "Partially completed with known issues", "Failed — documented lessons"]), metrics: { timeSpent: `${rand(2, 40)}h`, linesChanged: rand(50, 5000), testsAdded: rand(0, 50) } },
          evidence: { links: ["https://github.com/trevo/example"], logs: "Build passed. All tests green." },
          domainVertical: pick(VERTICALS),
          validationStatus: pick(vStatuses),
          validationCount: rand(0, 8),
          trustWeight: Math.random() * 2 + 0.5,
          createdAt: new Date(Date.now() - rand(0, 90) * 24 * 60 * 60 * 1000),
        },
      });
    })
  );

  console.log(`✓ ${proofs.length} proofs`);

  const validatedProofs = proofs.filter((p) => p.validationStatus === "VALIDATED");
  for (const proof of validatedProofs.slice(0, 15)) {
    for (let j = 0; j < rand(3, 5); j++) {
      const validator = pick(users.filter((u) => u.id !== proof.builderId));
      try {
        await db.proofValidation.create({
          data: {
            proofId: proof.id,
            validatorId: validator.id,
            verdict: pick(["APPROVE", "APPROVE", "APPROVE", "REJECT"]) as ValidationVerdict,
            reasoning: pick(["Solid methodology, clear evidence chain.", "Well-documented approach with reproducible results.", "Good work but could improve evidence quality.", "Thorough analysis with actionable outcomes."]),
            confidence: Math.random() * 0.3 + 0.7,
            reputationStaked: rand(5, 30),
          },
        });
      } catch {}
    }
  }

  console.log("✓ Validation threads");

  // --- Problems ---
  await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      return db.problem.create({
        data: {
          posterId: pick(users).id,
          title: pick(["Implement rate limiting for API endpoints", "Design data pipeline for real-time analytics", "Create compliance checklist automation", "Build patient scheduling optimizer", "Develop content recommendation engine", "Automate contract clause extraction", "Design fault-tolerant message queue", "Build curriculum mapping tool", "Create visual regression testing suite", "Implement multi-tenant data isolation"]),
          description: `A ${pick(["critical", "important", "high-priority"])} task requiring expertise in ${pick(VERTICALS)}.`,
          domainVertical: pick(VERTICALS),
          difficulty: pick(["SEED", "SEED", "ESTABLISHED", "ESTABLISHED", "EXPERT"]) as ProblemDifficulty,
          status: i < 6 ? "OPEN" : pick(["ACTIVE", "VALIDATING", "RESOLVED"]) as ProblemStatus,
          reputationReward: pick([10, 25, 50, 100, 200]),
          requiredTier: pick(["SEED", "SEED", "PROVEN"]) as UserTier,
          deadline: Math.random() > 0.5 ? new Date(Date.now() + rand(7, 60) * 86400000) : undefined,
        },
      });
    })
  );

  console.log("✓ 10 problems");

  // --- Commons ---
  await Promise.all(
    Array.from({ length: 20 }, () => {
      return db.commonEntry.create({
        data: {
          authorId: pick(users).id,
          title: pick(["Best practices for API rate limiting", "Pattern: Event-driven architecture", "Lesson: Schema migration rollbacks", "Standard: Security review checklist", "Pattern: Composable agent orchestration", "Knowledge: PostgreSQL index optimization", "Lesson: Distributed system partial failures", "Standard: Proof submission guidelines", "Pattern: Trust score algorithms", "Knowledge: Structured output prompting"]),
          content: "Comprehensive knowledge entry with practical guidance for builders working in this domain.",
          domainVertical: pick(VERTICALS),
          type: pick(["KNOWLEDGE", "PATTERN", "FAILURE_LESSON", "STANDARD"]) as CommonType,
          citations: [`proof-${rand(1, 30)}`],
          endorsements: rand(0, 25),
          qualityScore: Math.random() * 20,
        },
      });
    })
  );

  console.log("✓ 20 commons entries");

  // --- Governance Votes ---
  const votes = await Promise.all(
    Array.from({ length: 3 }, () => {
      return db.governanceVote.create({
        data: {
          proposerId: users.find((u) => u.tier === "SOVEREIGN")?.id || users[0].id,
          title: pick(["Proposal: Increase minimum validation count to 5", "Standard: Require methodology in all proofs", "Guardrail: Cap daily reputation gain at 200"]),
          description: "This proposal addresses community feedback on quality standards and anti-gaming measures.",
          type: pick(["STANDARD", "GUARDRAIL", "INTEROP"]) as GovernanceType,
          threshold: 0.6,
          endsAt: new Date(Date.now() + rand(3, 14) * 86400000),
        },
      });
    })
  );

  for (const vote of votes) {
    const selectedVoters = users.sort(() => Math.random() - 0.5).slice(0, rand(5, 12));
    for (const voter of selectedVoters) {
      try {
        await db.governanceBallot.create({
          data: { voteId: vote.id, voterId: voter.id, choice: pick(["YES", "YES", "YES", "NO", "ABSTAIN"]) as BallotChoice, weight: { SEED: 1, PROVEN: 2, TRUSTED: 4, SOVEREIGN: 8 }[voter.tier] },
        });
      } catch {}
    }
  }

  console.log("✓ 3 governance votes with ballots");

  // --- News Articles (30, seeded static) ---
  const newsData = [
    { title: "OpenAI Launches GPT-5 with Enhanced Reasoning", source: "TechCrunch", category: "PRODUCT" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "EU AI Act Enforcement Begins: What Builders Need to Know", source: "Reuters", category: "POLICY" as NewsCategory, sentiment: "CAUTIONARY" as NewsSentiment },
    { title: "Google DeepMind Achieves New Benchmark in Protein Folding", source: "Nature", category: "RESEARCH" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI Job Market Surges 34% Year-Over-Year", source: "Bloomberg", category: "INDUSTRY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Anthropic Raises $3.5B in Series D", source: "Financial Times", category: "INDUSTRY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Open Source LLMs Now Match Proprietary on Key Benchmarks", source: "Ars Technica", category: "RESEARCH" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI Agents Begin Handling Enterprise Customer Support at Scale", source: "Forbes", category: "PRODUCT" as NewsCategory, sentiment: "NEUTRAL" as NewsSentiment },
    { title: "New Study Reveals AI Bias in Healthcare Decision Systems", source: "MIT Technology Review", category: "RESEARCH" as NewsCategory, sentiment: "CAUTIONARY" as NewsSentiment },
    { title: "Microsoft Integrates AI Agents into Office 365 Workflow", source: "The Verge", category: "PRODUCT" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI Patent Filings Hit Record High in 2024", source: "WIRED", category: "INDUSTRY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "UK Government Publishes AI Safety Framework v2", source: "BBC", category: "POLICY" as NewsCategory, sentiment: "NEUTRAL" as NewsSentiment },
    { title: "AI-Powered Drug Discovery Enters Phase III Trials", source: "Nature Medicine", category: "RESEARCH" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Venture Capital in AI Startups Exceeds $80B Globally", source: "PitchBook", category: "INDUSTRY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Open Source Community Builds Decentralized AI Training Network", source: "Hacker News", category: "COMMUNITY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI-Generated Content Now 15% of Web, Raises Quality Concerns", source: "Washington Post", category: "POLICY" as NewsCategory, sentiment: "CAUTIONARY" as NewsSentiment },
    { title: "Hugging Face Surpasses 1 Million Public Models", source: "VentureBeat", category: "COMMUNITY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Multimodal AI Agents Show Promise in Real-World Navigation", source: "arXiv", category: "RESEARCH" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "China's AI Investment Doubles as US-China Tech Competition Intensifies", source: "Nikkei Asia", category: "INDUSTRY" as NewsCategory, sentiment: "NEUTRAL" as NewsSentiment },
    { title: "AI Coding Assistants Now Used by 60% of Professional Developers", source: "Stack Overflow", category: "PRODUCT" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Cybersecurity Threats from AI-Powered Attacks Rise 280%", source: "Dark Reading", category: "POLICY" as NewsCategory, sentiment: "CAUTIONARY" as NewsSentiment },
    { title: "Meta Releases Llama 4 with 1T Parameters Under Open License", source: "Meta AI Blog", category: "PRODUCT" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI Energy Consumption Now Rivals Small Countries", source: "The Guardian", category: "INDUSTRY" as NewsCategory, sentiment: "CAUTIONARY" as NewsSentiment },
    { title: "Stanford HAI Report: AI Index 2025 Key Takeaways", source: "Stanford HAI", category: "RESEARCH" as NewsCategory, sentiment: "NEUTRAL" as NewsSentiment },
    { title: "GitHub Copilot Users Report 55% Productivity Increase", source: "GitHub Blog", category: "PRODUCT" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI Agents Successfully Manage $100M Portfolio in Live Markets", source: "Bloomberg", category: "INDUSTRY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "European Startups Challenge US AI Dominance with Specialized Models", source: "Sifted", category: "COMMUNITY" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "AI Safety Researchers Develop New Alignment Benchmarks", source: "Alignment Forum", category: "RESEARCH" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Japan Passes Landmark AI Governance Bill", source: "NHK World", category: "POLICY" as NewsCategory, sentiment: "NEUTRAL" as NewsSentiment },
    { title: "AI-First Development Practices Reshape Software Engineering", source: "InfoQ", category: "PRODUCT" as NewsCategory, sentiment: "POSITIVE" as NewsSentiment },
    { title: "Global AI Talent Shortage Reaches 4 Million Unfilled Positions", source: "World Economic Forum", category: "INDUSTRY" as NewsCategory, sentiment: "CAUTIONARY" as NewsSentiment },
  ];

  await Promise.all(
    newsData.map((nd, i) =>
      db.newsArticle.create({
        data: {
          externalId: `seed-${i + 1}`,
          title: nd.title,
          summary: `${nd.title}. A comprehensive look at the latest developments and their implications for the AI ecosystem.`,
          url: `https://${nd.source.toLowerCase().replace(/\s+/g, "")}.com/article-${i + 1}`,
          source: nd.source,
          publishedAt: new Date(Date.now() - rand(0, 14) * 86400000),
          category: nd.category,
          sentiment: nd.sentiment,
          insightTags: [nd.category.toLowerCase(), pick(["funding", "model-release", "regulation", "benchmark", "agent-framework", "hiring", "research", "open-source"])],
          featured: i < 3,
        },
      })
    )
  );

  await db.newsArticle.create({
    data: {
      externalId: "seed-trend-pulse",
      title: "Trend Pulse",
      summary: "AI investment continues its explosive growth trajectory with $80B+ in VC funding, while the open source ecosystem matures with models matching proprietary performance. Policy frameworks are crystallizing globally, with the EU, UK, and Japan all publishing comprehensive governance frameworks this quarter.",
      url: "/news",
      source: "TREVO AI",
      publishedAt: new Date(),
      category: "TREND_PULSE",
    },
  });

  await db.newsArticle.create({
    data: {
      externalId: "seed-editors-pick",
      title: newsData[0].title,
      summary: "This marks a significant leap in reasoning capabilities, with implications for every builder in the TREVO ecosystem.",
      url: `https://techcrunch.com/article-1`,
      source: newsData[0].source,
      publishedAt: new Date(),
      category: "EDITORS_PICK",
      featured: true,
    },
  });

  console.log("✓ 30 news articles + trend pulse + editor's pick");

  // --- AI Stat Snapshots ---
  const statsData = [
    { metric: "ai_job_postings_weekly", value: 125400, unit: "positions", source: "LinkedIn + Indeed", label: "AI Job Postings", delta: 12, deltaPercent: 18.3, keyInsight: "AI job postings up 18% this week — fastest growth in 6 months" },
    { metric: "global_ai_investment_quarterly", value: 82.5, unit: "billion USD", source: "PitchBook", label: "Global AI Investment", delta: 8.2, deltaPercent: 11.0, keyInsight: "VC funding into AI exceeds $80B, driven by agent and infrastructure startups" },
    { metric: "open_source_model_releases_monthly", value: 847, unit: "models", source: "Hugging Face", label: "Open Source Models Released", delta: 94, deltaPercent: 12.5, keyInsight: "Open source model releases hit new monthly record at 847" },
    { metric: "llm_benchmark_score_avg", value: 89.3, unit: "score", source: "PapersWithCode", label: "Top LLM Benchmark Score", delta: 2.1, deltaPercent: 2.4, keyInsight: "Average top benchmark score up 2.4% — reasoning improvements lead gains" },
    { metric: "ai_patents_monthly", value: 4250, unit: "patents", source: "USPTO", label: "AI Patents Filed", delta: 380, deltaPercent: 9.8, keyInsight: "AI patent filings approaching 5,000/month milestone" },
    { metric: "ai_research_papers_weekly", value: 3120, unit: "papers", source: "arXiv", label: "AI Research Papers", delta: 210, deltaPercent: 7.2, keyInsight: "Research output steady with agent architectures as top category" },
    { metric: "ai_developer_adoption", value: 60, unit: "percent", source: "Stack Overflow", label: "Developer AI Adoption", delta: 5, deltaPercent: 9.1, keyInsight: "60% of developers now use AI coding tools daily" },
    { metric: "ai_energy_consumption_twh", value: 48.3, unit: "TWh/year", source: "IEA", label: "AI Energy Use", delta: 6.1, deltaPercent: 14.5, keyInsight: "AI compute energy consumption up 14.5% — sustainability concerns grow" },
  ];

  await Promise.all(
    statsData.map((s) =>
      db.aIStatSnapshot.create({
        data: {
          metric: s.metric,
          value: s.value,
          unit: s.unit,
          source: s.source,
          label: s.label,
          delta: s.delta,
          deltaPercent: s.deltaPercent,
          trend30d: Array.from({ length: 30 }, (_, j) => s.value * (0.85 + (j / 30) * 0.15) + (Math.random() - 0.5) * s.value * 0.03),
          keyInsight: s.keyInsight,
          confidence: 0.85 + Math.random() * 0.15,
        },
      })
    )
  );

  console.log("✓ 8 AI stat snapshots with 30-day trends");

  // --- Enquiries (10 threads) ---
  for (let i = 0; i < 10; i++) {
    const sender = pick(users.slice(0, 10));
    const recipient = pick(users.filter((u) => u.id !== sender.id).slice(0, 10));
    const listing = listings.find((l) => l.ownerId === recipient.id && l.listingStatus === "VERIFIED");

    const enquiry = await db.enquiry.create({
      data: {
        senderId: sender.id,
        recipientId: recipient.id,
        listingId: listing?.id,
        subject: pick(["Integration inquiry for our platform", "Interested in your agent for our team", "Quick question about capabilities", "Pricing and availability", "Partnership opportunity"]),
        status: pick(["OPEN", "READ", "REPLIED"]) as EnquiryStatus,
      },
    });

    await db.enquiryMessage.create({
      data: {
        enquiryId: enquiry.id,
        authorId: sender.id,
        body: `Hi! I came across ${listing?.name || "your profile"} on TREVO and I'm interested in learning more about how it could fit our ${pick(VERTICALS)} workflow. Could we chat?`,
      },
    });

    if (enquiry.status === "REPLIED") {
      await db.enquiryMessage.create({
        data: {
          enquiryId: enquiry.id,
          authorId: recipient.id,
          body: `Thanks for reaching out! I'd be happy to discuss. We're currently helping teams in ${pick(VERTICALS)} with similar use cases. When would be a good time to connect?`,
          readAt: Math.random() > 0.5 ? new Date() : undefined,
        },
      });
    }
  }

  console.log("✓ 10 enquiry threads");

  // --- Booking Requests (5) ---
  for (let i = 0; i < 5; i++) {
    const statuses: BookingStatus[] = ["PENDING", "ACCEPTED", "DECLINED", "COMPLETED", "PENDING"];
    await db.bookingRequest.create({
      data: {
        requesterId: users[i].id,
        builderId: users[10 + i].id,
        listingId: listings[i].listingStatus === "VERIFIED" ? listings[i].id : undefined,
        purpose: pick(["Discuss integration into our platform", "Demo and technical deep-dive", "Explore partnership opportunity", "Custom implementation consultation", "Team training session"]),
        preferredDate: new Date(Date.now() + rand(3, 14) * 86400000),
        preferredTime: pick(["09:00", "10:00", "14:00", "15:00", "16:00"]),
        timezone: pick(["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]),
        status: statuses[i],
        builderNote: statuses[i] !== "PENDING" ? "Looking forward to connecting!" : undefined,
        respondedAt: statuses[i] !== "PENDING" ? new Date() : undefined,
      },
    });
  }

  console.log("✓ 5 booking requests");

  // --- Reputation Logs ---
  for (const user of users) {
    let snapshot = 0;
    for (let j = 0; j < rand(3, 15); j++) {
      const delta = rand(-5, 25);
      snapshot += delta;
      await db.reputationLog.create({
        data: {
          userId: user.id,
          delta,
          reason: pick(["Proof submitted", "Proof validated", "Commons endorsed", "Validation completed", "Problem solved", "Pioneer bonus"]),
          snapshot: Math.max(0, snapshot),
          createdAt: new Date(Date.now() - rand(0, 90) * 86400000),
        },
      });
    }
  }

  console.log("✓ Reputation logs");

  // --- Notifications (sample) ---
  for (const user of users.slice(0, 10)) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: pick(["ENQUIRY_RECEIVED", "PROOF_VALIDATED", "REPUTATION_CHANGE", "BOOKING_REQUEST", "LISTING_VERIFIED"]) as NotificationType,
        title: pick(["New enquiry received", "Your proof was validated", "Reputation updated", "New booking request", "Listing verified!"]),
        body: "Activity on your TREVO account",
        linkUrl: pick(["/inbox", "/archive", "/dashboard", "/bookings", "/registry"]),
        read: Math.random() > 0.6,
      },
    });
  }

  console.log("✓ Sample notifications\n");

  console.log("🎉 TREVO v2 database seeded!");
  console.log(`   ${users.length} users | ${agents.length} agents | ${listings.length} listings`);
  console.log(`   ${proofs.length} proofs | 10 problems | 20 commons | 3 votes`);
  console.log(`   30 news articles | 8 stat snapshots | 10 enquiries | 5 bookings`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
