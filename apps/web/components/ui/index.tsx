"use client";

import { cn } from "@/lib/utils";
import { VerticalIcons, type LucideIcon } from "@/lib/icons";
import {
  FileCheck, Target, BookOpen, ArrowUpRight, ArrowDownRight,
  ChevronDown, AlertTriangle, Clock, Shield,
} from "lucide-react";
import { useEffect, useState, useRef, type ReactNode } from "react";

type TierType = "SEED" | "PROVEN" | "TRUSTED" | "SOVEREIGN";

const tierConfig: Record<TierType, { label: string; color: string; bg: string }> = {
  SEED: { label: "SEED", color: "text-trevo-text-muted", bg: "bg-trevo-surface-2" },
  PROVEN: { label: "PROVEN", color: "text-trevo-accent", bg: "bg-trevo-accent/8" },
  TRUSTED: { label: "TRUSTED", color: "text-trevo-success", bg: "bg-trevo-success/8" },
  SOVEREIGN: { label: "SOVEREIGN", color: "text-trevo-warning", bg: "bg-trevo-warning/8" },
};

export function TierBadge({ tier, size = "sm" }: { tier: TierType; size?: "xs" | "sm" | "md" }) {
  const config = tierConfig[tier];
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 leading-tight rounded",
    sm: "text-xs px-2 py-0.5 leading-tight rounded",
    md: "text-sm px-3 py-1 leading-tight rounded-md",
  };

  return (
    <span className={cn(
      "font-mono font-medium tracking-wide inline-flex items-center whitespace-nowrap shrink-0",
      config.color, config.bg, sizeClasses[size]
    )}>
      {config.label}
    </span>
  );
}

export function TrustScoreBadge({ score, tier, animated = true }: { score: number; tier: TierType; animated?: boolean }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className={cn("font-mono text-2xl font-bold tabular-nums leading-none", animated && "animate-count-up")}>
        {Math.round(score).toLocaleString()}
      </div>
      <TierBadge tier={tier} size="sm" />
    </div>
  );
}

export function DomainBadge({ vertical }: { vertical: string }) {
  const Icon = VerticalIcons[vertical];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded bg-trevo-surface-2 text-trevo-text-secondary whitespace-nowrap shrink-0">
      {Icon && <Icon size={12} strokeWidth={1.5} className="shrink-0" />}
      <span className="truncate max-w-[100px]">{vertical.toUpperCase().replace("-", " ")}</span>
    </span>
  );
}

type ProofStatus = "PENDING" | "VALIDATED" | "DISPUTED" | "REJECTED";
type ProofType = "SUCCESS" | "FAILURE" | "PARTIAL";

const statusConfig: Record<ProofStatus, { color: string; label: string }> = {
  PENDING: { color: "text-trevo-warning", label: "Pending" },
  VALIDATED: { color: "text-trevo-success", label: "Validated" },
  DISPUTED: { color: "text-trevo-danger", label: "Disputed" },
  REJECTED: { color: "text-trevo-danger", label: "Rejected" },
};

const typeConfig: Record<ProofType, { color: string; bg: string }> = {
  SUCCESS: { color: "text-trevo-success", bg: "bg-trevo-success/8" },
  FAILURE: { color: "text-trevo-danger", bg: "bg-trevo-danger/8" },
  PARTIAL: { color: "text-trevo-warning", bg: "bg-trevo-warning/8" },
};

export function ProofCard({
  title, type, status, validationCount, domainVertical, createdAt, builder, agent, onClick,
}: {
  title: string;
  type: ProofType;
  status: ProofStatus;
  validationCount: number;
  domainVertical: string;
  createdAt: string;
  builder?: { username: string; avatar?: string | null };
  agent?: { name: string; slug: string } | null;
  onClick?: () => void;
}) {
  const tc = typeConfig[type];
  const sc = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-trevo-border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={cn("text-xs font-mono px-2 py-0.5 rounded inline-flex items-center gap-1 shrink-0", tc.color, tc.bg)}>
          <FileCheck size={10} className="shrink-0" /> {type}
        </span>
        <span className={cn("text-xs font-mono flex items-center gap-1.5 shrink-0", sc.color)}>
          {status === "PENDING" && <span className="w-1.5 h-1.5 rounded-full bg-trevo-warning animate-pulse-accent inline-block shrink-0" />}
          {sc.label}
        </span>
      </div>
      <h3 className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors mb-2 line-clamp-2 break-words leading-snug">
        {title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-trevo-text-secondary font-mono overflow-hidden">
        {builder && <span className="truncate max-w-[80px] shrink-0">@{builder.username}</span>}
        {agent && (
          <span className="text-trevo-accent flex items-center gap-0.5 shrink-0 truncate max-w-[100px]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            <span className="truncate">{agent.name}</span>
          </span>
        )}
        <span className="text-trevo-text-muted shrink-0">·</span>
        <span className="truncate">{domainVertical}</span>
        <span className="text-trevo-text-muted shrink-0">·</span>
        <span className="shrink-0 whitespace-nowrap">{validationCount} val.</span>
      </div>
    </button>
  );
}

export function AgentCard({
  name, slug, description, capabilities, trustScore, successRate, totalProofs, owner, onClick,
}: {
  name: string;
  slug: string;
  description: string;
  capabilities: unknown;
  trustScore: number;
  successRate: number;
  totalProofs: number;
  owner: { username: string; avatar?: string | null; tier?: TierType };
  onClick?: () => void;
}) {
  const caps = Array.isArray(capabilities) ? capabilities as string[] : [];

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-trevo-border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors truncate">{name}</h3>
          <p className="text-xs font-mono text-trevo-text-muted truncate">/{slug}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-lg font-bold text-trevo-accent leading-none tabular-nums">{Math.round(trustScore)}</div>
          <div className="text-[10px] font-mono text-trevo-text-muted mt-0.5 tabular-nums">{Math.round(successRate * 100)}%</div>
        </div>
      </div>
      <p className="text-sm text-trevo-text-secondary mb-3 line-clamp-2 break-words leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {caps.slice(0, 4).map((cap) => (
          <span key={cap} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-trevo-surface-2 text-trevo-text-muted whitespace-nowrap">{cap}</span>
        ))}
        {caps.length > 4 && <span className="text-[10px] font-mono text-trevo-text-muted shrink-0">+{caps.length - 4}</span>}
      </div>
      <div className="flex items-center justify-between text-xs font-mono text-trevo-text-muted">
        <span className="truncate max-w-[120px]">@{owner.username}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums">{totalProofs} proofs</span>
      </div>
    </button>
  );
}

