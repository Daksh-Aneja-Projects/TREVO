"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import { NewsCard, Skeleton, EmptyState, SearchInput } from "@/components/ui";
import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";

type Category = "ALL" | "INDUSTRY" | "RESEARCH" | "PRODUCT" | "POLICY" | "COMMUNITY";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "INDUSTRY", label: "Industry" },
  { key: "RESEARCH", label: "Research" },
  { key: "PRODUCT", label: "Product" },
  { key: "POLICY", label: "Policy" },
  { key: "COMMUNITY", label: "Community" },
];

const SENTIMENT_ICON: Record<string, string> = {
  positive: "↑", neutral: "→", negative: "↓",
};

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const categoryInput = activeCategory === "ALL" ? undefined : activeCategory;
  const news = trpc.feed.getNews.useQuery({ category: categoryInput as any });
  const statsData = trpc.feed.getStats.useQuery();

  const articles = news.data?.items || [];
  const marketPulse = statsData.data?.marketPulse;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold">AI News</h1>
            <p className="text-sm text-trevo-text-secondary mt-1">What&apos;s happening in AI right now</p>
          </div>

          {/* Trend Pulse */}
          {marketPulse && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="border border-trevo-border bg-trevo-surface rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-trevo-accent">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span className="text-[10px] font-mono text-trevo-accent tracking-widest uppercase">Trend Pulse</span>
              </div>
              <p className="text-sm text-trevo-text-secondary leading-relaxed">{marketPulse}</p>
            </motion.div>
          )}

          {/* Category Filters */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`text-[11px] font-mono font-medium uppercase tracking-wider px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors ${
                  activeCategory === cat.key
                    ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                    : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          {news.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : articles.length === 0 ? (
            <EmptyState icon={Newspaper} title="No articles found" description="Try a different category filter." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article: any, i: number) => (
                <motion.div key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <NewsCard
                    title={article.title}
                    summary={article.summary}
                    source={article.source}
                    url={article.url || "#"}
                    publishedAt={article.publishedAt}
                    category={article.category}
                    sentiment={article.sentiment}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More */}
          {news.data?.nextCursor && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <button
                onClick={() => {}}
                className="text-sm font-heading text-trevo-accent hover:underline">
                Load more articles
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
