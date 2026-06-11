"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  Skeleton, EmptyState, Button, SearchInput, DomainBadge, TierBadge, Card,
} from "@/components/ui";
import { VERTICALS, formatRelative } from "@/lib/utils";
import { Archive, Plus, ThumbsUp, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

type EntryType = "KNOWLEDGE" | "PATTERN" | "FAILURE_LESSON" | "STANDARD";

const TYPE_LABELS: Record<EntryType, { label: string; color: string }> = {
  KNOWLEDGE: { label: "Knowledge", color: "text-trevo-accent" },
  PATTERN: { label: "Pattern", color: "text-trevo-success" },
  FAILURE_LESSON: { label: "Failure Lesson", color: "text-trevo-warning" },
  STANDARD: { label: "Standard", color: "text-trevo-text-secondary" },
};

export default function CommonsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState("");
  const [type, setType] = useState<string>("");

  const commons = trpc.commons.searchCommons.useQuery({
    query: query || " ",
    vertical: vertical || undefined,
    type: type ? (type as EntryType) : undefined,
  });

  const items = commons.data?.items || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Commons</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Shared knowledge, patterns, and standards from the community</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => router.push("/commons?action=submit")} className="gap-1.5">
              <Plus size={14} /> Contribute
            </Button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <SearchInput value={query} onChange={setQuery} placeholder="Search knowledge, patterns, failure lessons..." />
          </div>

          {/* Filters */}
          <div className="space-y-2 mb-6">
            <div className="flex gap-1.5 flex-wrap">
              {["", "KNOWLEDGE", "PATTERN", "FAILURE_LESSON", "STANDARD"].map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${
                    type === t
                      ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                      : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                  }`}>
                  {t ? TYPE_LABELS[t as EntryType].label : "All Types"}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setVertical("")}
                className={`text-[10px] font-mono px-2 py-1 border transition-colors ${!vertical ? "border-trevo-accent text-trevo-accent" : "border-trevo-border text-trevo-text-muted"}`}>
                All
              </button>
              {VERTICALS.map((v) => (
                <button key={v.slug} onClick={() => setVertical(v.slug)}
                  className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                    vertical === v.slug ? "border-trevo-accent text-trevo-accent" : "border-trevo-border text-trevo-text-muted"
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entries */}
          {commons.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Archive} title="No entries found" description="Try a different search or be the first to contribute." />
          ) : (
            <div className="space-y-3">
              {items.map((entry: any, i: number) => (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link href={`/commons/${entry.id}`}>
                    <Card className="p-4 hover:border-trevo-border-hover transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-mono uppercase tracking-wider ${TYPE_LABELS[entry.type as EntryType]?.color || "text-trevo-text-muted"}`}>
                              {TYPE_LABELS[entry.type as EntryType]?.label || entry.type}
                            </span>
                            <DomainBadge vertical={entry.domainVertical} />
                            <span className="text-[10px] font-mono text-trevo-text-muted">v{entry.version}</span>
                          </div>
                          <h3 className="font-heading font-semibold text-sm mb-1 truncate">{entry.title}</h3>
                          <p className="text-xs text-trevo-text-secondary line-clamp-2">{entry.content?.slice(0, 200)}...</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-trevo-text-muted">
                            <span>@{entry.author?.username}</span>
                            <span>{formatRelative(entry.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0 text-center">
                          <div className="flex items-center gap-1 text-xs font-mono">
                            <ThumbsUp size={10} className="text-trevo-accent" />
                            <span className="text-trevo-accent font-semibold">{entry.endorsements}</span>
                          </div>
                          <span className="text-[9px] text-trevo-text-muted">quality: {entry.qualityScore?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
