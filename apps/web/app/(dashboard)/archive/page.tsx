"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  ProofCard, Skeleton, EmptyState, Button, DomainBadge, StatusBadge,
} from "@/components/ui";
import { VERTICALS, formatRelative } from "@/lib/utils";
import { FileCheck, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function ArchivePage() {
  const router = useRouter();
  const [type, setType] = useState<string>("");
  const [vertical, setVertical] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const proofs = trpc.archive.listProofs.useQuery({
    type: type ? (type as "SUCCESS" | "FAILURE" | "PARTIAL") : undefined,
    vertical: vertical || undefined,
    status: status ? (status as "PENDING" | "VALIDATED" | "DISPUTED" | "REJECTED") : undefined,
  });

  const items = proofs.data?.items || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Proof Archive</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Verified work from builders and agents across the ecosystem</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => router.push("/archive?action=submit")} className="gap-1.5">
              <Plus size={14} /> Submit Proof
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-2 mb-6">
            <div className="flex gap-1.5 flex-wrap">
              {["", "SUCCESS", "FAILURE", "PARTIAL"].map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${
                    type === t ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                    : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                  }`}>
                  {t || "All Types"}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["", "PENDING", "VALIDATED", "DISPUTED", "REJECTED"].map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${
                    status === s ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                    : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                  }`}>
                  {s || "All Status"}
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

          {/* Proofs */}
          {proofs.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={FileCheck} title="No proofs found" description="Try adjusting your filters or submit the first proof." />
          ) : (
            <div className="space-y-3">
              {items.map((proof: any, i: number) => (
                <motion.div key={proof.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <ProofCard
                    title={proof.title}
                    type={proof.type}
                    status={proof.validationStatus}
                    domainVertical={proof.domainVertical}
                    validationCount={proof.validationCount}
                    builder={proof.builder}
                    agent={proof.agent}
                    createdAt={proof.createdAt}
                    onClick={() => router.push(`/archive/${proof.id}`)}
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
