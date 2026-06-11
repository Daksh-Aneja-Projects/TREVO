"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { VERTICALS } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>("");
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);

  function toggleVertical(slug: string) {
    setSelectedVerticals((prev) =>
      prev.includes(slug) ? prev.filter((v) => v !== slug) : [...prev, slug]
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-trevo-bg">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-trevo-accent flex items-center justify-center">
            <span className="text-trevo-bg font-heading font-bold">T</span>
          </div>
          <span className="font-heading font-bold text-xl">TREVO</span>
        </div>

        <div className="flex gap-1 mb-8">
          {[0, 1, 2].map((s) => (
            <div key={s} className={cn("h-1 flex-1", s <= step ? "bg-trevo-accent" : "bg-trevo-border")} />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold mb-2">What describes you best?</h1>
            <p className="text-sm text-trevo-text-secondary mb-6">This helps us personalize your experience.</p>
            <div className="space-y-2">
              {[
                { value: "builder", label: "Builder", desc: "I solve problems and build things" },
                { value: "agent-creator", label: "Agent Creator", desc: "I build AI agents that do work" },
                { value: "validator", label: "Validator", desc: "I review and validate work quality" },
                { value: "explorer", label: "Explorer", desc: "I'm here to discover and learn" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setRole(r.value); setStep(1); }}
                  className={cn(
                    "w-full text-left p-4 border transition-colors",
                    role === r.value ? "border-trevo-accent bg-trevo-accent/5" : "border-trevo-border hover:border-trevo-border-hover bg-trevo-surface"
                  )}
                >
                  <div className="font-heading font-semibold">{r.label}</div>
                  <div className="text-sm text-trevo-text-secondary">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold mb-2">Pick your verticals</h1>
            <p className="text-sm text-trevo-text-secondary mb-6">Select the domains you work in. You can change these later.</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {VERTICALS.map((v) => (
                <button
                  key={v.slug}
                  onClick={() => toggleVertical(v.slug)}
                  className={cn(
                    "flex items-center gap-2 p-3 border transition-colors",
                    selectedVerticals.includes(v.slug) ? "border-trevo-accent bg-trevo-accent/5 text-trevo-accent" : "border-trevo-border hover:border-trevo-border-hover bg-trevo-surface text-trevo-text-secondary"
                  )}
                >
                  <span className="text-lg">{v.label.charAt(0)}</span>
                  <span className="font-heading text-sm font-medium">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" className="flex-1 justify-center" onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold mb-2">You&apos;re ready</h1>
            <p className="text-sm text-trevo-text-secondary mb-6">Your TREVO journey starts now. Every proof you submit compounds your trust.</p>
            <div className="border border-trevo-border bg-trevo-surface p-6 mb-6">
              <div className="font-mono text-sm text-trevo-text-muted mb-2">YOUR STARTING POINT</div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-bold text-trevo-accent">0</span>
                <span className="font-mono text-xs px-2 py-0.5 border text-trevo-text-secondary bg-trevo-surface-2">SEED</span>
              </div>
              <div className="text-xs text-trevo-text-muted mt-2">Submit your first proof to start building trust →</div>
            </div>
            <div className="space-y-2">
              <Button variant="primary" className="w-full justify-center" onClick={() => router.push("/discover")}>Explore Feed</Button>
              <Button variant="secondary" className="w-full justify-center" onClick={() => router.push("/problems")}>Browse Problems</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
