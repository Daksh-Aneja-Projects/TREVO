"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import {
  TierBadge, TrustScoreBadge, ReputationTimeline, StatusBadge,
  Button, Skeleton, EmptyState, Card, SectionHeader, PageHeader,
} from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { FileCheck, Target, Layers, Shield, ArrowUpRight, Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const profile = trpc.trust.getMyProfile.useQuery(undefined, { enabled: !!session });
  const myProofs = trpc.archive.getMyProofs.useQuery({ limit: 5 }, { enabled: !!session });
  const myClaims = trpc.problems.getMyClaims.useQuery(undefined, { enabled: !!session });
  const pendingValidations = trpc.archive.getPendingValidations.useQuery(undefined, { enabled: !!session });

  if (!session) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
        <EmptyState icon={Shield} title="Sign in required" description="Please sign in to access your dashboard."
          action={<Button variant="primary" onClick={() => router.push("/login")}>Sign In</Button>}
        />
      </div>
    );
  }

  const user = profile.data;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {profile.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          <Skeleton className="h-32" />
        </div>
      ) : user ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="min-w-0">
              <h1 className="font-display text-3xl md:text-4xl font-bold truncate">
                Welcome back, <span className="text-trevo-accent">@{user.username}</span>
              </h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Your command center for trust and reputation</p>
            </div>
            <TrustScoreBadge score={user.trustScore} tier={user.tier as "SEED"} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Trust Score", value: Math.round(user.trustScore), icon: Shield, color: "text-trevo-accent" },
              { label: "Rep. Points", value: user.reputationPoints, icon: ArrowUpRight, color: "text-trevo-success" },
              { label: "Total Proofs", value: user._count?.proofs ?? 0, icon: FileCheck, color: "text-trevo-text-secondary" },
              { label: "Active Claims", value: myClaims.data?.length ?? 0, icon: Target, color: "text-trevo-warning" },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 glow-card">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon size={16} className={`${stat.color} shrink-0`} />
                </div>
                <div className={`font-mono text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value.toLocaleString()}</div>
                <div className="text-[10px] font-mono text-trevo-text-muted uppercase tracking-wider mt-1">{stat.label}</div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant="primary" size="sm" onClick={() => router.push("/archive?action=submit")}>
              <Plus size={14} /> Submit Proof
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/problems?action=post")}>
              <Target size={14} /> Post Problem
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/registry?action=register")}>
              <Layers size={14} /> Register Agent
            </Button>
          </div>

          {user.reputationTimeline && user.reputationTimeline.length >= 2 && (
            <div className="mb-8">
              <SectionHeader title="Reputation Timeline" />
              <ReputationTimeline
                data={user.reputationTimeline.map((t: any) => ({
                  delta: t.delta,
                  snapshot: t.snapshot,
                  createdAt: t.createdAt.toString(),
                }))}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <SectionHeader title="Recent Proofs" />
              {myProofs.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : !myProofs.data?.length ? (
                <Card className="p-6 text-center"><p className="text-sm text-trevo-text-muted">No proofs submitted yet</p></Card>
              ) : (
                <div className="space-y-2">
                  {myProofs.data.map((p: any) => (
                    <Link key={p.id} href={`/archive/${p.id}`} className="block">
                      <Card className="p-3 hover:border-trevo-border-hover transition-colors cursor-pointer">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <StatusBadge status={p.type} />
                            <span className="text-sm font-heading truncate min-w-0">{p.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={p.validationStatus} />
                            <span className="text-[10px] font-mono text-trevo-text-muted whitespace-nowrap">{formatRelative(p.createdAt)}</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionHeader title="Pending Validations" />
              {pendingValidations.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : !pendingValidations.data?.length ? (
                <Card className="p-6 text-center"><p className="text-sm text-trevo-text-muted">No pending validations</p></Card>
              ) : (
                <div className="space-y-2">
                  {pendingValidations.data.map((p: any) => (
                    <Link key={p.id} href={`/archive/${p.id}`} className="block">
                      <Card className="p-3 hover:border-trevo-border-hover transition-colors cursor-pointer animate-border-glow">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <span className="text-sm font-heading truncate min-w-0 flex-1">{p.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-trevo-warning whitespace-nowrap">{p.validationCount} val.</span>
                            <span className="w-2 h-2 rounded-full bg-trevo-warning animate-pulse-accent shrink-0" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