export function ProblemCard({
  title, domainVertical, difficulty, reputationReward, monetaryReward, status, deadline, poster, onClick,
}: {
  title: string;
  domainVertical: string;
  difficulty: "SEED" | "ESTABLISHED" | "EXPERT";
  reputationReward: number;
  monetaryReward?: number | null;
  status: string;
  deadline?: string | null;
  poster: { username: string; avatar?: string | null };
  onClick?: () => void;
}) {
  const diffColors = { SEED: "text-trevo-text-muted", ESTABLISHED: "text-trevo-accent", EXPERT: "text-trevo-warning" };

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-trevo-border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={cn("text-xs font-mono px-2 py-0.5 rounded inline-flex items-center gap-1 shrink-0", diffColors[difficulty])}>
          <Target size={10} className="shrink-0" /> {difficulty}
        </span>
        <div className="text-right shrink-0">
          <span className="font-mono text-sm font-semibold text-trevo-accent flex items-center gap-1 justify-end whitespace-nowrap tabular-nums">
            <ArrowUpRight size={12} className="shrink-0" />+{reputationReward}
          </span>
          {monetaryReward && <span className="block text-[10px] font-mono text-trevo-success whitespace-nowrap tabular-nums">${monetaryReward}</span>}
        </div>
      </div>
      <h3 className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors mb-2 line-clamp-2 break-words leading-snug">{title}</h3>
      <div className="flex items-center gap-2 text-xs text-trevo-text-secondary font-mono overflow-hidden">
        <span className="truncate">{domainVertical}</span>
        <span className="text-trevo-text-muted shrink-0">·</span>
        <span className="truncate max-w-[80px] shrink-0">@{poster.username}</span>
        {deadline && (
          <>
            <span className="text-trevo-text-muted shrink-0">·</span>
            <span className="text-trevo-warning flex items-center gap-0.5 shrink-0 whitespace-nowrap">
              <Clock size={10} className="shrink-0" />
              {new Date(deadline).toLocaleDateString()}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

export function GovernanceVoteCard({
  title, type, status, endsAt, ballotCount, yesPercentage, onClick,
}: {
  title: string;
  type: string;
  status: string;
  endsAt: string;
  ballotCount: number;
  yesPercentage?: number;
  onClick?: () => void;
}) {
  const daysLeft = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-trevo-border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3 overflow-hidden">
        <span className="text-xs font-mono px-2 py-0.5 rounded text-trevo-accent bg-trevo-accent/8 shrink-0 whitespace-nowrap">{type}</span>
        <span className={cn(
          "text-xs font-mono shrink-0",
          status === "ACTIVE" ? "text-trevo-success" : status === "PASSED" ? "text-trevo-accent" : "text-trevo-danger"
        )}>{status}</span>
      </div>
      <h3 className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors mb-3 line-clamp-2 break-words leading-snug">{title}</h3>
      {yesPercentage !== undefined && (
        <div className="mb-3">
          <div className="h-1 bg-trevo-surface-2 w-full rounded-full overflow-hidden">
            <div className="h-full bg-trevo-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, yesPercentage * 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-trevo-text-muted mt-1.5">
            <span>{Math.round(yesPercentage * 100)}% yes</span>
            <span>{ballotCount} votes</span>
          </div>
        </div>
      )}
      <div className="text-xs font-mono text-trevo-text-muted flex items-center gap-1 whitespace-nowrap">
        <Clock size={10} className="shrink-0" />
        {status === "ACTIVE" ? `${daysLeft}d remaining` : `Ended ${new Date(endsAt).toLocaleDateString()}`}
      </div>
    </button>
  );
}

export function CommonEntryCard({
  title, type, domainVertical, endorsements, qualityScore, author, onClick,
}: {
  title: string;
  type: string;
  domainVertical: string;
  endorsements: number;
  qualityScore: number;
  author?: { username: string; avatar?: string | null } | null;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-trevo-border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2 overflow-hidden">
        <span className="text-xs font-mono px-2 py-0.5 rounded text-trevo-text-secondary bg-trevo-surface-2 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <BookOpen size={10} className="shrink-0" /> {type.replace("_", " ")}
        </span>
        <span className="text-xs font-mono text-trevo-text-muted truncate">{domainVertical}</span>
      </div>
      <h3 className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors mb-2 line-clamp-2 break-words leading-snug">{title}</h3>
      <div className="flex items-center gap-3 text-xs font-mono text-trevo-text-muted overflow-hidden">
        {author && <span className="truncate max-w-[100px]">@{author.username}</span>}
        <span className="flex items-center gap-0.5 shrink-0 whitespace-nowrap tabular-nums"><ArrowUpRight size={10} className="shrink-0" /> {endorsements}</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums">Q: {qualityScore.toFixed(1)}</span>
      </div>
    </button>
  );
}

export function LeaderboardRow({
  rank, name, score, delta, avatar, href, onClick,
}: {
  rank: number;
  name: string;
  score: number;
  delta?: number;
  avatar?: string | null;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 border-b border-trevo-border hover:bg-trevo-surface-2/50 transition-colors text-left overflow-hidden">
      <span className="font-mono text-sm text-trevo-text-muted w-8 text-right shrink-0 tabular-nums">#{rank}</span>
      <div className="w-6 h-6 bg-trevo-surface-2 rounded-full flex items-center justify-center text-xs font-mono shrink-0 overflow-hidden">
        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover rounded-full" /> : name[0]?.toUpperCase()}
      </div>
      <span className="flex-1 font-heading text-sm font-medium text-trevo-text truncate min-w-0">{name}</span>
      <div className="text-right shrink-0">
        <span className="font-mono text-sm font-semibold text-trevo-accent tabular-nums">{score.toLocaleString()}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={cn("flex items-center gap-0.5 text-[10px] font-mono justify-end tabular-nums", delta > 0 ? "text-trevo-success" : "text-trevo-danger")}>
            {delta > 0 ? <ArrowUpRight size={8} className="shrink-0" /> : <ArrowDownRight size={8} className="shrink-0" />}
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer-loading rounded-lg", className)} />;
}

export function EmptyState({ icon: IconComponent, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-trevo-surface-2 mb-4 shrink-0">
        <IconComponent size={22} strokeWidth={1.5} className="text-trevo-text-muted" />
      </div>
      <h3 className="font-heading text-base font-semibold text-trevo-text mb-1.5">{title}</h3>
      <p className="text-sm text-trevo-text-secondary mb-4 max-w-sm break-words leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export function Button({
  children, variant = "primary", size = "md", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-trevo-accent text-[#101012] hover:bg-trevo-accent-dim font-semibold",
    secondary: "bg-trevo-surface-2 text-trevo-text border border-trevo-border hover:border-trevo-border-hover",
    ghost: "text-trevo-text-secondary hover:text-trevo-text hover:bg-trevo-surface-2",
    danger: "bg-trevo-danger/8 text-trevo-danger hover:bg-trevo-danger/12",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded",
    md: "text-sm px-4 py-2 rounded-md",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      className={cn(
        "font-heading font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className, label, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider block">{label}</label>}
      <input
        className={cn(
          "w-full bg-[var(--input-bg)] border border-trevo-border px-3 py-2 text-sm text-trevo-text rounded-md",
          "placeholder:text-trevo-text-muted focus:outline-none focus:border-trevo-accent/40 transition-colors",
          error && "border-trevo-danger/40",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-trevo-danger break-words">{error}</p>}
    </div>
  );
}

export function Textarea({
  className, label, error, ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider block">{label}</label>}
      <textarea
        className={cn(
          "w-full bg-[var(--input-bg)] border border-trevo-border px-3 py-2 text-sm text-trevo-text min-h-[100px] rounded-md",
          "placeholder:text-trevo-text-muted focus:outline-none focus:border-trevo-accent/40 transition-colors resize-y",
          error && "border-trevo-danger/40",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-trevo-danger break-words">{error}</p>}
    </div>
  );
}

export function Select({
  className, label, error, options, placeholder, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider block">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "w-full bg-[var(--input-bg)] border border-trevo-border px-3 py-2 text-sm text-trevo-text rounded-md",
            "focus:outline-none focus:border-trevo-accent/40 transition-colors appearance-none pr-8",
            error && "border-trevo-danger/40",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-trevo-text-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-trevo-danger break-words">{error}</p>}
    </div>
  );
}

export function ValidationThread({
  validations,
}: {
  validations: {
    id: string;
    verdict: "APPROVE" | "REJECT" | "DISPUTE";
    reasoning: string;
    confidence: number;
    reputationStaked: number;
    createdAt: string | Date;
    validator: { username: string; avatar?: string | null; tier: TierType; trustScore?: number };
  }[];
}) {
  const verdictStyles = {
    APPROVE: { color: "text-trevo-success", bg: "bg-trevo-success/5", border: "border-trevo-success/10", label: "Approved" },
    REJECT: { color: "text-trevo-danger", bg: "bg-trevo-danger/5", border: "border-trevo-danger/10", label: "Rejected" },
    DISPUTE: { color: "text-trevo-warning", bg: "bg-trevo-warning/5", border: "border-trevo-warning/10", label: "Disputed" },
  };

  if (validations.length === 0) {
    return (
      <div className="border border-dashed border-trevo-border rounded-lg p-8 text-center">
        <p className="text-sm text-trevo-text-muted">No validations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {validations.map((v) => {
        const style = verdictStyles[v.verdict];
        return (
          <div key={v.id} className={cn("border rounded-lg p-4 overflow-hidden", style.border, style.bg)}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("text-xs font-mono font-medium shrink-0", style.color)}>{style.label}</span>
                <span className="text-xs font-mono text-trevo-text-muted shrink-0">·</span>
                <span className="text-xs font-mono text-trevo-text-secondary truncate">@{v.validator.username}</span>
                <TierBadge tier={v.validator.tier} size="xs" />
              </div>
              <span className="text-[10px] font-mono text-trevo-text-muted shrink-0 whitespace-nowrap">
                {new Date(v.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-trevo-text-secondary mb-3 break-words leading-relaxed">{v.reasoning}</p>
            <div className="flex items-center gap-4 text-[10px] font-mono text-trevo-text-muted">
              <span className="shrink-0 whitespace-nowrap tabular-nums">Confidence: {Math.round(v.confidence * 100)}%</span>
              <div className="w-16 h-1 bg-trevo-surface-2 shrink-0 rounded-full overflow-hidden">
                <div className="h-full bg-trevo-accent/40 rounded-full" style={{ width: `${v.confidence * 100}%` }} />
              </div>
              <span className="shrink-0 whitespace-nowrap tabular-nums">Staked: {v.reputationStaked}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClaimTimer({ claimedAt }: { claimedAt: string | Date }) {
  const [remaining, setRemaining] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const deadline = new Date(claimedAt).getTime() + 72 * 60 * 60 * 1000;
      const diff = deadline - Date.now();
      if (diff <= 0) { setRemaining("Expired"); setIsUrgent(true); return; }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${hrs}h ${mins}m`);
      setIsUrgent(hrs < 4);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [claimedAt]);

  return (
    <div className={cn(
      "inline-flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-md shrink-0",
      isUrgent
        ? "bg-trevo-danger/8 text-trevo-danger animate-pulse-accent"
        : "bg-trevo-surface-2 text-trevo-text-secondary"
    )}>
      <Clock size={14} className="shrink-0" />
      <span className="tabular-nums whitespace-nowrap">{remaining}</span>
      <span className="text-[10px] text-trevo-text-muted whitespace-nowrap">claim expires</span>
    </div>
  );
}

export function ValidationStake({ value, onChange, max = 100 }: { value: number; onChange: (val: number) => void; max?: number }) {
  const pct = (value / max) * 100;
  const riskColor = pct < 30 ? "text-trevo-success" : pct < 70 ? "text-trevo-warning" : "text-trevo-danger";
  const barColor = pct < 30 ? "bg-trevo-success/40" : pct < 70 ? "bg-trevo-warning/40" : "bg-trevo-danger/40";

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider">Reputation Stake</label>
        <span className={cn("font-mono text-sm font-semibold tabular-nums", riskColor)}>{value}</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-trevo-surface-2 rounded-full appearance-none cursor-pointer accent-[var(--accent)]" />
      <div className="h-1 bg-trevo-surface-2 -mt-3 pointer-events-none rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-trevo-text-muted mt-1">
        <span>Low risk</span><span>High risk</span>
      </div>
    </div>
  );
}

export function ContextViewer({
  context,
}: {
  context: {
    coreCapabilities?: string[];
    recentPatterns?: string[];
    knownFailureModes?: string[];
    domainContext?: Record<string, string>;
    version?: number;
    lastUpdated?: string;
  };
}) {
  const sections = [
    { label: "Capabilities", items: context.coreCapabilities, color: "text-trevo-accent" },
    { label: "Recent Patterns", items: context.recentPatterns, color: "text-trevo-success" },
    { label: "Known Failure Modes", items: context.knownFailureModes, color: "text-trevo-danger" },
  ];

  return (
    <div className="border border-trevo-border bg-trevo-surface rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-trevo-border bg-trevo-surface-2/50">
        <span className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider">Agent Context</span>
        <div className="flex items-center gap-2 text-[10px] font-mono text-trevo-text-muted">
          {context.version && <span>v{context.version}</span>}
          {context.lastUpdated && <span>{new Date(context.lastUpdated).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="divide-y divide-trevo-border">
        {sections.map((s) => s.items && s.items.length > 0 && (
          <div key={s.label} className="px-4 py-3">
            <h4 className={cn("text-[10px] font-mono uppercase tracking-wider mb-2", s.color)}>{s.label}</h4>
            <div className="flex flex-wrap gap-1">
              {s.items.map((item, i) => (
                <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-trevo-surface-2 text-trevo-text-secondary break-words max-w-full">{item}</span>
              ))}
            </div>
          </div>
        ))}
        {context.domainContext && Object.keys(context.domainContext).length > 0 && (
          <div className="px-4 py-3">
            <h4 className="text-[10px] font-mono uppercase tracking-wider mb-2 text-trevo-text-muted">Domain Context</h4>
            <div className="space-y-1.5">
              {Object.entries(context.domainContext).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs min-w-0">
                  <span className="font-mono text-trevo-accent shrink-0 whitespace-nowrap">{k}:</span>
                  <span className="text-trevo-text-secondary break-words min-w-0">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnomalyAlert({
  type, severity, actors, description,
}: {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actors: string[];
  description: string;
  evidence?: Record<string, unknown>;
}) {
  const sevConfig = {
    LOW: { color: "text-trevo-text-muted", bg: "bg-trevo-surface-2" },
    MEDIUM: { color: "text-trevo-warning", bg: "bg-trevo-warning/5" },
    HIGH: { color: "text-trevo-danger", bg: "bg-trevo-danger/5" },
    CRITICAL: { color: "text-trevo-danger", bg: "bg-trevo-danger/8" },
  };
  const s = sevConfig[severity];

  return (
    <div className={cn("border border-trevo-border rounded-lg p-4 overflow-hidden", s.bg)}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle size={14} className={cn("shrink-0", s.color)} />
          <span className="text-xs font-mono font-medium text-trevo-text whitespace-nowrap shrink-0">{type.replace(/_/g, " ")}</span>
        </div>
        <span className={cn("text-xs font-mono font-medium shrink-0", s.color)}>{severity}</span>
      </div>
      <p className="text-sm text-trevo-text-secondary mb-2 break-words leading-relaxed">{description}</p>
      <div className="flex items-center gap-1 text-[10px] font-mono text-trevo-text-muted overflow-hidden">
        <span className="shrink-0">Actors:</span>
        <span className="truncate">{actors.join(", ")}</span>
      </div>
    </div>
  );
}

export function ReputationTimeline({ data }: { data: { delta: number; snapshot: number; createdAt: string | Date }[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center border border-trevo-border bg-trevo-surface rounded-lg">
        <span className="text-xs font-mono text-trevo-text-muted">Insufficient data</span>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const values = sorted.map((d) => d.snapshot);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const w = 400, h = 80, pad = 4;
  const points = sorted.map((d, i) => ({
    x: pad + (i / (sorted.length - 1)) * (w - pad * 2),
    y: pad + (1 - (d.snapshot - minVal) / range) * (h - pad * 2),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div className="border border-trevo-border bg-trevo-surface rounded-lg p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-trevo-text-muted uppercase tracking-wider">Reputation Over Time</span>
        <span className="font-mono text-sm font-semibold text-trevo-accent tabular-nums">{values[values.length - 1]?.toFixed(0)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#repFill)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill="var(--accent)" opacity="0.8" />
      </svg>
      <div className="flex justify-between text-[10px] font-mono text-trevo-text-muted mt-2">
        <span>{new Date(sorted[0].createdAt).toLocaleDateString()}</span>
        <span>{new Date(sorted[sorted.length - 1].createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-3xl md:text-4xl font-bold truncate">{title}</h1>
        {description && <p className="text-sm text-trevo-text-secondary mt-1.5 line-clamp-2 break-words">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export function SectionHeader({ title, accent = true }: { title: string; accent?: boolean }) {
  return (
    <h2 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
      {accent && <span className="w-0.5 h-4 bg-trevo-accent rounded-full inline-block shrink-0 opacity-60" />}
      <span className="truncate">{title}</span>
    </h2>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "border border-trevo-border bg-trevo-surface rounded-lg overflow-hidden",
        onClick && "text-left w-full hover:border-trevo-border-hover transition-all duration-200 glow-card cursor-pointer",
        className
      )}
    >
      {children}
    </Comp>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    OPEN: "text-trevo-success bg-trevo-success/8",
    ACTIVE: "text-trevo-accent bg-trevo-accent/8",
    VALIDATING: "text-trevo-warning bg-trevo-warning/8",
    RESOLVED: "text-trevo-text-muted bg-trevo-surface-2",
    DISPUTED: "text-trevo-danger bg-trevo-danger/8",
    PENDING: "text-trevo-warning bg-trevo-warning/8",
    VALIDATED: "text-trevo-success bg-trevo-success/8",
    REJECTED: "text-trevo-danger bg-trevo-danger/8",
    PASSED: "text-trevo-success bg-trevo-success/8",
    SUCCESS: "text-trevo-success bg-trevo-success/8",
    FAILURE: "text-trevo-danger bg-trevo-danger/8",
    PARTIAL: "text-trevo-warning bg-trevo-warning/8",
    WITHDRAWN: "text-trevo-text-muted bg-trevo-surface-2",
    DEPRECATED: "text-trevo-text-muted bg-trevo-surface-2",
    FLAGGED: "text-trevo-danger bg-trevo-danger/8",
    DRAFT: "text-trevo-text-muted bg-trevo-surface-2",
    PENDING_AUTO: "text-trevo-warning bg-trevo-warning/8",
    NEEDS_FIXES: "text-trevo-danger bg-trevo-danger/8",
    PENDING_COMMUNITY: "text-trevo-accent bg-trevo-accent/8",
    PENDING_COUNCIL: "text-trevo-warning bg-trevo-warning/8",
    VERIFIED: "text-trevo-success bg-trevo-success/8",
    CHANGES_REQUESTED: "text-trevo-warning bg-trevo-warning/8",
    ARCHIVED: "text-trevo-text-muted bg-trevo-surface-2",
    ACCEPTED: "text-trevo-success bg-trevo-success/8",
    DECLINED: "text-trevo-danger bg-trevo-danger/8",
    CANCELLED: "text-trevo-text-muted bg-trevo-surface-2",
    COMPLETED: "text-trevo-accent bg-trevo-accent/8",
    READ: "text-trevo-text-muted bg-trevo-surface-2",
    REPLIED: "text-trevo-success bg-trevo-success/8",
    CLOSED: "text-trevo-text-muted bg-trevo-surface-2",
  };

  return (
    <span className={cn(
      "text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center whitespace-nowrap shrink-0",
      colorMap[status] || "text-trevo-text-muted bg-trevo-surface-2"
    )}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function VerifiedBadge({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const sizes = { xs: 10, sm: 14, md: 18 };
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-1 text-trevo-success shrink-0" title="Verified by TREVO — passed 3-layer verification">
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      {size !== "xs" && <span className="text-[10px] font-mono font-medium">VERIFIED</span>}
    </span>
  );
}

export function NewsCard({
  title, summary, source, publishedAt, imageUrl, category, sentiment, url, insightTags, featured, onClick,
}: {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  imageUrl?: string | null;
  category?: string;
  sentiment?: string;
  url: string;
  insightTags?: string[];
  featured?: boolean;
  onClick?: () => void;
}) {
  const sentimentColor = sentiment === "POSITIVE" ? "text-trevo-success" : sentiment === "CAUTIONARY" ? "text-trevo-warning" : "text-trevo-text-muted";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        "block border border-trevo-border bg-trevo-surface rounded-lg overflow-hidden hover:border-trevo-border-hover transition-all duration-200 group glow-card",
        featured && "ring-1 ring-trevo-accent/20"
      )}
    >
      {imageUrl && (
        <div className="h-36 overflow-hidden bg-trevo-surface-2">
          <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 overflow-hidden">
          {category && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-trevo-surface-2 text-trevo-accent shrink-0">{category}</span>}
          {sentiment && <span className={cn("text-[10px] font-mono shrink-0", sentimentColor)}>●</span>}
          {featured && <span className="text-[10px] font-mono text-trevo-warning shrink-0">★ PICK</span>}
        </div>
        <h3 className="font-heading font-semibold text-sm text-trevo-text group-hover:text-trevo-accent transition-colors mb-2 line-clamp-2 leading-snug">{title}</h3>
        <p className="text-xs text-trevo-text-secondary line-clamp-2 leading-relaxed mb-3">{summary}</p>
        {insightTags && insightTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {insightTags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-trevo-accent/5 text-trevo-accent">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] font-mono text-trevo-text-muted">
          <span className="truncate max-w-[120px]">{source}</span>
          <span className="shrink-0">{new Date(publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </a>
  );
}

export function NewsTicker({ articles }: { articles: { title: string; source: string; url: string }[] }) {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!articles.length) return null;

  const doubled = [...articles, ...articles];

  return (
    <div
      className="border-y border-trevo-border bg-trevo-surface overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center h-9">
        <div className="shrink-0 px-3 border-r border-trevo-border bg-trevo-accent/5">
          <span className="text-[10px] font-mono text-trevo-accent font-semibold tracking-wider uppercase">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div
            ref={tickerRef}
            className="flex items-center gap-6 whitespace-nowrap"
            style={{
              animation: `tickerScroll ${articles.length * 6}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {doubled.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs hover:text-trevo-accent transition-colors shrink-0"
              >
                <span className="text-trevo-text-muted">●</span>
                <span className="text-trevo-text-secondary">{article.title}</span>
                <span className="text-[10px] font-mono text-trevo-text-muted">{article.source}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIStatCard({
  metric, value, unit, delta, deltaPercent, trend30d, keyInsight, source, sourceUrl,
}: {
  metric: string;
  value: number;
  unit: string;
  delta?: number | null;
  deltaPercent?: number | null;
  trend30d?: number[];
  keyInsight?: string | null;
  source: string;
  sourceUrl?: string | null;
}) {
  const isPositive = (delta || 0) >= 0;
  const w = 120, h = 32;

  let sparkPath = "";
  if (trend30d && trend30d.length >= 2) {
    const max = Math.max(...trend30d, 1);
    const min = Math.min(...trend30d, 0);
    const range = max - min || 1;
    sparkPath = trend30d
      .map((v, i) => {
        const x = (i / (trend30d.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <div className="border border-trevo-border bg-trevo-surface p-4 rounded-lg group hover:border-trevo-border-hover transition-all duration-200 glow-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-trevo-text-muted uppercase tracking-wider leading-tight">{metric.replace(/_/g, " ")}</span>
        {delta !== null && delta !== undefined && (
          <span className={cn("text-[10px] font-mono flex items-center gap-0.5 shrink-0 tabular-nums", isPositive ? "text-trevo-success" : "text-trevo-danger")}>
            {isPositive ? <ArrowUpRight size={10} className="shrink-0" /> : <ArrowDownRight size={10} className="shrink-0" />}
            {deltaPercent !== null && deltaPercent !== undefined ? `${isPositive ? "+" : ""}${deltaPercent.toFixed(1)}%` : `${isPositive ? "+" : ""}${delta}`}
          </span>
        )}
      </div>
      <div className="font-mono text-2xl font-bold text-trevo-text tabular-nums mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
        <span className="text-sm text-trevo-text-muted ml-1">{unit}</span>
      </div>
      {sparkPath && (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 mt-2" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`spark-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={`${sparkPath} L ${w} ${h} L 0 ${h} Z`} fill={`url(#spark-${metric})`} />
          <path d={sparkPath} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      )}
      {keyInsight && <p className="text-[11px] text-trevo-text-secondary mt-2 line-clamp-2 leading-relaxed">{keyInsight}</p>}
      <div className="flex items-center gap-1 mt-2 text-[9px] font-mono text-trevo-text-muted">
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-trevo-accent transition-colors truncate">{source}</a>
        ) : (
          <span className="truncate">{source}</span>
        )}
      </div>
    </div>
  );
}

export function AgentListingCard({
  name, slug, tagline, domainVerticals, verified, featured, owner, viewCount, enquiryCount, logo, onClick,
}: {
  name: string;
  slug: string;
  tagline: string;
  domainVerticals: string[];
  verified: boolean;
  featured?: boolean;
  owner: { username: string; displayName?: string | null; avatar?: string | null; tier?: TierType };
  viewCount?: number;
  enquiryCount?: number;
  logo?: string | null;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden",
        featured ? "border-trevo-accent/20 ring-1 ring-trevo-accent/10" : "border-trevo-border"
      )}
    >
      <div className="flex items-start gap-3 mb-3 min-w-0">
        {logo ? (
          <img src={logo} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-trevo-border" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-trevo-surface-2 flex items-center justify-center text-sm font-heading font-bold text-trevo-text-muted shrink-0 border border-trevo-border">
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors truncate">{name}</h3>
            {verified && <VerifiedBadge size="xs" />}
            {featured && <span className="text-[9px] font-mono text-trevo-warning shrink-0">★</span>}
          </div>
          <p className="text-xs text-trevo-text-secondary line-clamp-2 leading-relaxed">{tagline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {domainVerticals.slice(0, 3).map((v) => <DomainBadge key={v} vertical={v} />)}
        {domainVerticals.length > 3 && <span className="text-[10px] font-mono text-trevo-text-muted">+{domainVerticals.length - 3}</span>}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-trevo-text-muted">
        <div className="flex items-center gap-1 min-w-0">
          <span className="truncate max-w-[80px]">@{owner.username}</span>
          {owner.tier && <TierBadge tier={owner.tier} size="xs" />}
        </div>
        <div className="flex items-center gap-3 shrink-0 tabular-nums">
          {viewCount !== undefined && <span>{viewCount.toLocaleString()} views</span>}
          {enquiryCount !== undefined && <span>{enquiryCount} enquiries</span>}
        </div>
      </div>
    </button>
  );
}

export function PublishStepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold shrink-0 transition-colors",
            i < current ? "bg-trevo-accent text-[#101012]" :
            i === current ? "bg-trevo-accent/20 text-trevo-accent border border-trevo-accent/40" :
            "bg-trevo-surface-2 text-trevo-text-muted"
          )}>
            {i < current ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            ) : i + 1}
          </div>
          <span className={cn(
            "text-[10px] font-mono truncate hidden sm:block",
            i <= current ? "text-trevo-text" : "text-trevo-text-muted"
          )}>{step}</span>
          {i < steps.length - 1 && (
            <div className={cn("flex-1 h-px min-w-[8px]", i < current ? "bg-trevo-accent/40" : "bg-trevo-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ContactButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <Button variant="primary" size="md" onClick={onClick} disabled={disabled} className="gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" />
      </svg>
      Send Enquiry
    </Button>
  );
}

export function BookButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <Button variant="secondary" size="md" onClick={onClick} disabled={disabled} className="gap-1.5">
      <Clock size={14} className="shrink-0" />
      Book a Call
    </Button>
  );
}

export function AuthGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative border border-trevo-border bg-trevo-surface rounded-lg p-6 w-full max-w-sm animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-trevo-text-muted hover:text-trevo-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-trevo-accent" />
          <h3 className="font-heading font-semibold text-lg">Sign in to continue</h3>
        </div>
        <p className="text-sm text-trevo-text-secondary mb-6 leading-relaxed">
          Create a free account or sign in to send enquiries, book calls, and connect with builders.
        </p>
        <div className="space-y-2">
          <a
            href="/register"
            className="block w-full text-center font-heading font-semibold text-sm bg-trevo-accent text-[#101012] px-4 py-2.5 rounded-md hover:bg-trevo-accent-dim transition-colors"
          >
            Create Free Account
          </a>
          <a
            href="/login"
            className="block w-full text-center font-heading font-medium text-sm border border-trevo-border text-trevo-text px-4 py-2.5 rounded-md hover:border-trevo-border-hover transition-colors"
          >
            Sign In
          </a>
        </div>
        <p className="text-[10px] font-mono text-trevo-text-muted text-center mt-4">
          Always free. No payment required.
        </p>
      </div>
    </div>
  );
}

export function EnquiryComposer({
  onSubmit, onCancel, loading, recipientName, listingName,
}: {
  onSubmit: (data: { subject: string; body: string }) => void;
  onCancel: () => void;
  loading?: boolean;
  recipientName: string;
  listingName?: string;
}) {
  const [subject, setSubject] = useState(listingName ? `Enquiry about ${listingName}` : "");
  const [body, setBody] = useState("");

  return (
    <div className="border border-trevo-border bg-trevo-surface rounded-lg p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-sm">
          Send enquiry to <span className="text-trevo-accent">@{recipientName}</span>
        </h3>
        <button onClick={onCancel} className="text-trevo-text-muted hover:text-trevo-text transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="space-y-3">
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" maxLength={200} />
        <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Introduce yourself and explain what you need..." maxLength={2000} className="min-h-[120px]" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-trevo-text-muted tabular-nums">{body.length}/2000</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSubmit({ subject, body })}
              disabled={!subject.trim() || !body.trim() || loading}
            >
              {loading ? "Sending..." : "Send Enquiry"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnquiryThread({
  messages, currentUserId,
}: {
  messages: {
    id: string;
    body: string;
    createdAt: string;
    readAt?: string | null;
    author: { id: string; username: string; avatar?: string | null };
  }[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isMine = msg.author.id === currentUserId;
        return (
          <div key={msg.id} className={cn("flex gap-2", isMine && "flex-row-reverse")}>
            <div className="w-7 h-7 rounded-full bg-trevo-surface-2 flex items-center justify-center text-[10px] font-mono shrink-0 border border-trevo-border overflow-hidden">
              {msg.author.avatar ? <img src={msg.author.avatar} alt="" className="w-full h-full object-cover" /> : msg.author.username[0]?.toUpperCase()}
            </div>
            <div className={cn(
              "max-w-[75%] border rounded-lg p-3",
              isMine ? "bg-trevo-accent/5 border-trevo-accent/10" : "bg-trevo-surface border-trevo-border"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-trevo-text-secondary">@{msg.author.username}</span>
                <span className="text-[9px] font-mono text-trevo-text-muted">{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-trevo-text leading-relaxed break-words whitespace-pre-wrap">{msg.body}</p>
              {isMine && msg.readAt && (
                <span className="text-[9px] font-mono text-trevo-accent mt-1 block">✓ Read</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function InboxItem({
  subject, preview, senderName, senderAvatar, unread, time, enquiryId, onClick,
}: {
  subject: string;
  preview: string;
  senderName: string;
  senderAvatar?: string | null;
  unread: boolean;
  time: string;
  enquiryId: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 p-3 border-b border-trevo-border hover:bg-trevo-surface-2/50 transition-colors overflow-hidden",
        unread && "bg-trevo-accent/[0.02]"
      )}
    >
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full bg-trevo-surface-2 flex items-center justify-center text-xs font-mono border border-trevo-border overflow-hidden">
          {senderAvatar ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" /> : senderName[0]?.toUpperCase()}
        </div>
        {unread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-trevo-accent rounded-full border-2 border-trevo-surface" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn("text-sm font-heading truncate", unread ? "font-semibold text-trevo-text" : "text-trevo-text-secondary")}>{subject}</span>
          <span className="text-[10px] font-mono text-trevo-text-muted shrink-0 whitespace-nowrap">{time}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-trevo-text-muted">
          <span className="shrink-0">@{senderName}</span>
          <span>·</span>
          <span className="truncate">{preview}</span>
        </div>
      </div>
    </button>
  );
}

export function BookingRequestCard({
  purpose, preferredDate, preferredTime, timezone, status, requester, builder, listing, notes, builderNote, createdAt, onAccept, onDecline, onCancel, isHost,
}: {
  purpose: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  status: string;
  requester: { username: string; avatar?: string | null };
  builder: { username: string; avatar?: string | null };
  listing?: { name: string; slug: string } | null;
  notes?: string | null;
  builderNote?: string | null;
  createdAt: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  isHost: boolean;
}) {
  return (
    <div className="border border-trevo-border bg-trevo-surface rounded-lg p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookingStatusBadge status={status} />
          {listing && <span className="text-xs font-mono text-trevo-accent truncate">/{listing.slug}</span>}
        </div>
        <span className="text-[10px] font-mono text-trevo-text-muted shrink-0">{new Date(createdAt).toLocaleDateString()}</span>
      </div>
      <h3 className="font-heading font-semibold text-sm text-trevo-text mb-2 line-clamp-2">{purpose}</h3>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
        <div>
          <span className="text-trevo-text-muted block text-[10px] uppercase tracking-wider mb-0.5">Date</span>
          <span className="text-trevo-text tabular-nums">{new Date(preferredDate).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-trevo-text-muted block text-[10px] uppercase tracking-wider mb-0.5">Time</span>
          <span className="text-trevo-text">{preferredTime} {timezone}</span>
        </div>
        <div>
          <span className="text-trevo-text-muted block text-[10px] uppercase tracking-wider mb-0.5">{isHost ? "From" : "To"}</span>
          <span className="text-trevo-text">@{isHost ? requester.username : builder.username}</span>
        </div>
      </div>
      {notes && <p className="text-xs text-trevo-text-secondary mb-3 border-l-2 border-trevo-border pl-3">{notes}</p>}
      {builderNote && <p className="text-xs text-trevo-accent mb-3 border-l-2 border-trevo-accent/20 pl-3">{builderNote}</p>}
      {status === "PENDING" && isHost && (
        <div className="flex gap-2 mt-3">
          <Button variant="primary" size="sm" onClick={onAccept}>Accept</Button>
          <Button variant="danger" size="sm" onClick={onDecline}>Decline</Button>
        </div>
      )}
      {status === "PENDING" && !isHost && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel Request</Button>
        </div>
      )}
    </div>
  );
}

export function BookingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    PENDING: { color: "text-trevo-warning", bg: "bg-trevo-warning/8" },
    ACCEPTED: { color: "text-trevo-success", bg: "bg-trevo-success/8" },
    DECLINED: { color: "text-trevo-danger", bg: "bg-trevo-danger/8" },
    CANCELLED: { color: "text-trevo-text-muted", bg: "bg-trevo-surface-2" },
    COMPLETED: { color: "text-trevo-accent", bg: "bg-trevo-accent/8" },
  };
  const c = config[status] || config.CANCELLED;
  return (
    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center whitespace-nowrap shrink-0", c.color, c.bg)}>
      {status}
    </span>
  );
}

export function NotificationItem({
  title, body, time, read, linkUrl, type, onClick,
}: {
  title: string;
  body: string;
  time: string;
  read: boolean;
  linkUrl?: string | null;
  type?: string;
  onClick?: () => void;
}) {
  const iconMap: Record<string, typeof Shield> = {
    ENQUIRY_RECEIVED: Shield,
    BOOKING_REQUEST: Clock,
    PROOF_VALIDATED: FileCheck,
    VOTE_OPENED: Target,
  };
  const Icon = (type && iconMap[type]) || Shield;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 p-3 border-b border-trevo-border hover:bg-trevo-surface-2/50 transition-colors overflow-hidden",
        !read && "bg-trevo-accent/[0.02]"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
        !read ? "bg-trevo-accent/10 text-trevo-accent" : "bg-trevo-surface-2 text-trevo-text-muted"
      )}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn("text-sm font-heading truncate", !read ? "font-semibold text-trevo-text" : "text-trevo-text-secondary")}>{title}</span>
          <span className="text-[10px] font-mono text-trevo-text-muted shrink-0 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-xs text-trevo-text-muted line-clamp-1">{body}</p>
      </div>
      {!read && <div className="w-2 h-2 bg-trevo-accent rounded-full shrink-0 mt-2" />}
    </button>
  );
}

export function VerificationStatusBanner({ status, note }: { status: string; note?: string | null }) {
  const configs: Record<string, { bg: string; border: string; icon: typeof Shield; color: string; message: string }> = {
    DRAFT: { bg: "bg-trevo-surface-2/50", border: "border-trevo-border", icon: FileCheck, color: "text-trevo-text-muted", message: "This listing is a draft. Submit it for verification when ready." },
    PENDING_AUTO: { bg: "bg-trevo-warning/5", border: "border-trevo-warning/10", icon: Clock, color: "text-trevo-warning", message: "Automated verification in progress..." },
    NEEDS_FIXES: { bg: "bg-trevo-danger/5", border: "border-trevo-danger/10", icon: AlertTriangle, color: "text-trevo-danger", message: "Your listing needs fixes before it can proceed." },
    PENDING_COMMUNITY: { bg: "bg-trevo-accent/5", border: "border-trevo-accent/10", icon: Shield, color: "text-trevo-accent", message: "Community verification in progress (72-hour window)." },
    PENDING_COUNCIL: { bg: "bg-trevo-warning/5", border: "border-trevo-warning/10", icon: Shield, color: "text-trevo-warning", message: "Awaiting council review." },
    VERIFIED: { bg: "bg-trevo-success/5", border: "border-trevo-success/10", icon: Shield, color: "text-trevo-success", message: "Verified and live! Your listing is publicly visible." },
    REJECTED: { bg: "bg-trevo-danger/5", border: "border-trevo-danger/10", icon: AlertTriangle, color: "text-trevo-danger", message: "Listing was rejected by council review." },
    CHANGES_REQUESTED: { bg: "bg-trevo-warning/5", border: "border-trevo-warning/10", icon: AlertTriangle, color: "text-trevo-warning", message: "Council requested changes. Please update and resubmit." },
  };

  const config = configs[status] || configs.DRAFT;
  const Icon = config.icon;

  return (
    <div className={cn("border rounded-lg p-3 flex items-start gap-3", config.bg, config.border)}>
      <Icon size={16} className={cn("shrink-0 mt-0.5", config.color)} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-trevo-text-secondary">{config.message}</p>
        {note && <p className="text-xs text-trevo-text-muted mt-1 break-words">{note}</p>}
      </div>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 border-b border-trevo-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-3 py-2 text-sm font-heading font-medium transition-colors whitespace-nowrap shrink-0 border-b-2",
            active === tab.key
              ? "text-trevo-accent border-trevo-accent"
              : "text-trevo-text-secondary border-transparent hover:text-trevo-text"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[10px] font-mono tabular-nums text-trevo-text-muted">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search..." }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-sm">
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-trevo-text-muted pointer-events-none"
      >
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--input-bg)] border border-trevo-border pl-9 pr-3 py-2 text-sm text-trevo-text rounded-md placeholder:text-trevo-text-muted focus:outline-none focus:border-trevo-accent/40 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-trevo-text-muted hover:text-trevo-text transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={cn("relative border border-trevo-border bg-trevo-surface rounded-lg w-full animate-fade-in", maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-trevo-border">
          <h3 className="font-heading font-semibold">{title}</h3>
          <button onClick={onClose} className="text-trevo-text-muted hover:text-trevo-text transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="space-y-6 p-4 animate-fade-in">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  );
}

export function BuilderCard({
  username, displayName, avatar, tier, trustScore, domainVerticals, reputationDelta, onClick,
}: {
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  tier: TierType;
  trustScore: number;
  domainVerticals: string[];
  reputationDelta?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-trevo-border bg-trevo-surface p-4 rounded-lg hover:border-trevo-border-hover transition-all duration-200 group glow-card overflow-hidden"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-trevo-surface-2 flex items-center justify-center text-sm font-mono shrink-0 border border-trevo-border overflow-hidden">
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : username[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-semibold text-trevo-text group-hover:text-trevo-accent transition-colors truncate">
              {displayName || username}
            </span>
            <TierBadge tier={tier} size="xs" />
          </div>
          <span className="text-xs font-mono text-trevo-text-muted">@{username}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-lg font-bold text-trevo-accent tabular-nums">{Math.round(trustScore)}</div>
          {reputationDelta !== undefined && reputationDelta !== 0 && (
            <span className={cn("text-[10px] font-mono flex items-center gap-0.5 justify-end tabular-nums", reputationDelta > 0 ? "text-trevo-success" : "text-trevo-danger")}>
              {reputationDelta > 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
              {reputationDelta > 0 ? "+" : ""}{reputationDelta}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {domainVerticals.slice(0, 3).map((v) => <DomainBadge key={v} vertical={v} />)}
        {domainVerticals.length > 3 && <span className="text-[10px] font-mono text-trevo-text-muted">+{domainVerticals.length - 3}</span>}
      </div>
    </button>
  );
}

