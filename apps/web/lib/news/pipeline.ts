import { db } from "@/lib/db";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";
import { runNewsPickerAgent, runNewsInsightAgent, type ArticleCandidate } from "@/lib/agents/news";
import { indexDocument, INDEXES } from "@/lib/search";

const NEWS_API_BASE = "https://newsapi.org/v2";
const CACHE_KEY_FEED = "feed:landing";
const CACHE_KEY_NEWS = "feed:news";

async function fetchFromNewsAPI(): Promise<ArticleCandidate[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const queries = ["artificial intelligence", "AI agents", "LLM", "machine learning", "generative AI"];
  const articles: ArticleCandidate[] = [];

  for (const q of queries.slice(0, 2)) {
    try {
      const res = await fetch(
        `${NEWS_API_BASE}/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=20&language=en`,
        { headers: { "X-Api-Key": apiKey }, signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.articles || []) {
        articles.push({
          title: a.title,
          url: a.url,
          source: a.source?.name || "Unknown",
          publishedAt: a.publishedAt,
          description: a.description || "",
          imageUrl: a.urlToImage,
        });
      }
    } catch {}
  }

  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

export async function runNewsPipeline() {
  const rawArticles = await fetchFromNewsAPI();
  if (rawArticles.length === 0) return { ingested: 0, source: "cache_fallback" };

  const recentTitles = (await db.newsArticle.findMany({
    where: { fetchedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
    select: { title: true },
    take: 50,
  })).map((a) => a.title);

  const picked = await runNewsPickerAgent(rawArticles, recentTitles);
  if (!picked || picked.selected.length === 0) return { ingested: 0, source: "picker_empty" };

  const insights = await runNewsInsightAgent(picked.selected);
  if (!insights) return { ingested: 0, source: "insight_failed" };

  let ingested = 0;
  for (const article of insights.articles) {
    try {
      const externalId = article.externalId || Buffer.from(article.url).toString("base64").slice(0, 64);
      const record = await db.newsArticle.upsert({
        where: { externalId },
        create: {
          externalId,
          title: article.title,
          summary: article.summary,
          url: article.url,
          source: article.source,
          publishedAt: new Date(article.publishedAt),
          imageUrl: article.imageUrl,
          category: article.category,
          sentiment: article.sentiment,
          insightTags: article.insightTags,
        },
        update: {
          summary: article.summary,
          category: article.category,
          sentiment: article.sentiment,
          insightTags: article.insightTags,
          fetchedAt: new Date(),
        },
      });

      await indexDocument(INDEXES.agents, { id: record.id, title: record.title, summary: record.summary, source: record.source, category: record.category, publishedAt: record.publishedAt.toISOString() });
      ingested++;
    } catch {}
  }

  if (insights.trendPulse) {
    await db.newsArticle.upsert({
      where: { externalId: `trend_pulse_${new Date().toISOString().slice(0, 13)}` },
      create: {
        externalId: `trend_pulse_${new Date().toISOString().slice(0, 13)}`,
        title: "Trend Pulse",
        summary: insights.trendPulse,
        url: "/news",
        source: "TREVO AI",
        publishedAt: new Date(),
        category: "TREND_PULSE",
      },
      update: { summary: insights.trendPulse, fetchedAt: new Date() },
    });
  }

  if (insights.editorsPick && insights.articles[insights.editorsPick.articleIndex]) {
    const pick = insights.articles[insights.editorsPick.articleIndex];
    await db.newsArticle.upsert({
      where: { externalId: `editors_pick_${new Date().toISOString().slice(0, 13)}` },
      create: {
        externalId: `editors_pick_${new Date().toISOString().slice(0, 13)}`,
        title: pick.title,
        summary: insights.editorsPick.editorialNote,
        url: pick.url,
        source: pick.source,
        publishedAt: new Date(),
        category: "EDITORS_PICK",
        featured: true,
      },
      update: { summary: insights.editorsPick.editorialNote, fetchedAt: new Date() },
    });
  }

  await cacheDel(CACHE_KEY_FEED);
  await cacheDel(CACHE_KEY_NEWS);

  return { ingested, source: "newsapi" };
}
