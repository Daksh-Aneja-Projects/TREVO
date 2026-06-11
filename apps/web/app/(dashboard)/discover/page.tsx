"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  StatusBadge, DomainBadge, TierBadge, Button, Skeleton, EmptyState, Card,
  ProblemCard, AgentCard,
} from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { Compass, FileCheck, Target, Archive, Vote, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function DiscoverPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const feed = trpc.discover.getFeed.useQuery({}, { enabled: !!session });
  const recommended = trpc.discover.getRecommendedProblems.useQuery({} as any, { enabled: !!session });
  const recommendedAgents = trpc.discover.getRecommendedAgents.useQuery({} as any);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center flex-1">
          <EmptyState icon={Compass} title="Sign in to discover" description="Get personalized recommendations based on your domain verticals."
            action={<Button variant="primary" onClick={() => router.push("/login")}>Sign In</Button>}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const feedItems = (feed.data as any)?.items || feed.data || [];
  const problems = recommended.data || [];
  const agents = recommendedAgents.data || [];

  const FEED_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    proof: FileCheck, problem: Target, commons: Archive, vote: Vote,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Discover</h1>
            <p className="text-sm text-trevo-text-secondary mt-1">Personalized feed based on your verticals and activity</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Main Feed */}
            <div>
              <h2 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider mb-3">Activity Feed</h2>
              {feed.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : feedItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-trevo-text-muted">No feed activity yet. Start by claiming a problem or submitting a proof.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {feedItems.map((item: any, i: number) => {
                    const Icon = FEED_ICONS[item.feedType] || FileCheck;
                    const d = item.data;
                    return (
                      <motion.div key={item.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
                        <Card className="p-3 hover:border-trevo-border-hover transition-colors cursor-pointer"
                          onClick={() => {
                            if (item.feedType === "proof") router.push(`/archive/${item.id}`);
                            else if (item.feedType === "problem") router.push(`/problems/${item.id}`);
                            else if (item.feedType === "commons") router.push(`/commons/${item.id}`);
                            else if (item.feedType === "vote") router.push(`/council/${item.id}`);
                          }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-trevo-surface-2 flex items-center justify-center shrink-0">
                              <Icon size={14} className="text-trevo-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-mono uppercase text-trevo-accent tracking-wider">{item.feedType}</span>
                                {d.domainVertical && <DomainBadge vertical={d.domainVertical} />}
                              </div>
                              <span className="text-sm font-heading truncate block">{d.title || d.name || "Untitled"}</span>
                              <div className="flex items-center gap-2 text-[10px] text-trevo-text-muted mt-0.5">
                                {d.builder?.username && <span>@{d.builder.username}</span>}
                                {d.author?.username && <span>@{d.author.username}</span>}
                                <span>{formatRelative(item.createdAt)}</span>
                              </div>
                            </div>
                            {d.validationStatus && <StatusBadge status={d.validationStatus} />}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Recommended Problems */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider">For You</h3>
                  <Link href="/problems" className="text-[10px] font-mono text-trevo-accent hover:underline flex items-center gap-1">
                    All <ArrowUpRight size={10} />
                  </Link>
                </div>
                {recommended.isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : problems.length === 0 ? (
                  <Card className="p-4 text-center"><p className="text-xs text-trevo-text-muted">No recommended problems</p></Card>
                ) : (
                  <div className="space-y-2">
                    {problems.slice(0, 5).map((p: any) => (
                      <Link key={p.id} href={`/problems/${p.id}`}>
                        <Card className="p-3 hover:border-trevo-border-hover transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <DomainBadge vertical={p.domainVertical} />
                            <span className={`text-[10px] font-mono ${p.difficulty === "EXPERT" ? "text-trevo-danger" : p.difficulty === "ESTABLISHED" ? "text-trevo-warning" : "text-trevo-text-muted"}`}>
                              {p.difficulty}
                            </span>
                          </div>
                          <span className="text-sm font-heading truncate block">{p.title}</span>
                          <span className="text-[10px] font-mono text-trevo-accent">+{p.reputationReward} rep</span>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Agents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider">Top Agents</h3>
                  <Link href="/registry" className="text-[10px] font-mono text-trevo-accent hover:underline flex items-center gap-1">
                    Registry <ArrowUpRight size={10} />
                  </Link>
                </div>
                {recommendedAgents.isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : agents.length === 0 ? (
                  <Card className="p-4 text-center"><p className="text-xs text-trevo-text-muted">No agents yet</p></Card>
                ) : (
                  <div className="space-y-2">
                    {agents.slice(0, 5).map((a: any) => (
                      <Link key={a.id} href={`/registry/${a.slug}`}>
                        <Card className="p-3 hover:border-trevo-border-hover transition-colors cursor-pointer">
                          <span className="text-sm font-heading truncate block">{a.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-trevo-text-muted mt-0.5">
                            <span className="text-trevo-accent font-mono">{Math.round(a.trustScore)} trust</span>
                            <span>{Math.round(a.successRate * 100)}% success</span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
