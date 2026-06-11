import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const vertical = searchParams.get("vertical");
  const search = searchParams.get("search");
  const cursor = searchParams.get("cursor");

  const where: Record<string, unknown> = { listingStatus: "VERIFIED" };
  if (vertical) where.domainVerticals = { has: vertical };
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { tagline: { contains: search, mode: "insensitive" } },
  ];

  const items = await db.agentListing.findMany({
    where: where as any,
    take: 21,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, tagline: true, capabilities: true,
      domainVerticals: true, listingStatus: true, viewCount: true, enquiryCount: true,
      verifiedAt: true, createdAt: true,
      owner: { select: { username: true, tier: true } },
    },
  });

  return NextResponse.json({
    items: items.slice(0, 20),
    nextCursor: items.length > 20 ? items[20].id : undefined,
  });
}
