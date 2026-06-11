import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const enquiryRouter = router({
  sendEnquiry: protectedProcedure
    .input(z.object({
      recipientId: z.string(),
      listingId: z.string().optional(),
      subject: z.string().min(5).max(200),
      body: z.string().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await ctx.db.enquiry.count({
        where: { senderId: ctx.session.user.id, createdAt: { gte: oneHourAgo } },
      });
      if (recentCount >= 5) throw new Error("Rate limited: max 5 enquiries per hour");

      const enquiry = await ctx.db.enquiry.create({
        data: {
          senderId: ctx.session.user.id,
          recipientId: input.recipientId,
          listingId: input.listingId,
          subject: input.subject,
          messages: {
            create: { authorId: ctx.session.user.id, body: input.body },
          },
        },
        include: { messages: true },
      });

      if (input.listingId) {
        await ctx.db.agentListing.update({
          where: { id: input.listingId },
          data: { enquiryCount: { increment: 1 } },
        });
      }

      await ctx.db.notification.create({
        data: {
          userId: input.recipientId,
          type: "ENQUIRY_RECEIVED",
          title: "New enquiry received",
          body: `${ctx.session.user.username} sent you an enquiry: "${input.subject}"`,
          linkUrl: `/inbox/${enquiry.id}`,
        },
      });

      return enquiry;
    }),

  replyEnquiry: protectedProcedure
    .input(z.object({
      enquiryId: z.string(),
      body: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const enquiry = await ctx.db.enquiry.findUniqueOrThrow({
        where: { id: input.enquiryId },
        select: { senderId: true, recipientId: true },
      });

      const userId = ctx.session.user.id;
      if (userId !== enquiry.senderId && userId !== enquiry.recipientId) {
        throw new Error("Not authorized");
      }

      const message = await ctx.db.enquiryMessage.create({
        data: { enquiryId: input.enquiryId, authorId: userId, body: input.body },
      });

      await ctx.db.enquiry.update({
        where: { id: input.enquiryId },
        data: { status: "REPLIED", updatedAt: new Date() },
      });

      const recipientId = userId === enquiry.senderId ? enquiry.recipientId : enquiry.senderId;
      await ctx.db.notification.create({
        data: {
          userId: recipientId,
          type: "ENQUIRY_REPLIED",
          title: "New reply to your enquiry",
          body: `${ctx.session.user.username} replied to your enquiry`,
          linkUrl: `/inbox/${input.enquiryId}`,
        },
      });

      return message;
    }),

  getEnquiry: protectedProcedure
    .input(z.object({ enquiryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enquiry = await ctx.db.enquiry.findUniqueOrThrow({
        where: { id: input.enquiryId },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } },
          recipient: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } },
          listing: { select: { id: true, name: true, slug: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, username: true, avatar: true } } },
          },
        },
      });

      const userId = ctx.session.user.id;
      if (userId !== enquiry.sender.id && userId !== enquiry.recipient.id) {
        throw new Error("Not authorized");
      }

      return enquiry;
    }),

  listInboxEnquiries: protectedProcedure
    .input(z.object({
      status: z.enum(["OPEN", "READ", "REPLIED", "ARCHIVED", "CLOSED"]).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { recipientId: ctx.session.user.id };
      if (input.status) where.status = input.status;
      else where.status = { not: "ARCHIVED" };

      const items = await ctx.db.enquiry.findMany({
        where: where as any,
        take: 21,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          sender: { select: { username: true, displayName: true, avatar: true } },
          listing: { select: { name: true, slug: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      return { items: items.slice(0, 20), nextCursor: items.length > 20 ? items[20].id : undefined };
    }),

  listSentEnquiries: protectedProcedure
    .input(z.object({ cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.enquiry.findMany({
        where: { senderId: ctx.session.user.id },
        take: 21,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          recipient: { select: { username: true, displayName: true, avatar: true } },
          listing: { select: { name: true, slug: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      return { items: items.slice(0, 20), nextCursor: items.length > 20 ? items[20].id : undefined };
    }),

  markRead: protectedProcedure
    .input(z.object({ enquiryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enquiry = await ctx.db.enquiry.findUniqueOrThrow({ where: { id: input.enquiryId } });
      if (enquiry.recipientId !== ctx.session.user.id) throw new Error("Not authorized");

      await ctx.db.enquiry.update({ where: { id: input.enquiryId }, data: { status: "READ" } });
      await ctx.db.enquiryMessage.updateMany({
        where: { enquiryId: input.enquiryId, readAt: null, authorId: { not: ctx.session.user.id } },
        data: { readAt: new Date() },
      });
    }),

  archiveEnquiry: protectedProcedure
    .input(z.object({ enquiryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enquiry = await ctx.db.enquiry.findUniqueOrThrow({ where: { id: input.enquiryId } });
      if (enquiry.recipientId !== ctx.session.user.id && enquiry.senderId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      return ctx.db.enquiry.update({ where: { id: input.enquiryId }, data: { status: "ARCHIVED" } });
    }),
});
