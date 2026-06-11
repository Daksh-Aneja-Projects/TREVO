"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  Button, Input, Textarea, TierBadge, Card, SectionHeader, Skeleton,
} from "@/components/ui";
import { VERTICALS } from "@/lib/utils";
import { Settings, Shield, Save } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const profile = trpc.trust.getMyProfile.useQuery(undefined, { enabled: !!session });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [verticals, setVerticals] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.displayName || "");
      setBio(profile.data.bio || "");
      setVerticals(profile.data.domainVerticals || []);
    }
  }, [profile.data]);

  const toggleVertical = (v: string) =>
    setVerticals(verticals.includes(v) ? verticals.filter((x) => x !== v) : verticals.length < 5 ? [...verticals, v] : verticals);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Button variant="primary" onClick={() => router.push("/login")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-sm text-trevo-text-secondary mt-1">Manage your TREVO profile</p>
          </div>

          {profile.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-32" />
              <Skeleton className="h-20" />
            </div>
          ) : profile.data ? (
            <>
              {/* Profile Info */}
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader title="Profile" />
                  <TierBadge tier={profile.data.tier as "SEED"} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Username</label>
                    <div className="text-sm font-heading font-semibold text-trevo-accent">@{profile.data.username}</div>
                  </div>
                  <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
                  <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about yourself..." className="min-h-[100px]" maxLength={500} />
                </div>
              </Card>

              {/* Domain Verticals */}
              <Card className="p-6 mb-6">
                <SectionHeader title="Domain Verticals" />
                <p className="text-xs text-trevo-text-secondary mb-3">Select up to 5 verticals to personalize your feed and recommendations.</p>
                <div className="flex flex-wrap gap-2">
                  {VERTICALS.map((v) => (
                    <button key={v.slug} onClick={() => toggleVertical(v.slug)}
                      className={`text-xs font-heading font-medium px-3 py-1.5 rounded-md border transition-colors ${
                        verticals.includes(v.slug)
                          ? "border-trevo-accent bg-trevo-accent/10 text-trevo-accent"
                          : "border-trevo-border text-trevo-text-secondary hover:border-trevo-border-hover"
                      }`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Trust Stats */}
              <Card className="p-6 mb-6">
                <SectionHeader title="Trust Overview" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Trust Score", value: Math.round(profile.data.trustScore) },
                    { label: "Rep Points", value: profile.data.reputationPoints },
                    { label: "Proofs", value: profile.data._count?.proofs || 0 },
                    { label: "Agents", value: profile.data._count?.agents || 0 },
                  ].map((stat) => (
                    <div key={stat.label} className="p-3 border border-trevo-border rounded-lg bg-trevo-surface-2">
                      <div className="font-mono text-lg font-bold text-trevo-accent tabular-nums">{stat.value}</div>
                      <div className="text-[10px] font-mono text-trevo-text-muted uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Save */}
              <div className="flex items-center gap-3">
                <Button variant="primary" className="gap-1.5" onClick={() => setSaved(true)}>
                  <Save size={14} /> Save Changes
                </Button>
                {saved && (
                  <span className="text-sm text-trevo-success animate-fade-in">Changes saved!</span>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
}
