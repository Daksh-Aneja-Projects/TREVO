import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { rateLimitCheck } from "@/lib/redis";
import type { UserTier } from "@prisma/client";

export type Context = {
  db: typeof db;
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  userId: string | null;
};

export async function createContext(): Promise<Context> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  return {
    db,
    session,
    userId: session?.user?.id ?? null,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});

export const authedProcedure = protectedProcedure;

const tierOrder: Record<UserTier, number> = {
  SEED: 0,
  PROVEN: 1,
  TRUSTED: 2,
  SOVEREIGN: 3,
};

export function tierGate(minTier: UserTier) {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
    }
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { tier: true },
    });
    if (!user || tierOrder[user.tier] < tierOrder[minTier]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires ${minTier} tier or higher`,
      });
    }
    return next({
      ctx: { ...ctx, session: ctx.session, userId: ctx.session.user.id },
    });
  });
}

export function rateLimit(limit: number, windowSeconds: number) {
  return t.middleware(async ({ ctx, next }) => {
    if (ctx.userId) {
      const result = await rateLimitCheck(ctx.userId, limit, windowSeconds);
      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded. Resets at ${new Date(result.resetAt * 1000).toISOString()}`,
        });
      }
    }
    return next();
  });
}
