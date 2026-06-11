import { callAgent } from "@/lib/ai";

interface ArticleCandidate {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description: string;
  imageUrl?: string;
}

interface ScoredArticle extends ArticleCandidate {
  relevanceScore: number;
  qualityScore: number;
  noveltyScore: number;
  compositeScore: number;
}

interface PickerResult {
  selected: ScoredArticle[];
  rejected: number;
  reasoning: string;
}

export async function runNewsPickerAgent(rawArticles: ArticleCandidate[], recentTitles: string[]): Promise<PickerResult> {
  if (rawArticles.length === 0) return { selected: [], rejected: 0, reasoning: "No articles to process" };

  return callAgent<PickerResult>(
    `You are TREVO's NewsPickerAgent. Score raw articles for relevance to AI/agents/builders, quality (source credibility, depth), and novelty (vs recent articles). Select top 12-15 articles scoring ≥0.65 across all three dimensions. Return structured JSON.`,
    `Score and select from these ${rawArticles.length} articles:

${rawArticles.map((a, i) => `[${i}] "${a.title}" — ${a.source} (${a.publishedAt})\n    ${a.description?.slice(0, 200) || "no description"}`).join("\n\n")}

Recent articles already stored (check novelty):
${recentTitles.slice(0, 20).map((t) => `- ${t}`).join("\n")}

Return JSON: { selected: [{ title, url, source, publishedAt, description, imageUrl?, relevanceScore: 0-1, qualityScore: 0-1, noveltyScore: 0-1, compositeScore: 0-1 }], rejected: number, reasoning: string }`
  );
}

interface ArticleInsight {
  externalId: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: "INDUSTRY" | "RESEARCH" | "PRODUCT" | "POLICY" | "COMMUNITY";
  sentiment: "POSITIVE" | "NEUTRAL" | "CAUTIONARY";
  insightTags: string[];
}

interface InsightResult {
  articles: ArticleInsight[];
  trendPulse: string;
  editorsPick: { articleIndex: number; editorialNote: string };
  extractedMetrics: { metric: string; value: number; unit: string; source: string }[];
}

export async function runNewsInsightAgent(scoredArticles: ScoredArticle[]): Promise<InsightResult> {
  return callAgent<InsightResult>(
    `You are TREVO's NewsInsightAgent. For each article: generate a 2-sentence summary, extract insight tags, assign sentiment and category. Across the batch: write a 3-sentence Trend Pulse, pick 1 Editor's Pick with editorial note, extract any quantitative claims (funding, scores, counts).`,
    `Process these ${scoredArticles.length} scored articles:

${scoredArticles.map((a, i) => `[${i}] "${a.title}" — ${a.source}\n    URL: ${a.url}\n    ${a.description?.slice(0, 300)}`).join("\n\n")}

Return JSON: {
  articles: [{ externalId: url_hash, title, summary (2 sentences), url, source, publishedAt, imageUrl?, category: "INDUSTRY"|"RESEARCH"|"PRODUCT"|"POLICY"|"COMMUNITY", sentiment: "POSITIVE"|"NEUTRAL"|"CAUTIONARY", insightTags: string[] (2-3 tags) }],
  trendPulse: string (3 sentences),
  editorsPick: { articleIndex: number, editorialNote: string (1 sentence) },
  extractedMetrics: [{ metric, value: number, unit, source }]
}`
  );
}

export type { ArticleCandidate, ScoredArticle, PickerResult, ArticleInsight, InsightResult };
