"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  StatusBadge, TierBadge, DomainBadge, Button, Skeleton, EmptyState,
  Card, SectionHeader, AuthGateModal,
} from "@/components/ui";
import { formatDate, formatRelative, getVertical } from "@/lib/utils";
import { Target, ChevronRight, Clock, Trophy, Shield, User, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [showAuthGate, setShowAuthGate] = useState(false);

  const problem = trpc.problems.getProblem.useQuery({ id });
  const claimMutation = trpc.problems.claimProblem.useMutation({
    onSuccess: () => problem.refetch(),
  });
  const releaseMutation = trpc.problems.releaseProblem.useMutation({
    onSuccess: () => problem.refetch(),
  });

  if (problem.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!problem.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1">
          <EmptyState icon={Target} title="Problem not found" description="This problem doesn't exist or has been removed." />
        </div>
        <Footer />
      </div>
    );
  }

  const p = problem.data;
  const isOwner = session?.user?.id === p.poster?.id;
  const isAssigned = session?.user?.id === p.assignedTo?.id;
  const canClaim = p.status === "OPEN" && !isOwner;

  const handleClaim = () => {
    if (!session?.user) { setShowAuthGate(true); return; }
    claimMutation.mutate({ problemId: p.id });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-trevo-text-muted mb-6">
            <Link href="/problems" className="hover:text-trevo-text transition-colors">Problems</Link>
            <ChevronRight size={12} />
            <span className="truncate">{p.title.slice(0, 40)}...</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={p.status} />
              <DomainBadge vertical={p.domainVertical} />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                p.difficulty === "EXPERT" ? "border-trevo-danger/30 text-trevo-danger" :
                p.difficulty === "ESTABLISHED" ? "border-trevo-warning/30 text-trevo-warning" :
                "border-trevo-border text-trevo-text-muted"
              }`}>
                {p.difficulty}
              </span>
              {p.requiredTier !== "SEED" && <TierBadge tier={p.requiredTier as "SEED"} size="xs" />}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">{p.title}</h1>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-trevo-text-secondary mb-6 flex-wrap">
            <Link href={`/builders/${p.poster?.username}`} className="flex items-center gap-1.5 hover:text-trevo-accent transition-colors">
              <User size={12} /> @{p.poster?.username}
              {p.poster?.tier && <TierBadge tier={p.poster.tier as "SEED"} size="xs" />}
            </Link>
            <span className="flex items-center gap-1">
              <Trophy size={12} className="text-trevo-accent" />
              <span className="font-mono font-semibold text-trevo-accent">+{p.reputationReward} rep</span>
            </span>
            {p.monetaryReward && p.monetaryReward > 0 && (
              <span className="font-mono font-semibold text-trevo-success">${p.monetaryReward}</span>
            )}
            {p.deadline && (
              <span className="flex items-center gap-1 text-trevo-text-muted">
                <Clock size={12} /> Due {formatDate(p.deadline)}
              </span>
            )}
            <span className="text-trevo-text-muted">Posted {formatRelative(p.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-8">
            {canClaim && (
              <Button variant="primary" onClick={handleClaim} disabled={claimMutation.isPending}>
                {claimMutation.isPending ? "Claiming..." : "Claim This Problem"}
              </Button>
            )}
            {isAssigned && p.status === "ACTIVE" && (
              <>
                <Button variant="primary" onClick={() => router.push(`/archive?action=submit&problemId=${p.id}`)}>
                  Submit Solution
                </Button>
                <Button variant="ghost" onClick={() => releaseMutation.mutate({ problemId: p.id })}
                  disabled={releaseMutation.isPending}>
                  Release
                </Button>
              </>
            )}
          </div>

          {/* Assigned To */}
          {p.assignedTo && (
            <Card className="p-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-trevo-accent" />
                <span className="text-trevo-text-muted">Claimed by</span>
                <Link href={`/builders/${p.assignedTo.username}`} className="text-trevo-accent hover:underline font-medium">
                  @{p.assignedTo.username}
                </Link>
                {p.assignedAgent && (
                  <>
                    <span className="text-trevo-text-muted">using</span>
                    <Link href={`/registry/${p.assignedAgent.slug}`} className="text-trevo-accent hover:underline">
                      {p.assignedAgent.name}
                    </Link>
                  </>
                )}
                {p.claimedAt && <span className="text-[10px] font-mono text-trevo-text-muted ml-auto">{formatRelative(p.claimedAt)}</span>}
              </div>
            </Card>
          )}

          {/* Description */}
          <div className="mb-8">
            <SectionHeader title="Description" />
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-trevo-text-secondary leading-relaxed whitespace-pre-wrap">{p.description}</p>
            </div>
          </div>

          {/* Linked Proof */}
          {p.proof && (
            <div className="mb-8">
              <SectionHeader title="Submitted Solution" />
              <Link href={`/archive/${p.proof.id}`}>
                <Card className="p-4 hover:border-trevo-border-hover transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StatusBadge status={p.proof.validationStatus} />
                      <span className="font-heading font-semibold text-sm truncate">{p.proof.title}</span>
                    </div>
                    <span className="text-xs font-mono text-trevo-text-muted">{p.proof.validationCount} validations</span>
                  </div>
                </Card>
              </Link>
            </div>
          )}
        </div>
      </div>
      <AuthGateModal open={showAuthGate} onClose={() => setShowAuthGate(false)} />
      <Footer />
    </div>
  );
}
