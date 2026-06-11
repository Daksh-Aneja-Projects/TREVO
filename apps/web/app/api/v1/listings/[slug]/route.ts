import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const listing = await db.agentListing.findUnique({
    where: { slug: params.slug, listingStatus: "VERIFIED" },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      useCases: true, specs: true, capabilities: true, integrations: true,
      domainVerticals: true, websiteUrl: true, demoUrl: true, repoUrl: true,
      viewCount: true, enquiryCount: true, verifiedAt: true, createdAt: true,
      owner: { select: { username: true, displayName: true, tier: true, trustScore: true, avatar: true } },
      agentProfile: { select: { slug: true, trustScore: true, totalProofs: true, successRate: true } },
      assets: { orderBy: { order: "asc" }, select: { type: true, url: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}
