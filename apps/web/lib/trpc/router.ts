import { router } from "./trpc";
import { registryRouter } from "./routers/registry";
import { archiveRouter } from "./routers/archive";
import { commonsRouter } from "./routers/commons";
import { problemsRouter } from "./routers/problems";
import { councilRouter } from "./routers/council";
import { trustRouter } from "./routers/trust";
import { discoverRouter } from "./routers/discover";
import { aiRouter } from "./routers/ai";
import { marketplaceRouter } from "./routers/marketplace";
import { enquiryRouter } from "./routers/enquiry";
import { bookingRouter } from "./routers/booking";
import { notificationsRouter } from "./routers/notifications";
import { feedRouter } from "./routers/feed";

export const appRouter = router({
  registry: registryRouter,
  archive: archiveRouter,
  commons: commonsRouter,
  problems: problemsRouter,
  council: councilRouter,
  trust: trustRouter,
  discover: discoverRouter,
  ai: aiRouter,
  marketplace: marketplaceRouter,
  enquiry: enquiryRouter,
  booking: bookingRouter,
  notifications: notificationsRouter,
  feed: feedRouter,
});

export type AppRouter = typeof appRouter;
