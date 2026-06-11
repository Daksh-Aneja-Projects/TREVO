import { MeiliSearch } from "meilisearch";

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const INDEXES = {
  agents: "agents_index",
  builders: "builders_index",
  proofs: "proofs_index",
  problems: "problems_index",
  commons: "commons_index",
  listings: "listings_index",
  news: "news_index",
} as const;

export async function initializeIndexes() {
  const configs: Record<string, { searchableAttributes: string[]; filterableAttributes: string[]; sortableAttributes: string[] }> = {
    [INDEXES.agents]: {
      searchableAttributes: ["name", "description", "capabilities", "slug"],
      filterableAttributes: ["domainVertical", "tier", "status"],
      sortableAttributes: ["trustScore", "totalProofs", "createdAt"],
    },
    [INDEXES.builders]: {
      searchableAttributes: ["username", "bio"],
      filterableAttributes: ["domainVerticals", "tier", "verified"],
      sortableAttributes: ["trustScore", "reputationPoints", "createdAt"],
    },
    [INDEXES.proofs]: {
      searchableAttributes: ["title", "summary"],
      filterableAttributes: ["domainVertical", "type", "validationStatus"],
      sortableAttributes: ["trustWeight", "validationCount", "createdAt"],
    },
    [INDEXES.problems]: {
      searchableAttributes: ["title", "description"],
      filterableAttributes: ["domainVertical", "difficulty", "status"],
      sortableAttributes: ["reputationReward", "createdAt"],
    },
    [INDEXES.commons]: {
      searchableAttributes: ["title", "content"],
      filterableAttributes: ["domainVertical", "type"],
      sortableAttributes: ["qualityScore", "endorsements", "createdAt"],
    },
    [INDEXES.listings]: {
      searchableAttributes: ["name", "tagline", "description", "capabilities"],
      filterableAttributes: ["domainVerticals", "listingStatus", "featured"],
      sortableAttributes: ["viewCount", "enquiryCount", "createdAt", "verifiedAt"],
    },
    [INDEXES.news]: {
      searchableAttributes: ["title", "summary", "source"],
      filterableAttributes: ["category", "sentiment", "featured"],
      sortableAttributes: ["publishedAt", "fetchedAt"],
    },
  };

  for (const [indexName, config] of Object.entries(configs)) {
    try {
      await client.createIndex(indexName, { primaryKey: "id" });
    } catch {}
    const index = client.index(indexName);
    await index.updateSearchableAttributes(config.searchableAttributes);
    await index.updateFilterableAttributes(config.filterableAttributes);
    await index.updateSortableAttributes(config.sortableAttributes);
  }
}

export async function indexDocument(indexName: string, document: Record<string, unknown>) {
  try {
    const index = client.index(indexName);
    await index.addDocuments([document]);
  } catch (err) {
    console.error(`Failed to index document in ${indexName}:`, err);
  }
}

export async function removeDocument(indexName: string, documentId: string) {
  try {
    const index = client.index(indexName);
    await index.deleteDocument(documentId);
  } catch (err) {
    console.error(`Failed to remove document from ${indexName}:`, err);
  }
}

export async function search(indexName: string, query: string, options?: {
  filter?: string;
  sort?: string[];
  limit?: number;
  offset?: number;
}) {
  try {
    const index = client.index(indexName);
    return await index.search(query, {
      filter: options?.filter,
      sort: options?.sort,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  } catch (err) {
    console.error(`Search failed for ${indexName}:`, err);
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
  }
}

export { client as meiliClient };
