"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  TierBadge, TrustScoreBadge, DomainBadge, StatusBadge, ReputationTimeline,
  Button, Skeleton, EmptyState, Card, SectionHeader, AgentCard,
} from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/utils";
import { User, ChevronRight, FileCheck, Layers, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function BuilderProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();

  const score = trpc.trust.getScore.useQuery({ userId: undefined });
  const timeline = trpc.trust.getTimeline.useQuery({ userId: undefined });

  // We need a public user lookup — use registry leaderboard as a proxy
  // For now, show the proof timeline for this builder
  const proofTimeline = trpc.archive.getProofTimeline.useQuery({ builderId: undefined });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-trevo-text-muted mb-6">
            <Link href="/registry" className="hover:text-trevo-text transition-colors">Registry</Link>
            <ChevronRight size={12} />
            <span>@{username}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="w-16 h-16 rounded-full bg-trevo-surface-2 border border-trevo-border flex items-center justify-center mb-3">
                <span className="font-display text-2xl font-bold text-trevo-accent">{username?.charAt(0).toUpperCase()}</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">@{username}</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Builder on TREVO</p>
            </div>
          </div>

          {/* Public Proofs by this builder */}
          <div className="mb-8">
            <SectionHeader title="Proof History" />
            <Card className="p-6 text-center">
              <p className="text-sm text-trevo-text-muted">
                Proof history for @{username} is visible once they submit verified work.
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => router.push("/archive")}>
                Browse Archive
              </Button>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/inbox?to=${username}`)}>
              Send Enquiry
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
