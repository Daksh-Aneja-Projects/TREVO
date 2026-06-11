import { Queue, Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis";

const connection = { host: process.env.REDIS_HOST || "localhost", port: parseInt(process.env.REDIS_PORT || "6379") };

export const QUEUES = {
  NEWS_INGESTION: "news-ingestion",
  STATS_REFRESH: "stats-refresh",
  TRUST_RECALCULATE: "trust-recalculate",
  LISTING_AUTO_VERIFY: "listing-auto-verify",
  LISTING_COMMUNITY_OPEN: "listing-community-open",
  LISTING_COMMUNITY_CLOSE: "listing-community-close",
  COUNCIL_REVIEW_REMINDER: "council-review-reminder",
  ENQUIRY_REMINDER: "enquiry-reminder",
  SEARCH_INDEX_SYNC: "search-index-sync",
  EMAIL_SEND: "email-send",
} as const;

export const queues = Object.fromEntries(
  Object.entries(QUEUES).map(([key, name]) => [key, new Queue(name, { connection })])
) as Record<keyof typeof QUEUES, Queue>;

export async function addJob(queueKey: keyof typeof QUEUES, data: Record<string, unknown>, opts?: { delay?: number; attempts?: number }) {
  return queues[queueKey].add(QUEUES[queueKey], data, {
    attempts: opts?.attempts || 3,
    backoff: { type: "exponential", delay: 2000 },
    delay: opts?.delay,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

export async function addRecurringJob(queueKey: keyof typeof QUEUES, pattern: string, data?: Record<string, unknown>) {
  return queues[queueKey].add(QUEUES[queueKey], data || {}, {
    repeat: { pattern },
    removeOnComplete: { count: 10 },
  });
}

export async function setupRecurringJobs() {
  await addRecurringJob("NEWS_INGESTION", "*/30 * * * *");
  await addRecurringJob("STATS_REFRESH", "0 */6 * * *");
  await addRecurringJob("TRUST_RECALCULATE", "0 3 * * *");
}
