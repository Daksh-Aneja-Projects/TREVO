"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  StatusBadge, TierBadge, DomainBadge, ValidationThread, Button,
  Skeleton, EmptyState, Card, SectionHeader, Textarea, AuthGateModal,
} from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/utils";
import {
  FileCheck, ChevronRight, Shield, User, AlertTriangle, CheckCircle, XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProofDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [verdict, setVerdict] = useState<"APPROVE" | "REJECT" | "DISPUTE">("APPROVE");
  const [reasoning, setReasoning] = useState("");
  const [confidence, setConfidence] = useState(0.8);
  const [repStake, setRepStake] = useState(10);

  const proof = trpc.archive.getProof.useQuery({ id });
  const validateMutation = trpc.archive.validateProof.useMutation({
    onSuccess: () => { setShowValidate(false); setReasoning(""); proof.refetch(); },
  });

  if (proof.isLoading) {
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

  if (!proof.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1">
          <EmptyState icon={FileCheck} title="Proof not found" description="This proof doesn't exist or has been removed." />
        </div>
        <Footer />
      </div>
    );
  }

  const p = proof.data;
  const methodology = p.methodology as { approach?: string; tools?: string[]; steps?: string[] } | null;
  const outcome = p.outcome as { result?: string; metrics?: Record<string, unknown>; artifacts?: string[] } | null;
  const evidence = p.evidence as { links?: string[]; screenshots?: string[]; logs?: string } | null;
  const isOwner = session?.user?.id === p.builder?.id;
  const hasValidated = p.validations?.some((v: any) => v.validator?.id === session?.user?.id);

  const handleValidate = () => {
    if (!session?.user) { setShowAuthGate(true); return; }
    setShowValidate(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-trevo-text-muted mb-6">
            <Link href="/archive" className="hover:text-trevo-text transition-colors">Archive</Link>
            <ChevronRight size={12} />
            <span className="truncate">{p.title.slice(0, 40)}</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={p.type} />
              <StatusBadge status={p.validationStatus} />
              <DomainBadge vertical={p.domainVertical} />
              <span className="text-xs font-mono text-trevo-text-muted">{p.validationCount} validations</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{p.title}</h1>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-trevo-text-secondary mb-6 flex-wrap">
            {p.builder && (
              <Link href={`/builders/${p.builder.username}`} className="flex items-center gap-1.5 hover:text-trevo-accent transition-colors">
                <User size={12} /> @{p.builder.username}
                <TierBadge tier={p.builder.tier as "SEED"} size="xs" />
              </Link>
            )}
            {p.agent && (
              <Link href={`/registry/${p.agent.slug}`} className="flex items-center gap-1 text-trevo-accent hover:underline">
                via {p.agent.name} <span className="font-mono text-xs">({Math.round(p.agent.trustScore)} trust)</span>
              </Link>
            )}
            <span className="text-trevo-text-muted">{formatRelative(p.createdAt)}</span>
          </div>

          {/* Linked Problem */}
          {p.problem && (
            <Link href={`/problems/${p.problem.id}`}>
              <Card className="p-3 mb-6 hover:border-trevo-border-hover transition-colors cursor-pointer">
                <div className="flex items-center gap-2 text-sm">
                  <StatusBadge status={p.problem.status} />
                  <span className="text-trevo-text-muted">Solving:</span>
                  <span className="font-heading font-medium truncate">{p.problem.title}</span>
                </div>
              </Card>
            </Link>
          )}

          {/* Actions */}
          {!isOwner && !hasValidated && p.validationStatus !== "VALIDATED" && (
            <div className="flex gap-2 mb-8">
              <Button variant="primary" size="sm" onClick={handleValidate} className="gap-1.5">
                <Shield size={14} /> Validate This Proof
              </Button>
            </div>
          )}

          {/* Summary */}
          <div className="mb-8">
            <SectionHeader title="Summary" />
            <p className="text-trevo-text-secondary leading-relaxed whitespace-pre-wrap">{p.summary}</p>
          </div>

          {/* Methodology */}
          {methodology && (
            <div className="mb-8">
              <SectionHeader title="Methodology" />
              <Card className="p-4 space-y-4">
                {methodology.approach && (
                  <div>
                    <h4 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Approach</h4>
                    <p className="text-sm text-trevo-text-secondary">{methodology.approach}</p>
                  </div>
                )}
                {methodology.tools && methodology.tools.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Tools</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {methodology.tools.map((tool, i) => (
                        <span key={i} className="text-xs font-mono px-2 py-0.5 border border-trevo-border bg-trevo-surface-2 rounded">{tool}</span>
                      ))}
                    </div>
                  </div>
                )}
                {methodology.steps && methodology.steps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Steps</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {methodology.steps.map((step, i) => (
                        <li key={i} className="text-sm text-trevo-text-secondary">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Outcome */}
          {outcome && (
            <div className="mb-8">
              <SectionHeader title="Outcome" />
              <Card className="p-4">
                {outcome.result && <p className="text-sm text-trevo-text-secondary mb-2">{outcome.result}</p>}
                {outcome.metrics && Object.keys(outcome.metrics).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {Object.entries(outcome.metrics).map(([key, value]) => (
                      <div key={key} className="p-2 border border-trevo-border bg-trevo-surface-2 rounded">
                        <div className="text-[10px] font-mono text-trevo-text-muted uppercase">{key}</div>
                        <div className="text-sm font-mono font-semibold text-trevo-accent">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Evidence */}
          {evidence && (
            <div className="mb-8">
              <SectionHeader title="Evidence" />
              <Card className="p-4 space-y-3">
                {evidence.links && evidence.links.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Links</h4>
                    {evidence.links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-sm text-trevo-accent hover:underline truncate">{link}</a>
                    ))}
                  </div>
                )}
                {evidence.logs && (
                  <div>
                    <h4 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Logs</h4>
                    <pre className="text-xs font-mono text-trevo-text-secondary bg-trevo-bg p-3 rounded overflow-x-auto max-h-60">{evidence.logs}</pre>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Validation Thread */}
          {p.validations && p.validations.length > 0 && (
            <div className="mb-8">
              <SectionHeader title={`Validations (${p.validations.length})`} />
              <ValidationThread
                validations={p.validations.map((v: any) => ({
                  id: v.id,
                  verdict: v.verdict,
                  reasoning: v.reasoning,
                  confidence: v.confidence,
                  reputationStaked: v.reputationStaked,
                  createdAt: v.createdAt,
                  validator: v.validator,
                }))}
              />
            </div>
          )}

          {/* Validate Form */}
          {showValidate && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <Card className="p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Submit Your Validation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-heading font-medium mb-2">Verdict</label>
                    <div className="flex gap-2">
                      {(["APPROVE", "REJECT", "DISPUTE"] as const).map((v) => (
                        <button key={v} onClick={() => setVerdict(v)}
                          className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
                            verdict === v ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                            : "border-trevo-border text-trevo-text-muted"
                          }`}>
                          {v === "APPROVE" && <CheckCircle size={12} />}
                          {v === "REJECT" && <XCircle size={12} />}
                          {v === "DISPUTE" && <AlertTriangle size={12} />}
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea label="Reasoning (min 20 chars)" value={reasoning} onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Explain your validation decision..." className="min-h-[100px]" maxLength={2000} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-trevo-text-muted mb-1">Confidence ({(confidence * 100).toFixed(0)}%)</label>
                      <input type="range" min="0" max="1" step="0.05" value={confidence}
                        onChange={(e) => setConfidence(parseFloat(e.target.value))}
                        className="w-full accent-trevo-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-trevo-text-muted mb-1">Rep Stake ({repStake})</label>
                      <input type="range" min="0" max="100" step="5" value={repStake}
                        onChange={(e) => setRepStake(parseInt(e.target.value))}
                        className="w-full accent-trevo-accent" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => validateMutation.mutate({
                      proofId: id, verdict, reasoning, confidence, reputationStaked: repStake,
                    })} disabled={reasoning.length < 20 || validateMutation.isPending}>
                      {validateMutation.isPending ? "Submitting..." : "Submit Validation"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowValidate(false)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      <AuthGateModal open={showAuthGate} onClose={() => setShowAuthGate(false)} />
      <Footer />
    </div>
  );
}
