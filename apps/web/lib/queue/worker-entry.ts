import { startWorker } from "./worker";
import { setupRecurringJobs } from "./index";

async function main() {
  console.log("[worker] Starting TREVO background worker...");
  startWorker();
  await setupRecurringJobs();
  console.log("[worker] Recurring jobs scheduled");
}

main().catch(console.error);
