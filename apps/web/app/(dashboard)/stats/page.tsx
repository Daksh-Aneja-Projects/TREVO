"use client";

import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import { AIStatCard, Skeleton, EmptyState } from "@/components/ui";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function StatsPage() {
  const statsData = trpc.feed.getStats.useQuery(undefined, { refetchInterval: 60000 });
  const platformStats = trpc.discover.getStats.useQuery(undefined, { refetchInterval: 30000 });

  const metrics = statsData.data?.metrics || [];
  const marketPulse = statsData.data?.marketPulse;
  const ps = platformStats.data || { agents: 0, builders: 0, proofs: 0, problems: 0, commons: 0, validations: 0 };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Stats Dashboard</h1>
            <p className="text-sm text-trevo-text-secondary mt-1">Real-time metrics from TREVO and the AI ecosystem</p>
          </div>

          {/* Platform Stats */}
          <div className="mb-8">
            <h2 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider mb-3">TREVO Platform</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Active Agents", value: ps.agents },
                { label: "Builders", value: ps.builders },
                { label: "Proofs", value: ps.proofs },
                { label: "Problems", value: ps.problems },
                { label: "Commons", value: ps.commons },
                { label: "Validations", value: ps.validations },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                  className="border border-trevo-border bg-trevo-surface rounded-lg p-4">
                  <div className="font-mono text-2xl font-bold text-trevo-accent tabular-nums">{stat.value.toLocaleString()}</div>
                  <div className="text-[10px] font-mono text-trevo-text-muted uppercase tracking-wider mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Market Pulse */}
          {marketPulse && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="border border-trevo-border bg-trevo-surface rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-trevo-accent">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span className="text-[10px] font-mono text-trevo-accent tracking-widest uppercase">Market Pulse</span>
              </div>
              <p className="text-sm text-trevo-text-secondary leading-relaxed">{marketPulse}</p>
            </motion.div>
          )}

          {/* AI Industry Metrics */}
          <div>
            <h2 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider mb-3">AI Industry Metrics</h2>
            {statsData.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : metrics.length === 0 ? (
              <EmptyState icon={BarChart3} title="No metrics available" description="AI industry stats will appear here once data is collected." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((stat: any, i: number) => (
                  <motion.div key={stat.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                    <AIStatCard
                      metric={stat.metric}
                      value={stat.value}
                      unit={stat.unit}
                      delta={stat.delta}
                      deltaPercent={stat.deltaPercent}
                      trend30d={stat.trend30d}
                      keyInsight={stat.keyInsight}
                      source={stat.source}
                      sourceUrl={stat.sourceUrl}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
