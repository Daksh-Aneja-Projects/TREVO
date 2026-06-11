import { db } from "@/lib/db";

export const PIONEER_CONFIG = {
  totalSlots: 10,
  perks: [
    { id: "badge", label: "Pioneer Badge", description: "Permanent 'Pioneer' badge on your profile and all listings — forever" },
    { id: "featured", label: "Featured Forever", description: "Your listing stays in the Featured section permanently" },
    { id: "tier_boost", label: "Instant PROVEN Tier", description: "Skip SEED — start at PROVEN with 150 reputation points" },
    { id: "priority_search", label: "Priority in Search", description: "Your listings appear first in search results within your vertical" },
    { id: "direct_verify", label: "Fast-Track Verification", description: "Your listing skips community review — goes directly to council" },
    { id: "founding_wall", label: "Founding Wall", description: "Featured permanently on the TREVO Founding Wall on the landing page" },
  ],
} as const;

export type PioneerPerk = typeof PIONEER_CONFIG.perks[number]["id"];

export async function getPioneerStatus() {
  const verifiedCount = await db.agentListing.count({ where: { listingStatus: "VERIFIED" } });
  const active = verifiedCount < PIONEER_CONFIG.totalSlots;
  return {
    active,
    filled: verifiedCount,
    slotsRemaining: Math.max(0, PIONEER_CONFIG.totalSlots - verifiedCount),
    totalSlots: PIONEER_CONFIG.totalSlots,
    perks: PIONEER_CONFIG.perks,
  };
}

export async function isPioneerLister(userId: string): Promise<boolean> {
  const listing = await db.agentListing.findFirst({
    where: { ownerId: userId, listingStatus: "VERIFIED" },
    orderBy: { verifiedAt: "asc" },
    select: { verifiedAt: true },
  });

  if (!listing?.verifiedAt) return false;

  const allVerified = await db.agentListing.findMany({
    where: { listingStatus: "VERIFIED" },
    orderBy: { verifiedAt: "asc" },
    take: PIONEER_CONFIG.totalSlots,
    select: { ownerId: true },
  });

  return allVerified.some((l) => l.ownerId === userId);
}

export async function applyPioneerPerks(userId: string) {
  const isPioneer = await isPioneerLister(userId);
  if (!isPioneer) return;

  const user = await db.user.findUnique({ where: { id: userId }, select: { tier: true, reputationPoints: true } });
  if (!user) return;

  if (user.tier === "SEED") {
    await db.user.update({
      where: { id: userId },
      data: { tier: "PROVEN", reputationPoints: Math.max(user.reputationPoints, 150) },
    });

    await db.reputationLog.create({
      data: {
        userId,
        delta: 150 - user.reputationPoints,
        reason: "Pioneer Program: instant PROVEN tier bonus",
        snapshot: 150,
      },
    });
  }

  await db.agentListing.updateMany({
    where: { ownerId: userId, listingStatus: "VERIFIED" },
    data: { featured: true },
  });

  await db.notification.create({
    data: {
      userId,
      type: "REPUTATION_CHANGE",
      title: "🏔️ You're a TREVO Pioneer!",
      body: "You're one of the first 10 verified listers on TREVO. You've earned the Pioneer badge, instant PROVEN tier, permanent featured placement, and a spot on the Founding Wall. Thank you for believing early.",
      linkUrl: "/dashboard",
    },
  });
}

export async function getPioneerListers() {
  const allVerified = await db.agentListing.findMany({
    where: { listingStatus: "VERIFIED" },
    orderBy: { verifiedAt: "asc" },
    take: PIONEER_CONFIG.totalSlots,
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatar: true, tier: true, bio: true } },
    },
  });

  return allVerified.map((listing, i) => ({
    rank: i + 1,
    username: listing.owner.username,
    displayName: listing.owner.displayName,
    avatar: listing.owner.avatar,
    tier: listing.owner.tier,
    bio: listing.owner.bio,
    listingName: listing.name,
    listingSlug: listing.slug,
    verifiedAt: listing.verifiedAt,
  }));
}
