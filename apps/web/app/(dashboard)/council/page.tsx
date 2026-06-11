"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  GovernanceVoteCard, Skeleton, EmptyState, Button, Card,
} from "@/components/ui";
import { Vote, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function CouncilPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("ACTIVE");

  const votes = trpc.council.listVotes.useQuery({
    status: status !== "ALL" ? (status as "ACTIVE" | "PASSED" | "REJECTED" | "WITHDRAWN") : undefined,
  });

  const items = votes.data?.items || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Governance Council</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Community decisions that shape the TREVO ecosystem</p>
            </div>
          </div>

          <div className="flex gap-1.5 mb-6 flex-wrap">
            {["ALL", "ACTIVE", "PASSED", "REJECTED", "WITHDRAWN"].map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${
                  status === s ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                  : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                }`}>
                {s}
              </button>
            ))}
          </div>

          {votes.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Vote} title="No votes found" description="Try a different status filter." />
          ) : (
            <div className="space-y-3">
              {items.map((vote: any, i: number) => (
                <motion.div key={vote.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <GovernanceVoteCard
                    title={vote.title}
                    type={vote.type}
                    status={vote.status}
                    endsAt={vote.endsAt}
                    ballotCount={vote._count?.ballots || 0}
                    onClick={() => router.push(`/council/${vote.id}`)}
                  />
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
