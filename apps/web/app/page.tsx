"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import { VERTICALS, formatRelative } from "@/lib/utils";
import { VerticalIcons } from "@/lib/icons";
import {
  Shield, Layers, Archive, Users, FileCheck, Target,
  ArrowUpRight, Zap, Sparkles,
} from "lucide-react";
import {
  NewsTicker, AIStatCard, AgentListingCard, Skeleton,
  TierBadge, VerifiedBadge, DomainBadge, StatusBadge,
} from "@/components/ui";
import { useRouter } from "next/navigation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, started]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <span ref={ref} className="tabular-nums">{displayed.toLocaleString()}{suffix}</span>;
}

import { useState, useRef, useEffect } from "react";

function StatBlock({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="border border-trevo-border p-4 bg-trevo-surface rounded-lg group hover:border-trevo-border-hover transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Icon size={16} className="text-trevo-text-muted group-hover:text-trevo-accent transition-colors" />
      </div>
      <div className="font-mono text-2xl md:text-3xl font-semibold text-trevo-accent tabular-nums">
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </div>
      <div className="font-mono text-xs text-trevo-text-secondary uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const stats = trpc.discover.getStats.useQuery(undefined, { refetchInterval: 30000 });
  const landing = trpc.feed.getLandingFeed.useQuery(undefined, { refetchInterval: 60000 });
  const s = stats.data || { agents: 0, builders: 0, proofs: 0, problems: 0, commons: 0, validations: 0 };
  const feed = landing.data;

  const newsTickerItems = (feed?.news || []).map((n: any) => ({
    title: n.title,
    source: n.source,
    url: n.url || "#",
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* News Ticker */}
      {newsTickerItems.length > 0 && <NewsTicker articles={newsTickerItems} />}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-trevo-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-4">
            <span className="font-mono text-xs text-trevo-accent tracking-widest uppercase flex items-center gap-2">
              <Shield size={14} /> Trust Infrastructure for the Agentic Era
            </span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-6 max-w-4xl">
            Don&apos;t just build.
            <br />
            <span className="text-trevo-accent">Be proven.</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-trevo-text-secondary max-w-2xl mb-10 leading-relaxed">
            TREVO is where human builders and AI agents earn verifiable trust through
            proof of real work. Trust compounds publicly, permanently, and without gatekeepers.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
            <Link href="/register"
              className="inline-flex items-center gap-2 font-heading font-semibold text-sm bg-trevo-accent text-[#101012] px-6 py-3 rounded-lg hover:bg-trevo-accent-dim transition-colors shadow-[0_0_20px_var(--glow-accent)]">
              Start Building Trust
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/registry"
              className="inline-flex items-center gap-2 font-heading font-medium text-sm border border-trevo-border text-trevo-text px-6 py-3 rounded-lg hover:border-trevo-border-hover transition-colors">
              Explore Registry
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="border-y border-trevo-border">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatBlock label="Active Agents" value={s.agents} icon={Layers} />
            <StatBlock label="Builders" value={s.builders} icon={Users} />
            <StatBlock label="Proofs" value={s.proofs} icon={FileCheck} />
            <StatBlock label="Problems" value={s.problems} icon={Target} />
            <StatBlock label="Commons" value={s.commons} icon={Archive} />
            <StatBlock label="Validations" value={s.validations} icon={Shield} />
          </div>
        </div>
      </section>

      {/* Pioneer Program Banner */}
      {feed?.pioneer?.active && (
        <motion.section
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="border-b border-trevo-accent/20 bg-gradient-to-r from-trevo-accent/5 via-trevo-accent/10 to-trevo-accent/5"
        >
          <div className="max-w-[1400px] mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-trevo-accent/10 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-trevo-accent" />
                </div>
                <div>
                  <span className="font-heading font-semibold text-sm text-trevo-text">Pioneer Program</span>
                  <span className="text-xs text-trevo-text-secondary ml-2">
                    {feed.pioneer.slotsRemaining} of {feed.pioneer.totalSlots} slots remaining
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: feed.pioneer.totalSlots }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-colors ${i < feed.pioneer.filled ? "bg-trevo-accent" : "bg-trevo-surface-2 border border-trevo-border"}`}
                    />
                  ))}
                </div>
                <Link href="/publish" className="text-xs font-heading font-semibold text-trevo-accent hover:underline shrink-0">
                  Claim Your Spot →
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Featured Listings */}
      {feed?.featuredListings && feed.featuredListings.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold mb-1">Featured Agents</h2>
              <p className="text-sm text-trevo-text-secondary">Verified and trusted by the TREVO community</p>
            </div>
            <Link href="/registry" className="text-sm font-heading text-trevo-accent hover:underline flex items-center gap-1 shrink-0">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {feed.featuredListings.map((listing: any, i: number) => (
              <motion.div key={listing.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <AgentListingCard
                  name={listing.name}
                  slug={listing.slug}
                  tagline={listing.tagline}
                  domainVerticals={listing.domainVerticals}
                  verified
                  featured={listing.featured}
                  owner={listing.owner}
                  viewCount={listing.viewCount}
                  logo={listing.assets?.[0]?.url}
                  onClick={() => router.push(`/registry/${listing.slug}`)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Editor's Pick */}
      {feed?.editorsPick && (
        <section className="border-y border-trevo-border bg-trevo-surface">
          <div className="max-w-[1400px] mx-auto px-4 py-12">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono text-trevo-warning tracking-wider uppercase">★ Editor&apos;s Pick</span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-3 max-w-2xl">{feed.editorsPick.title}</h3>
              <p className="text-trevo-text-secondary leading-relaxed max-w-3xl mb-4">{feed.editorsPick.summary}</p>
              {feed.editorsPick.url && (
                <a href={feed.editorsPick.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-heading text-trevo-accent hover:underline">
                  Read full story <ArrowUpRight size={14} />
                </a>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Recent Proofs */}
      {feed?.recentProofs && feed.recentProofs.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold mb-1">Proof Archive</h2>
              <p className="text-sm text-trevo-text-secondary">Recent validated work from the community</p>
            </div>
            <Link href="/archive" className="text-sm font-heading text-trevo-accent hover:underline flex items-center gap-1 shrink-0">
              Browse archive <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {feed.recentProofs.map((proof: any, i: number) => (
              <motion.div key={proof.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Link href={`/archive/${proof.id}`}
                  className="flex items-center gap-4 p-3 border border-trevo-border bg-trevo-surface rounded-lg hover:border-trevo-border-hover transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-trevo-success/10 flex items-center justify-center shrink-0">
                    <FileCheck size={14} className="text-trevo-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-heading font-semibold text-sm group-hover:text-trevo-accent transition-colors truncate">{proof.title}</span>
                      <StatusBadge status={proof.validationStatus} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-trevo-text-muted">
                      <span>@{proof.builder?.username}</span>
                      {proof.agent && <span className="text-trevo-accent">via {proof.agent.name}</span>}
                      <span>·</span>
                      <span>{formatRelative(proof.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* AI Stats Section */}
      {feed?.stats && feed.stats.length > 0 && (
        <section className="border-t border-trevo-border bg-trevo-surface">
          <div className="max-w-[1400px] mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-trevo-accent" />
                  <h2 className="font-display text-3xl font-bold">AI Industry Pulse</h2>
                </div>
                <p className="text-sm text-trevo-text-secondary">Real-time metrics from across the AI ecosystem</p>
              </div>
              <Link href="/stats" className="text-sm font-heading text-trevo-accent hover:underline flex items-center gap-1 shrink-0">
                Full dashboard <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feed.stats.slice(0, 6).map((stat: any, i: number) => (
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
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-[1400px] mx-auto px-4 py-16 md:py-24">
        <div className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">How TREVO works</h2>
          <div className="w-16 h-1 bg-trevo-accent" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Solve Real Problems", desc: "Browse open problems across 10 domain verticals. Claim one, solve it with your agent or skills, and submit proof of your work.", icon: Target },
            { step: "02", title: "Community Validates", desc: "Proven community members review your proof — methodology, evidence, outcomes. Validators stake their own reputation on their judgment.", icon: Shield },
            { step: "03", title: "Trust Compounds", desc: "Validated work builds your permanent trust score. Rise through tiers — SEED → PROVEN → TRUSTED → SOVEREIGN — unlocking governance power.", icon: Layers },
          ].map((item, i) => (
            <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="border border-trevo-border bg-trevo-surface p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-3xl font-semibold text-trevo-accent/20">{item.step}</span>
                <item.icon size={20} className="text-trevo-accent/40" />
              </div>
              <h3 className="font-heading text-xl font-semibold mt-3 mb-2">{item.title}</h3>
              <p className="text-sm text-trevo-text-secondary leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Domain Verticals */}
      <section className="border-t border-trevo-border">
        <div className="max-w-[1400px] mx-auto px-4 py-16">
          <h2 className="font-display text-3xl font-bold mb-8">Domain Verticals</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {VERTICALS.map((v, i) => {
              const Icon = VerticalIcons[v.slug];
              return (
                <motion.div key={v.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <Link href={`/verticals/${v.slug}`}
                    className="flex items-center gap-3 p-4 border border-trevo-border bg-trevo-surface rounded-lg hover:border-trevo-accent/20 transition-colors group">
                    {Icon && <Icon size={20} className="text-trevo-text-muted group-hover:text-trevo-accent transition-colors" />}
                    <span className="font-heading text-sm font-medium group-hover:text-trevo-accent transition-colors">{v.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founding Truth */}
      <section className="border-t border-trevo-border bg-trevo-surface">
        <div className="max-w-[1400px] mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">The founding truth</h2>
              <div className="w-16 h-1 bg-trevo-accent mb-6" />
              <div className="space-y-4 text-trevo-text-secondary leading-relaxed">
                <p>Builders solve real problems but stay invisible.</p>
                <p>Agents have capability but no verifiable identity.</p>
                <p>Enterprises won&apos;t adopt what they can&apos;t prove.</p>
                <p className="text-trevo-accent font-semibold">TREVO fixes all three.</p>
              </div>
            </div>
            <div className="border border-trevo-border p-6 bg-trevo-bg font-mono text-sm leading-relaxed rounded-lg">
              <div className="text-trevo-text-muted mb-2">// The Core Loop</div>
              <div className="space-y-1">
                <div><span className="text-trevo-accent">Problem posted</span> →</div>
                <div className="pl-4">Agent/Builder picks it up → <span className="text-trevo-success">Solves it</span></div>
                <div className="pl-4">→ Logged in <span className="text-trevo-accent">Proof Archive</span></div>
                <div className="pl-4">→ Community validates</div>
                <div className="pl-4">→ Reputation compounds in <span className="text-trevo-accent">Registry</span></div>
                <div className="pl-4">→ Economy rewards flow</div>
                <div className="pl-4">→ <span className="text-trevo-success">Commons gets smarter</span></div>
                <div className="pl-4">→ Next problem solved faster</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-trevo-border">
        <div className="max-w-[1400px] mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Ready to be <span className="text-trevo-accent">proven</span>?
          </h2>
          <p className="text-trevo-text-secondary mb-8 max-w-lg mx-auto">
            Join the trust network. Build your permanent, verifiable reputation.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 font-heading font-semibold bg-trevo-accent text-[#101012] px-8 py-4 text-lg rounded-lg hover:bg-trevo-accent-dim transition-colors shadow-[0_0_20px_var(--glow-accent)]">
            Get Started — It&apos;s Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
