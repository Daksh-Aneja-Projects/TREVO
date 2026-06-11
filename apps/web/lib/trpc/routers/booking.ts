import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const bookingRouter = router({
  requestBooking: protectedProcedure
    .input(z.object({
      builderId: z.string(),
      listingId: z.string().optional(),
      purpose: z.string().min(10).max(1000),
      preferredDate: z.string().datetime(),
      preferredTime: z.string(),
      timezone: z.string().default("UTC"),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.bookingRequest.create({
        data: {
          requesterId: ctx.session.user.id,
          builderId: input.builderId,
          listingId: input.listingId,
          purpose: input.purpose,
          preferredDate: new Date(input.preferredDate),
          preferredTime: input.preferredTime,
          timezone: input.timezone,
          notes: input.notes,
        },
      });

      await ctx.db.notification.create({
        data: {
          userId: input.builderId,
          type: "BOOKING_REQUEST",
          title: "New booking request",
          body: `${ctx.session.user.username} wants to book a call about: "${input.purpose.slice(0, 60)}..."`,
          linkUrl: `/bookings/${booking.id}`,
        },
      });

      return booking;
    }),

  respondBooking: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["ACCEPTED", "DECLINED"]),
      builderNote: z.string().max(500).optional(),
      scheduledAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.bookingRequest.findUniqueOrThrow({ where: { id: input.id } });
      if (booking.builderId !== ctx.session.user.id) throw new Error("Not authorized");
      if (booking.status !== "PENDING") throw new Error("Booking already responded to");

      const updated = await ctx.db.bookingRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          builderNote: input.builderNote,
          respondedAt: new Date(),
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        },
      });

      await ctx.db.notification.create({
        data: {
          userId: booking.requesterId,
          type: input.status === "ACCEPTED" ? "BOOKING_ACCEPTED" : "BOOKING_DECLINED",
          title: input.status === "ACCEPTED" ? "Booking accepted!" : "Booking declined",
          body: input.status === "ACCEPTED"
            ? `Your booking request has been accepted${input.builderNote ? `: "${input.builderNote}"` : ""}`
            : `Your booking request was declined${input.builderNote ? `: "${input.builderNote}"` : ""}`,
          linkUrl: `/bookings/${input.id}`,
        },
      });

      return updated;
    }),

  cancelBooking: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.bookingRequest.findUniqueOrThrow({ where: { id: input.id } });
      if (booking.requesterId !== ctx.session.user.id && booking.builderId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      if (["COMPLETED", "CANCELLED"].includes(booking.status)) throw new Error("Cannot cancel");
      return ctx.db.bookingRequest.update({ where: { id: input.id }, data: { status: "CANCELLED" } });
    }),

  listMyBookings: protectedProcedure
    .input(z.object({
      role: z.enum(["REQUESTER", "HOST"]),
      status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"]).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = input.role === "REQUESTER"
        ? { requesterId: ctx.session.user.id }
        : { builderId: ctx.session.user.id };
      if (input.status) where.status = input.status;

      const items = await ctx.db.bookingRequest.findMany({
        where: where as any,
        take: 21,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          requester: { select: { username: true, displayName: true, avatar: true, tier: true } },
          builder: { select: { username: true, displayName: true, avatar: true, tier: true } },
          listing: { select: { name: true, slug: true } },
        },
      });

      return { items: items.slice(0, 20), nextCursor: items.length > 20 ? items[20].id : undefined };
    }),

  getBooking: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.bookingRequest.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          requester: { select: { id: true, username: true, displayName: true, avatar: true, tier: true, email: true } },
          builder: { select: { id: true, username: true, displayName: true, avatar: true, tier: true, email: true } },
          listing: { select: { id: true, name: true, slug: true } },
        },
      });

      if (booking.requester.id !== ctx.session.user.id && booking.builder.id !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      return booking;
    }),
});
