import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().default(false),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.session.user.id };
      if (input.unreadOnly) where.read = false;

      const items = await ctx.db.notification.findMany({
        where: where as any,
        take: 21,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      return { items: items.slice(0, 20), nextCursor: items.length > 20 ? items[20].id : undefined };
    }),

  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: { id: { in: input.ids }, userId: ctx.session.user.id },
        data: { read: true },
      });
    }),

  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.notification.updateMany({
        where: { userId: ctx.session.user.id, read: false },
        data: { read: true },
      });
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.notification.count({
        where: { userId: ctx.session.user.id, read: false },
      });
    }),
});
