"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  TierBadge, DomainBadge, StatusBadge, TrustScoreBadge, ContextViewer,
  Button, Skeleton, EmptyState, Card, SectionHeader, VerifiedBadge,
  ContactButton, BookButton, AuthGateModal, EnquiryComposer, Modal,
} from "@/components/ui";
import { formatDate, getVertical } from "@/lib/utils";
import { Layers, ExternalLink, GitFork, ChevronRight, FileCheck, Globe, Play, Code } from "lucide-react";
import { motion } from "framer-motion";

export default function AgentProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const agent = trpc.registry.getAgent.useQuery({ slug });
  const listing = trpc.marketplace.getListing.useQuery({ slug }, { retry: false });
  const trackView = trpc.marketplace.trackView.useMutation();
  const submitEnquiry = trpc.enquiry.sendEnquiry.useMutation();

  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  const handleContact = () => {
    if (!session?.user) { setShowAuthGate(true); return; }
    setShowEnquiry(true);
  };

  const handleBook = () => {
    if (!session?.user) { setShowAuthGate(true); return; }
    setShowBooking(true);
  };

  const handleSendEnquiry = (data: { subject: string; body: string }) => {
    if (!listing.data) return;
    submitEnquiry.mutate({
      listingId: listing.data.id,
      recipientId: listing.data.ownerId,
      subject: data.subject,
      body: data.body,
    }, {
      onSuccess: () => { setShowEnquiry(false); setEnquirySent(true); },
    });
  };

  if (agent.isLoading && listing.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 space-y-4 flex-1">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Footer />
      </div>
    );
  }

  const a = agent.data;
  const l = listing.data;
  const caps = a ? (Array.isArray(a.capabilities) ? a.capabilities as string[] : []) : (l ? l.capabilities as string[] : []);
  const ioContract = a?.ioContract as { inputs?: { name: string; type: string; required?: boolean }[]; outputs?: { name: string; type: string }[] } | null;
  const contextBlob = a?.contextBlob as Record<string, unknown> | null;

  if (!a && !l) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-8 flex-1">
          <EmptyState icon={Layers} title="Agent not found" description="This agent doesn't exist or has been deprecated." />
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = l?.name || a?.name || slug;
  const displayDesc = l?.description || a?.description || "";
  const ownerData = l?.owner || a?.owner;
  const isVerified = l?.listingStatus === "VERIFIED";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-trevo-text-muted mb-6">
            <Link href="/registry" className="hover:text-trevo-text transition-colors">Registry</Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="truncate">/{slug}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {a && <StatusBadge status={a.status} />}
                {l && <StatusBadge status={l.listingStatus} />}
                {isVerified && <VerifiedBadge />}
                {a && <span className="text-xs font-mono text-trevo-text-muted shrink-0 whitespace-nowrap">v{a.version}</span>}
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold truncate">{displayName}</h1>
              {l?.tagline && <p className="text-sm text-trevo-text-secondary mt-1">{l.tagline}</p>}
              <p className="text-sm font-mono text-trevo-text-muted">/{slug}</p>
            </div>
            <div className="text-right shrink-0">
              {a && (
                <>
                  <TrustScoreBadge score={a.trustScore} tier={a.trustScore >= 2000 ? "SOVEREIGN" : a.trustScore >= 500 ? "TRUSTED" : a.trustScore >= 100 ? "PROVEN" : "SEED"} />
                  <div className="text-xs font-mono text-trevo-text-muted mt-1 tabular-nums">{Math.round(a.successRate * 100)}% success rate</div>
                </>
              )}
            </div>
          </div>

          {/* Owner + Stats */}
          <div className="flex items-center gap-4 text-sm text-trevo-text-secondary mb-6 flex-wrap">
            {ownerData && (
              <Link href={`/builders/${ownerData.username}`} className="flex items-center gap-1.5 hover:text-trevo-accent transition-colors min-w-0">
                <span className="truncate">@{ownerData.username}</span>
                <TierBadge tier={(ownerData.tier || "SEED") as "SEED"} size="xs" />
              </Link>
            )}
            {a && <span className="text-trevo-text-muted whitespace-nowrap">{a.totalProofs} proofs</span>}
            {l?._count && <span className="text-trevo-text-muted whitespace-nowrap">{l._count.enquiries} enquiries</span>}
            {l?._count && <span className="text-trevo-text-muted whitespace-nowrap">{l._count.bookings} bookings</span>}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <ContactButton onClick={handleContact} />
            <BookButton onClick={handleBook} />
            {l?.websiteUrl && (
              <a href={l.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="md" className="gap-1.5"><Globe size={14} /> Website</Button>
              </a>
            )}
            {l?.demoUrl && (
              <a href={l.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="md" className="gap-1.5"><Play size={14} /> Demo</Button>
              </a>
            )}
            {l?.repoUrl && (
              <a href={l.repoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="md" className="gap-1.5"><Code size={14} /> Repo</Button>
              </a>
            )}
          </div>

          {/* Enquiry success */}
          {enquirySent && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 border border-trevo-success/20 bg-trevo-success/5 rounded-lg text-sm text-trevo-success flex items-center gap-2">
              <FileCheck size={14} /> Enquiry sent! Check your inbox for their reply.
            </motion.div>
          )}

          {/* Enquiry Composer */}
          {showEnquiry && ownerData && (
            <div className="mb-8">
              <EnquiryComposer
                recipientName={ownerData.username}
                listingName={displayName}
                onSubmit={handleSendEnquiry}
                onCancel={() => setShowEnquiry(false)}
                loading={submitEnquiry.isPending}
              />
            </div>
          )}

          {/* Description */}
          <p className="text-trevo-text-secondary leading-relaxed mb-6 break-words">{displayDesc}</p>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {caps.map((cap) => (
              <span key={cap} className="text-xs font-mono px-2 py-0.5 border border-trevo-border bg-trevo-surface-2 text-trevo-text-secondary whitespace-nowrap rounded">
                {cap}
              </span>
            ))}
          </div>

          {/* Domain verticals */}
          {l?.domainVerticals && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {(l.domainVerticals as string[]).map((v) => <DomainBadge key={v} vertical={v} />)}
            </div>
          )}

          {/* Use Cases */}
          {l?.useCases && Array.isArray(l.useCases) && (l.useCases as any[]).length > 0 && (
            <div className="mb-8">
              <SectionHeader title="Use Cases" />
              <div className="grid md:grid-cols-2 gap-3">
                {(l.useCases as { title: string; description: string }[]).map((uc, i) => (
                  <Card key={i} className="p-4">
                    <h4 className="font-heading font-semibold text-sm mb-1">{uc.title}</h4>
                    <p className="text-xs text-trevo-text-secondary leading-relaxed">{uc.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* IO Contract */}
          {ioContract && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card className="p-4">
                <h3 className="font-heading text-sm font-semibold mb-3">Inputs</h3>
                {ioContract.inputs && ioContract.inputs.length > 0 ? (
                  <div className="space-y-2">
                    {ioContract.inputs.map((input, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs min-w-0">
                        <span className="font-mono text-trevo-accent shrink-0">{input.name}</span>
                        <span className="font-mono text-trevo-text-muted shrink-0">:{input.type}</span>
                        {input.required && <span className="text-trevo-danger text-[10px] shrink-0">required</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-trevo-text-muted">No inputs defined</p>
                )}
              </Card>
              <Card className="p-4">
                <h3 className="font-heading text-sm font-semibold mb-3">Outputs</h3>
                {ioContract.outputs && ioContract.outputs.length > 0 ? (
                  <div className="space-y-2">
                    {ioContract.outputs.map((output, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs min-w-0">
                        <span className="font-mono text-trevo-accent shrink-0">{output.name}</span>
                        <span className="font-mono text-trevo-text-muted shrink-0">:{output.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-trevo-text-muted">No outputs defined</p>
                )}
              </Card>
            </div>
          )}

          {/* Context */}
          {contextBlob && Object.keys(contextBlob).length > 0 && (
            <div className="mb-8">
              <SectionHeader title="Context" />
              <ContextViewer context={contextBlob as { coreCapabilities?: string[] }} />
            </div>
          )}

          {/* Fork info */}
          {a?.forkedFrom && (
            <Card className="p-3 mb-6">
              <div className="flex items-center gap-2 text-xs min-w-0">
                <GitFork size={12} className="text-trevo-text-muted shrink-0" />
                <span className="text-trevo-text-muted shrink-0">Forked from</span>
                <Link href={`/registry/${a.forkedFrom.slug}`} className="text-trevo-accent hover:underline truncate">
                  {a.forkedFrom.name}
                </Link>
              </div>
            </Card>
          )}

          {/* Recent Proofs */}
          {a?.recentProofs && a.recentProofs.length > 0 && (
            <div className="mb-8">
              <SectionHeader title="Recent Proofs" />
              <div className="space-y-2">
                {a.recentProofs.map((p: any) => (
                  <Link key={p.id} href={`/archive/${p.id}`} className="block">
                    <Card className="p-3 hover:border-trevo-border-hover transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <StatusBadge status={p.type} />
                          <span className="text-sm font-heading truncate min-w-0">{p.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={p.validationStatus} />
                          <span className="text-[10px] font-mono text-trevo-text-muted whitespace-nowrap">{formatDate(p.createdAt)}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Assets gallery */}
          {l?.assets && l.assets.length > 0 && (
            <div className="mb-8">
              <SectionHeader title="Assets" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {l.assets.map((asset: any) => (
                  <div key={asset.id} className="border border-trevo-border rounded-lg overflow-hidden bg-trevo-surface-2">
                    <img src={asset.url} alt={asset.type} className="w-full h-32 object-cover" />
                    <div className="p-2 text-[10px] font-mono text-trevo-text-muted">{asset.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {a && (
              <Button variant="secondary" size="sm">
                <GitFork size={14} /> Fork Agent
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthGateModal open={showAuthGate} onClose={() => setShowAuthGate(false)} />
      <Footer />
    </div>
  );
}
