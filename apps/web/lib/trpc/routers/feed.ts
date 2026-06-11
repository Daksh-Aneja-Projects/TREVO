import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const feedRouter = router({
  getNews: publicProcedure
    .input(z.object({
      category: z.enum(["INDUSTRY", "RESEARCH", "PRODUCT", "POLICY", "COMMUNITY"]).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        category: { notIn: ["TREND_PULSE", "EDITORS_PICK"] },
      };
      if (input.category) where.category = input.category;

      const items = await ctx.db.newsArticle.findMany({
        where: where as any,
        take: 21,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { publishedAt: "desc" },
      });

      return { items: items.slice(0, 20), nextCursor: items.length > 20 ? items[20].id : undefined };
    }),

  getStats: publicProcedure
    .query(async ({ ctx }) => {
      const metrics = await ctx.db.aIStatSnapshot.findMany({
        orderBy: { recordedAt: "desc" },
        distinct: ["metric"],
        take: 20,
      });

      const marketPulse = await ctx.db.newsArticle.findFirst({
        where: { category: "TREND_PULSE" },
        orderBy: { fetchedAt: "desc" },
      });

      return { metrics, marketPulse: marketPulse?.summary || null };
    }),

  getLandingFeed: publicProcedure
    .query(async ({ ctx }) => {
      const [featuredListings, news, stats, recentProofs, editorsPick, pioneerStats] = await Promise.all([
        ctx.db.agentListing.findMany({
          where: { listingStatus: "VERIFIED", featured: true },
          take: 4,
          orderBy: { viewCount: "desc" },
          include: {
            owner: { select: { username: true, displayName: true, avatar: true, tier: true } },
            assets: { where: { type: "LOGO" }, take: 1 },
          },
        }),
        ctx.db.newsArticle.findMany({
          where: { category: { notIn: ["TREND_PULSE", "EDITORS_PICK"] } },
          take: 6,
          orderBy: { publishedAt: "desc" },
        }),
        ctx.db.aIStatSnapshot.findMany({
          orderBy: { recordedAt: "desc" },
          distinct: ["metric"],
          take: 6,
        }),
        ctx.db.proofEntry.findMany({
          where: { validationStatus: "VALIDATED" },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            builder: { select: { username: true, avatar: true } },
            agent: { select: { name: true, slug: true } },
          },
        }),
        ctx.db.newsArticle.findFirst({
          where: { category: "EDITORS_PICK" },
          orderBy: { fetchedAt: "desc" },
        }),
        ctx.db.agentListing.count({ where: { listingStatus: "VERIFIED" } }),
      ]);

      const PIONEER_THRESHOLD = 10;
      const pioneerSlotsRemaining = Math.max(0, PIONEER_THRESHOLD - pioneerStats);
      const pioneerActive = pioneerSlotsRemaining > 0;

      return {
        featuredListings,
        news,
        stats,
        recentProofs,
        editorsPick,
        pioneer: {
          active: pioneerActive,
          slotsRemaining: pioneerSlotsRemaining,
          totalSlots: PIONEER_THRESHOLD,
          filled: pioneerStats,
        },
      };
    }),

  refreshNews: publicProcedure
    .mutation(async () => {
      return { queued: true, message: "News refresh job enqueued" };
    }),
});
