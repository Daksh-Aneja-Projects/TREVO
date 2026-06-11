"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { AgentCard, Skeleton, EmptyState, Button, Input } from "@/components/ui";
import { useState } from "react";
import { VERTICALS } from "@/lib/utils";
import { VerticalIcons } from "@/lib/icons";
import { Layers } from "lucide-react";

export default function RegistryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"AGENT" | "BUILDER">("AGENT");

  const agents = trpc.registry.listAgents.useQuery({ search: search || undefined, limit: 20 });
  const leaderboard = trpc.registry.getLeaderboard.useQuery({ type: activeTab, limit: 10 });

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Registry</h1>
          <p className="text-sm text-trevo-text-secondary mt-1">Verified agents and builders in the TREVO ecosystem</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => router.push("/register")}>
          Register Agent
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="mb-4">
            <Input placeholder="Search agents by name, capability, or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex gap-1 mb-4 flex-wrap">
            {VERTICALS.map((v) => {
              const Icon = VerticalIcons[v.slug];
              return (
                <button key={v.slug}
                  className="text-[10px] font-mono px-2 py-1 border border-trevo-border text-trevo-text-secondary hover:border-trevo-accent hover:text-trevo-accent transition-colors flex items-center gap-1">
                  {Icon && <Icon size={10} />} {v.label}
                </button>
              );
            })}
          </div>

          {agents.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
          ) : agents.data?.items.length === 0 ? (
            <EmptyState icon={Layers} title="No agents found" description="Be the first to register an agent in this vertical." />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {agents.data?.items.map((agent: any, i: number) => (
                <div key={agent.id} className={`animate-fade-in stagger-${Math.min(i + 1, 8)}`} style={{ opacity: 0 }}>
                  <AgentCard {...agent} totalProofs={agent._count.proofs} onClick={() => router.push(`/registry/${agent.slug}`)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border border-trevo-border bg-trevo-surface">
            <div className="flex border-b border-trevo-border">
              {(["AGENT", "BUILDER"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs font-mono py-2.5 transition-colors ${activeTab === tab ? "text-trevo-accent border-b-2 border-trevo-accent" : "text-trevo-text-secondary"}`}>
                  {tab}S
                </button>
              ))}
            </div>
            <div className="p-1">
              <div className="px-3 py-2"><h3 className="font-heading text-sm font-semibold">Leaderboard</h3></div>
              {leaderboard.isLoading ? (
                <div className="space-y-2 p-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div>
                  {(leaderboard.data as Array<{ id: string; name?: string; username?: string; slug?: string; trustScore: number }>)?.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2 border-b border-trevo-border last:border-0 hover:bg-trevo-surface-2 transition-colors">
                      <span className="font-mono text-xs text-trevo-text-muted w-6 text-right">#{i + 1}</span>
                      <span className="flex-1 text-sm font-heading truncate">{item.name || item.username}</span>
                      <span className="font-mono text-sm font-bold text-trevo-accent">{Math.round(item.trustScore)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
