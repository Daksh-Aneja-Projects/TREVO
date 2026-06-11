"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  StatusBadge, TierBadge, Button, Skeleton, EmptyState, Card,
  SectionHeader, Textarea, AuthGateModal,
} from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/utils";
import { Vote, ChevronRight, User, CheckCircle, XCircle, MinusCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function VoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [choice, setChoice] = useState<"YES" | "NO" | "ABSTAIN">("YES");

  const vote = trpc.council.getVote.useQuery({ id });
  const castBallot = trpc.council.castBallot.useMutation({
    onSuccess: () => { setReasoning(""); vote.refetch(); },
  });

  if (vote.isLoading) {
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

  if (!vote.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1">
          <EmptyState icon={Vote} title="Vote not found" />
        </div>
        <Footer />
      </div>
    );
  }

  const v = vote.data;
  const yesCount = v.ballots?.filter((b: any) => b.choice === "YES").length || 0;
  const noCount = v.ballots?.filter((b: any) => b.choice === "NO").length || 0;
  const totalVotes = v.ballots?.length || 0;
  const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 0;
  const isActive = v.status === "ACTIVE" && new Date(v.endsAt) > new Date();
  const myBallot = v.ballots?.find((b: any) => b.voter?.id === session?.user?.id);

  const handleCastBallot = () => {
    if (!session?.user) { setShowAuthGate(true); return; }
    castBallot.mutate({ voteId: id, choice, reasoning: reasoning || undefined });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-xs font-mono text-trevo-text-muted mb-6">
            <Link href="/council" className="hover:text-trevo-text transition-colors">Council</Link>
            <ChevronRight size={12} />
            <span className="truncate">{v.title.slice(0, 40)}</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={v.status} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-trevo-text-muted border border-trevo-border px-2 py-0.5 rounded">{v.type}</span>
              <span className="flex items-center gap-1 text-xs text-trevo-text-muted">
                <Clock size={10} />
                {isActive ? `Ends ${formatRelative(v.endsAt)}` : `Ended ${formatDate(v.endsAt)}`}
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{v.title}</h1>
          </div>

          <div className="flex items-center gap-3 text-sm text-trevo-text-secondary mb-6">
            <Link href={`/builders/${v.proposer?.username}`} className="flex items-center gap-1.5 hover:text-trevo-accent transition-colors">
              <User size={12} /> @{v.proposer?.username}
              {v.proposer?.tier && <TierBadge tier={v.proposer.tier as "SEED"} size="xs" />}
            </Link>
            <span className="text-trevo-text-muted">Threshold: {(v.threshold * 100).toFixed(0)}%</span>
          </div>

          {/* Vote Tally */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-trevo-success">YES: {yesCount}</span>
              <span className="text-xs font-mono text-trevo-text-muted">{totalVotes} total</span>
              <span className="text-xs font-mono text-trevo-danger">NO: {noCount}</span>
            </div>
            <div className="w-full h-3 bg-trevo-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-trevo-success rounded-full transition-all" style={{ width: `${yesPercent}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-mono text-trevo-text-muted">{yesPercent.toFixed(0)}%</span>
              <span className="text-[10px] font-mono text-trevo-text-muted">threshold: {(v.threshold * 100).toFixed(0)}%</span>
            </div>
          </Card>

          <div className="mb-8">
            <SectionHeader title="Description" />
            <p className="text-trevo-text-secondary leading-relaxed whitespace-pre-wrap">{v.description}</p>
          </div>

          {/* Cast Ballot */}
          {isActive && !myBallot && (
            <Card className="p-6 mb-8">
              <h3 className="font-heading font-semibold text-lg mb-4">Cast Your Ballot</h3>
              <div className="flex gap-2 mb-4">
                {(["YES", "NO", "ABSTAIN"] as const).map((c) => (
                  <button key={c} onClick={() => setChoice(c)}
                    className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
                      choice === c ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                      : "border-trevo-border text-trevo-text-muted"
                    }`}>
                    {c === "YES" && <CheckCircle size={12} />}
                    {c === "NO" && <XCircle size={12} />}
                    {c === "ABSTAIN" && <MinusCircle size={12} />}
                    {c}
                  </button>
                ))}
              </div>
              <Textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)}
                placeholder="Optional reasoning..." className="mb-4 min-h-[80px]" maxLength={2000} />
              <Button variant="primary" onClick={handleCastBallot} disabled={castBallot.isPending}>
                {castBallot.isPending ? "Submitting..." : "Submit Ballot"}
              </Button>
            </Card>
          )}

          {myBallot && (
            <Card className="p-4 mb-8 border-trevo-accent/20">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} className="text-trevo-accent" />
                <span>You voted <strong className="text-trevo-accent">{myBallot.choice}</strong></span>
              </div>
            </Card>
          )}

          {/* Ballots */}
          {v.ballots && v.ballots.length > 0 && (
            <div>
              <SectionHeader title={`Ballots (${v.ballots.length})`} />
              <div className="space-y-2">
                {v.ballots.map((b: any) => (
                  <Card key={b.id} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-mono font-semibold ${
                          b.choice === "YES" ? "text-trevo-success" : b.choice === "NO" ? "text-trevo-danger" : "text-trevo-text-muted"
                        }`}>{b.choice}</span>
                        <span className="text-sm">@{b.voter?.username}</span>
                        {b.voter?.tier && <TierBadge tier={b.voter.tier as "SEED"} size="xs" />}
                      </div>
                      <span className="text-[10px] font-mono text-trevo-text-muted">{formatRelative(b.createdAt)}</span>
                    </div>
                    {b.reasoning && <p className="text-xs text-trevo-text-secondary mt-2">{b.reasoning}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <AuthGateModal open={showAuthGate} onClose={() => setShowAuthGate(false)} />
      <Footer />
    </div>
  );
}
