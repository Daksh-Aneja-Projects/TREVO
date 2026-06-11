import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const marketplaceRouter = router({
  listListings: publicProcedure
    .input(z.object({
      vertical: z.string().optional(),
      search: z.string().optional(),
      status: z.enum(["VERIFIED", "PENDING_COMMUNITY", "PENDING_COUNCIL"]).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        listingStatus: input.status || "VERIFIED",
      };
      if (input.vertical) where.domainVerticals = { has: input.vertical };
      if (input.search) where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { tagline: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } },
      ];

      const items = await ctx.db.agentListing.findMany({
        where: where as any,
        take: 21,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { username: true, displayName: true, avatar: true, tier: true } },
          assets: { where: { type: "LOGO" }, take: 1 },
          _count: { select: { enquiries: true } },
        },
      });

      return {
        items: items.slice(0, 20),
        nextCursor: items.length > 20 ? items[20].id : undefined,
      };
    }),

  getListing: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.agentListing.findUniqueOrThrow({
        where: { slug: input.slug },
        include: {
          owner: { select: { id: true, username: true, displayName: true, avatar: true, tier: true, trustScore: true, bio: true, domainVerticals: true } },
          assets: { orderBy: { order: "asc" } },
          agentProfile: { select: { id: true, slug: true, trustScore: true, totalProofs: true, successRate: true } },
          _count: { select: { enquiries: true, bookings: true } },
        },
      });
    }),

  getFeaturedListings: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.agentListing.findMany({
        where: { listingStatus: "VERIFIED", featured: true },
        take: 6,
        orderBy: { viewCount: "desc" },
        include: {
          owner: { select: { username: true, displayName: true, avatar: true, tier: true } },
          assets: { where: { type: "LOGO" }, take: 1 },
        },
      });
    }),

  getTrendingListings: publicProcedure
    .query(async ({ ctx }) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return ctx.db.agentListing.findMany({
        where: { listingStatus: "VERIFIED", updatedAt: { gte: sevenDaysAgo } },
        take: 10,
        orderBy: [{ enquiryCount: "desc" }, { viewCount: "desc" }],
        include: {
          owner: { select: { username: true, displayName: true, avatar: true, tier: true } },
          assets: { where: { type: "LOGO" }, take: 1 },
        },
      });
    }),

  submitListing: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(100),
      tagline: z.string().min(10).max(200),
      description: z.string().min(50).max(5000),
      useCases: z.array(z.object({ title: z.string(), description: z.string() })).min(1).max(10),
      specs: z.record(z.string(), z.unknown()).optional(),
      capabilities: z.array(z.string()).min(1).max(20),
      integrations: z.array(z.string()).max(20).default([]),
      domainVerticals: z.array(z.string()).min(1).max(5),
      contactEmail: z.string().email(),
      websiteUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const existing = await ctx.db.agentListing.findUnique({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

      return ctx.db.agentListing.create({
        data: {
          ...input,
          useCases: input.useCases,
          slug: finalSlug,
          ownerId: ctx.session.user.id,
          listingStatus: "PENDING_AUTO",
        },
      });
    }),

  updateListing: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(3).max(100).optional(),
      tagline: z.string().min(10).max(200).optional(),
      description: z.string().min(50).max(5000).optional(),
      useCases: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
      specs: z.record(z.string(), z.unknown()).optional(),
      capabilities: z.array(z.string()).optional(),
      integrations: z.array(z.string()).optional(),
      domainVerticals: z.array(z.string()).optional(),
      contactEmail: z.string().email().optional(),
      websiteUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.agentListing.findUniqueOrThrow({ where: { id: input.id } });
      if (listing.ownerId !== ctx.session.user.id) throw new Error("Not authorized");
      if (!["DRAFT", "NEEDS_FIXES", "CHANGES_REQUESTED"].includes(listing.listingStatus)) {
        throw new Error("Listing cannot be edited in current status");
      }
      const { id, ...data } = input;
      return ctx.db.agentListing.update({ where: { id }, data: data as any });
    }),

  deleteListing: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.agentListing.findUniqueOrThrow({ where: { id: input.id } });
      if (listing.ownerId !== ctx.session.user.id) throw new Error("Not authorized");
      return ctx.db.agentListing.update({
        where: { id: input.id },
        data: { listingStatus: "ARCHIVED" },
      });
    }),

  getMyListings: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.agentListing.findMany({
        where: { ownerId: ctx.session.user.id, listingStatus: { not: "ARCHIVED" } },
        orderBy: { updatedAt: "desc" },
        include: {
          assets: { where: { type: "LOGO" }, take: 1 },
          _count: { select: { enquiries: true, bookings: true } },
        },
      });
    }),

  trackView: publicProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.agentListing.update({
        where: { id: input.listingId },
        data: { viewCount: { increment: 1 } },
      });
    }),
});
