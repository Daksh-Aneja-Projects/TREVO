import { Worker, type Job } from "bullmq";
import { QUEUES } from "./index";
import { db } from "@/lib/db";
import { runNewsPipeline } from "@/lib/news/pipeline";
import { runStatsPipeline } from "@/lib/stats/pipeline";
import { runAutoVerificationAgent, runCommunityVerificationAgent } from "@/lib/agents/verification";
import { recalculateAllTrustScores } from "@/lib/trust/scoring";
import { sendEmail } from "@/lib/email/templates";
import { indexDocument, INDEXES } from "@/lib/search";
import { applyPioneerPerks } from "@/lib/pioneer";

const connection = { host: process.env.REDIS_HOST || "localhost", port: parseInt(process.env.REDIS_PORT || "6379") };

type JobHandler = (job: Job) => Promise<void>;

const handlers: Record<string, JobHandler> = {
  [QUEUES.NEWS_INGESTION]: async () => {
    const result = await runNewsPipeline();
    console.log(`[news] Ingested ${result.ingested} articles from ${result.source}`);
  },

  [QUEUES.STATS_REFRESH]: async (job) => {
    const result = await runStatsPipeline(job.data.articleMetrics);
    console.log(`[stats] Updated ${result.updated} metrics`);
  },

  [QUEUES.TRUST_RECALCULATE]: async () => {
    await recalculateAllTrustScores();
    console.log("[trust] Nightly recalculation complete");
  },

  [QUEUES.LISTING_AUTO_VERIFY]: async (job) => {
    const { listingId } = job.data;
    const report = await runAutoVerificationAgent(listingId);
    if (!report) return;

    await db.agentListing.update({
      where: { id: listingId },
      data: { autoVerificationReport: report as any },
    });

    if (report.autoScore < 40) {
      await db.agentListing.update({
        where: { id: listingId },
        data: { listingStatus: "NEEDS_FIXES", verificationNote: report.failedChecks.join("; ") },
      });
      const listing = await db.agentListing.findUnique({ where: { id: listingId } });
      if (listing) {
        await db.notification.create({
          data: {
            userId: listing.ownerId,
            type: "LISTING_CHANGES_REQUESTED",
            title: "Your listing needs fixes",
            body: `Auto-verification found issues: ${report.failedChecks.slice(0, 3).join(", ")}`,
            linkUrl: `/publish/${listingId}/edit`,
          },
        });
      }
    } else {
      await db.agentListing.update({
        where: { id: listingId },
        data: { listingStatus: "PENDING_COMMUNITY", communityVerifyOpenedAt: new Date() },
      });

      const provenUsers = await db.user.findMany({
        where: { tier: { in: ["PROVEN", "TRUSTED", "SOVEREIGN"] } },
        select: { id: true },
        take: 50,
      });

      for (const user of provenUsers) {
        await db.notification.create({
          data: {
            userId: user.id,
            type: "COMMUNITY_REVIEW_NEEDED",
            title: "New listing needs community review",
            body: "A new agent listing is ready for community verification",
            linkUrl: `/registry/${listingId}`,
          },
        });
      }
    }
  },

  [QUEUES.LISTING_COMMUNITY_CLOSE]: async (job) => {
    const { listingId } = job.data;
    const consensus = await runCommunityVerificationAgent(listingId);
    if (!consensus) return;

    await db.agentListing.update({
      where: { id: listingId },
      data: { communityConsensusScore: consensus.consensusScore },
    });

    if (consensus.consensusScore <= 0.40) {
      await db.agentListing.update({
        where: { id: listingId },
        data: { listingStatus: "NEEDS_FIXES", verificationNote: consensus.summaryBrief },
      });
    } else {
      await db.agentListing.update({
        where: { id: listingId },
        data: { listingStatus: "PENDING_COUNCIL", councilEscalatedAt: new Date() },
      });

      const sovereignUsers = await db.user.findMany({
        where: { tier: "SOVEREIGN" },
        select: { id: true },
      });
      for (const user of sovereignUsers) {
        await db.notification.create({
          data: {
            userId: user.id,
            type: "COUNCIL_REVIEW_NEEDED",
            title: "Listing ready for council review",
            body: `Community consensus: ${(consensus.consensusScore * 100).toFixed(0)}% — needs your final verdict`,
            linkUrl: `/council/review/${listingId}`,
          },
        });
      }
    }
  },

  [QUEUES.COUNCIL_REVIEW_REMINDER]: async (job) => {
    const { listingId } = job.data;
    const listing = await db.agentListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.listingStatus !== "PENDING_COUNCIL") return;

    const sovereignUsers = await db.user.findMany({ where: { tier: "SOVEREIGN" }, select: { id: true } });
    for (const user of sovereignUsers) {
      await db.notification.create({
        data: {
          userId: user.id,
          type: "COUNCIL_REVIEW_NEEDED",
          title: "⚠️ Council review overdue",
          body: `Listing "${listing.name}" has been waiting for council review for 48+ hours`,
          linkUrl: `/council/review/${listingId}`,
        },
      });
    }
  },

  [QUEUES.ENQUIRY_REMINDER]: async (job) => {
    const { enquiryId } = job.data;
    const enquiry = await db.enquiry.findUnique({
      where: { id: enquiryId },
      include: { recipient: { select: { email: true, username: true } }, sender: { select: { username: true } } },
    });
    if (!enquiry || enquiry.status !== "OPEN") return;

    await sendEmail({
      to: enquiry.recipient.email,
      subject: `Reminder: Unanswered enquiry from ${enquiry.sender.username}`,
      text: `You have an unanswered enquiry on TREVO: "${enquiry.subject}". Please check your inbox.`,
    });
  },

  [QUEUES.SEARCH_INDEX_SYNC]: async (job) => {
    const { index, document } = job.data;
    await indexDocument(index as string, document);
  },

  [QUEUES.EMAIL_SEND]: async (job) => {
    await sendEmail(job.data as any);
  },
};

export function startWorker() {
  const workers: Worker[] = [];

  for (const [name, handler] of Object.entries(handlers)) {
    const worker = new Worker(name, handler, {
      connection,
      concurrency: name === QUEUES.NEWS_INGESTION ? 1 : 3,
      limiter: name === QUEUES.EMAIL_SEND ? { max: 10, duration: 1000 } : undefined,
    });

    worker.on("failed", (job, err) => {
      console.error(`[${name}] Job ${job?.id} failed:`, err.message);
    });

    worker.on("completed", (job) => {
      console.log(`[${name}] Job ${job.id} completed`);
    });

    workers.push(worker);
  }

  console.log(`[worker] Started ${workers.length} queue workers`);

  const shutdown = async () => {
    console.log("[worker] Graceful shutdown...");
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return workers;
}
