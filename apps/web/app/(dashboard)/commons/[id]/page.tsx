"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  DomainBadge, TierBadge, Button, Skeleton, EmptyState, Card, SectionHeader,
} from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/utils";
import { Archive, ChevronRight, ThumbsUp, User, GitBranch } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_LABELS: Record<string, string> = {
  KNOWLEDGE: "Knowledge", PATTERN: "Pattern",
  FAILURE_LESSON: "Failure Lesson", STANDARD: "Standard",
};

export default function CommonsEntryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const entry = trpc.commons.getEntry.useQuery({ id });
  const endorseMutation = trpc.commons.endorseEntry.useMutation({
    onSuccess: () => entry.refetch(),
  });

  if (entry.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!entry.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1">
          <EmptyState icon={Archive} title="Entry not found" description="This commons entry doesn't exist." />
        </div>
        <Footer />
      </div>
    );
  }

  const e = entry.data;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-trevo-text-muted mb-6">
            <Link href="/commons" className="hover:text-trevo-text transition-colors">Commons</Link>
            <ChevronRight size={12} />
            <span className="truncate">{e.title.slice(0, 40)}</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-trevo-accent">
                {TYPE_LABELS[e.type] || e.type}
              </span>
              <DomainBadge vertical={e.domainVertical} />
              <span className="text-[10px] font-mono text-trevo-text-muted">v{e.version}</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{e.title}</h1>
          </div>

          {/* Author + Stats */}
          <div className="flex items-center gap-4 text-sm mb-6 flex-wrap">
            <Link href={`/builders/${e.author?.username}`} className="flex items-center gap-1.5 text-trevo-text-secondary hover:text-trevo-accent transition-colors">
              <User size={12} /> @{e.author?.username}
              {e.author?.tier && <TierBadge tier={e.author.tier as "SEED"} size="xs" />}
            </Link>
            <span className="text-trevo-text-muted">{formatRelative(e.createdAt)}</span>
            <span className="flex items-center gap-1 text-trevo-accent font-mono text-xs">
              <ThumbsUp size={12} /> {e.endorsements} endorsements
            </span>
            <span className="font-mono text-xs text-trevo-text-muted">quality: {e.qualityScore?.toFixed(1)}</span>
          </div>

          {/* Actions */}
          {session?.user && (
            <div className="flex gap-2 mb-8">
              <Button variant="secondary" size="sm" onClick={() => endorseMutation.mutate({ entryId: e.id })}
                disabled={endorseMutation.isPending} className="gap-1.5">
                <ThumbsUp size={14} /> Endorse
              </Button>
            </div>
          )}

          {/* Supersedes / Superseded By */}
          {e.supersedes && (
            <Card className="p-3 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <GitBranch size={12} className="text-trevo-text-muted" />
                <span className="text-trevo-text-muted">Supersedes</span>
                <Link href={`/commons/${e.supersedes.id}`} className="text-trevo-accent hover:underline">{e.supersedes.title}</Link>
              </div>
            </Card>
          )}
          {e.supersededBy && (
            <Card className="p-3 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <GitBranch size={12} className="text-trevo-warning" />
                <span className="text-trevo-warning">Superseded by</span>
                <Link href={`/commons/${e.supersededBy.id}`} className="text-trevo-accent hover:underline">{e.supersededBy.title}</Link>
              </div>
            </Card>
          )}

          {/* Content */}
          <div className="mb-8">
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="text-trevo-text-secondary leading-relaxed whitespace-pre-wrap break-words">{e.content}</div>
            </div>
          </div>

          {/* Citations */}
          {e.citations && (e.citations as string[]).length > 0 && (
            <div className="mb-8">
              <SectionHeader title="Citations" />
              <div className="space-y-1">
                {(e.citations as string[]).map((cite, i) => (
                  <div key={i} className="text-xs text-trevo-text-muted font-mono">
                    [{i + 1}] {cite}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
