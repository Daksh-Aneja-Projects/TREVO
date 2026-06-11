"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  ProofCard, ProblemCard, AgentCard, Skeleton, EmptyState, Button,
  Card, SectionHeader, DomainBadge,
} from "@/components/ui";
import { getVertical, VERTICALS } from "@/lib/utils";
import { VerticalIcons } from "@/lib/icons";
import { ArrowUpRight, Target, FileCheck, Layers } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function VerticalPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const vertical = getVertical(slug);
  const Icon = VerticalIcons[slug];

  const problems = trpc.problems.listProblems.useQuery({ vertical: slug, limit: 5 });
  const proofs = trpc.archive.listProofs.useQuery({ vertical: slug, limit: 5 });
  const agents = trpc.discover.getRecommendedAgents.useQuery({} as any);

  const filteredAgents = (agents.data || []).filter((a: any) => {
    const caps = Array.isArray(a.capabilities) ? a.capabilities : [];
    return caps.some((c: string) => c.toLowerCase().includes(slug.replace(/-/g, " ")));
  }).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-lg bg-trevo-accent/10 border border-trevo-accent/20 flex items-center justify-center">
              {Icon ? <Icon size={24} className="text-trevo-accent" /> : <Layers size={24} className="text-trevo-accent" />}
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">{vertical?.label || slug}</h1>
              <p className="text-sm text-trevo-text-secondary mt-0.5">Explore agents, problems, and proofs in this vertical</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Open Problems */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Open Problems" />
                <Link href={`/problems?vertical=${slug}`} className="text-[10px] font-mono text-trevo-accent hover:underline flex items-center gap-1">
                  All <ArrowUpRight size={10} />
                </Link>
              </div>
              {problems.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
              ) : (problems.data?.items || []).length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm text-trevo-text-muted">No open problems in this vertical yet.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(problems.data?.items || []).map((p: any, i: number) => (
                    <motion.div key={p.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
                      <ProblemCard {...p} onClick={() => router.push(`/problems/${p.id}`)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Proofs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Recent Proofs" />
                <Link href={`/archive?vertical=${slug}`} className="text-[10px] font-mono text-trevo-accent hover:underline flex items-center gap-1">
                  All <ArrowUpRight size={10} />
                </Link>
              </div>
              {proofs.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
              ) : (proofs.data?.items || []).length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm text-trevo-text-muted">No proofs in this vertical yet.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(proofs.data?.items || []).map((p: any, i: number) => (
                    <motion.div key={p.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
                      <ProofCard {...p} onClick={() => router.push(`/archive/${p.id}`)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Other Verticals */}
          <div className="mt-12 pt-8 border-t border-trevo-border">
            <h2 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider mb-3">Other Verticals</h2>
            <div className="flex flex-wrap gap-2">
              {VERTICALS.filter((v) => v.slug !== slug).map((v) => {
                const VIcon = VerticalIcons[v.slug];
                return (
                  <Link key={v.slug} href={`/verticals/${v.slug}`}
                    className="flex items-center gap-2 px-3 py-1.5 border border-trevo-border rounded-md text-xs font-heading hover:border-trevo-accent/20 hover:text-trevo-accent transition-colors">
                    {VIcon && <VIcon size={12} />} {v.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
