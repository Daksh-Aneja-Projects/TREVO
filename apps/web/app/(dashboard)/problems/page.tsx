"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  ProblemCard, Skeleton, EmptyState, Button, SearchInput, TabBar,
  TierBadge, DomainBadge,
} from "@/components/ui";
import { VERTICALS, formatRelative } from "@/lib/utils";
import { VerticalIcons } from "@/lib/icons";
import { Target, Plus } from "lucide-react";
import { motion } from "framer-motion";

type Status = "OPEN" | "ACTIVE" | "VALIDATING" | "RESOLVED" | "DISPUTED";
type Difficulty = "SEED" | "ESTABLISHED" | "EXPERT";

export default function ProblemsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("OPEN");
  const [vertical, setVertical] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");

  const problems = trpc.problems.listProblems.useQuery({
    status: status !== "ALL" ? (status as Status) : undefined,
    vertical: vertical || undefined,
    difficulty: difficulty ? (difficulty as Difficulty) : undefined,
  });

  const items = problems.data?.items || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Problem Board</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Real problems posted by real people — solve them, earn trust</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => router.push("/problems?action=post")} className="gap-1.5">
              <Plus size={14} /> Post Problem
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-3 mb-6">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["ALL", "OPEN", "ACTIVE", "VALIDATING", "RESOLVED", "DISPUTED"].map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border whitespace-nowrap transition-colors ${
                    status === s
                      ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                      : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setVertical("")}
                className={`text-[10px] font-mono px-2 py-1 border transition-colors ${!vertical ? "border-trevo-accent text-trevo-accent" : "border-trevo-border text-trevo-text-muted"}`}>
                All Verticals
              </button>
              {VERTICALS.map((v) => {
                const Icon = VerticalIcons[v.slug];
                return (
                  <button key={v.slug} onClick={() => setVertical(v.slug)}
                    className={`text-[10px] font-mono px-2 py-1 border flex items-center gap-1 transition-colors ${
                      vertical === v.slug ? "border-trevo-accent text-trevo-accent" : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                    }`}>
                    {Icon && <Icon size={10} />} {v.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1.5">
              {["", "SEED", "ESTABLISHED", "EXPERT"].map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`text-[10px] font-mono font-medium px-2.5 py-1 rounded-md border transition-colors ${
                    difficulty === d
                      ? "border-trevo-accent bg-trevo-accent/8 text-trevo-accent"
                      : "border-trevo-border text-trevo-text-muted hover:border-trevo-border-hover"
                  }`}>
                  {d || "Any Difficulty"}
                </button>
              ))}
            </div>
          </div>

          {/* Problems List */}
          {problems.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Target} title="No problems found" description="Try adjusting your filters or post the first problem." />
          ) : (
            <div className="space-y-3">
              {items.map((problem: any, i: number) => (
                <motion.div key={problem.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <ProblemCard
                    title={problem.title}
                    domainVertical={problem.domainVertical}
                    difficulty={problem.difficulty}
                    status={problem.status}
                    reputationReward={problem.reputationReward}
                    monetaryReward={problem.monetaryReward}
                    deadline={problem.deadline}
                    poster={problem.poster}
                    onClick={() => router.push(`/problems/${problem.id}`)}
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
