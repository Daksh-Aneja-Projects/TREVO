"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  Button, Input, Textarea, Select, PublishStepIndicator,
  VerificationStatusBanner, Skeleton, AgentListingCard,
} from "@/components/ui";
import { VERTICALS } from "@/lib/utils";
import { Shield, ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

type WizardStep = "basics" | "specs" | "usecases" | "links" | "review";

const STEPS = ["Basics", "Capabilities", "Use Cases", "Links", "Review"];
const STEP_KEYS: WizardStep[] = ["basics", "specs", "usecases", "links", "review"];

interface UseCase {
  title: string;
  description: string;
}

export default function PublishPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capInput, setCapInput] = useState("");
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [intInput, setIntInput] = useState("");
  const [verticals, setVerticals] = useState<string[]>([]);

  const [useCases, setUseCases] = useState<UseCase[]>([{ title: "", description: "" }]);

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const myListings = trpc.marketplace.getMyListings.useQuery();
  const submitMutation = trpc.marketplace.submitListing.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const addCap = () => {
    if (capInput.trim() && capabilities.length < 20) {
      setCapabilities([...capabilities, capInput.trim()]);
      setCapInput("");
    }
  };
  const addInt = () => {
    if (intInput.trim() && integrations.length < 20) {
      setIntegrations([...integrations, intInput.trim()]);
      setIntInput("");
    }
  };
  const toggleVertical = (v: string) =>
    setVerticals(verticals.includes(v) ? verticals.filter((x) => x !== v) : verticals.length < 5 ? [...verticals, v] : verticals);
  const addUseCase = () => setUseCases([...useCases, { title: "", description: "" }]);
  const removeUseCase = (i: number) => setUseCases(useCases.filter((_, idx) => idx !== i));
  const updateUseCase = (i: number, field: keyof UseCase, val: string) => {
    const updated = [...useCases];
    updated[i] = { ...updated[i], [field]: val };
    setUseCases(updated);
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      name,
      tagline,
      description,
      contactEmail,
      capabilities,
      integrations,
      domainVerticals: verticals,
      useCases: useCases.filter((uc) => uc.title.trim()),
      websiteUrl: websiteUrl || undefined,
      demoUrl: demoUrl || undefined,
      repoUrl: repoUrl || undefined,
    });
  };

  const canProceed = () => {
    if (step === 0) return name.length >= 3 && tagline.length >= 10 && description.length >= 50 && contactEmail.includes("@");
    if (step === 1) return capabilities.length >= 1 && verticals.length >= 1;
    if (step === 2) return useCases.some((uc) => uc.title.trim());
    return true;
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg text-center">
            <div className="w-16 h-16 rounded-full bg-trevo-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={28} className="text-trevo-success" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">Listing Submitted!</h1>
            <p className="text-trevo-text-secondary mb-8 leading-relaxed">
              Your listing is now in the 3-layer verification pipeline. Here&apos;s what happens next:
            </p>
            <div className="border border-trevo-border bg-trevo-surface rounded-lg p-6 text-left space-y-4">
              {[
                { num: 1, title: "Auto-Verification", desc: "Our AI checks quality, coherence, and completeness. Usually a few minutes.", active: true },
                { num: 2, title: "Community Review", desc: "PROVEN+ members review your listing for 72 hours.", active: false },
                { num: 3, title: "Council Approval", desc: "A SOVEREIGN council member makes the final call. Your listing goes live with a verified badge.", active: false },
              ].map((s) => (
                <div key={s.num} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0 ${s.active ? "bg-trevo-accent text-[#101012]" : "bg-trevo-surface-2 text-trevo-text-muted border border-trevo-border"}`}>
                    {s.num}
                  </div>
                  <div>
                    <span className="font-heading font-semibold text-sm">{s.title}</span>
                    <p className="text-xs text-trevo-text-secondary mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="primary" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
              <Button variant="secondary" onClick={() => { setSubmitted(false); setStep(0); }}>Publish Another</Button>
            </div>
          </motion.div>
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
          <div className="mb-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">Publish Your Agent</h1>
            <p className="text-sm text-trevo-text-secondary mt-1">List your agent on TREVO — always free, always yours.</p>
          </div>

          {/* My existing listings */}
          {myListings.data && myListings.data.length > 0 && (
            <div className="mb-8">
              <h2 className="font-heading text-sm font-semibold text-trevo-text-muted uppercase tracking-wider mb-3">Your Listings</h2>
              <div className="space-y-2">
                {myListings.data.map((listing: any) => (
                  <div key={listing.id}>
                    <VerificationStatusBanner status={listing.listingStatus} note={listing.verificationNote} />
                    <div className="flex items-center justify-between p-3 border border-trevo-border rounded-lg bg-trevo-surface mt-1">
                      <div className="min-w-0">
                        <span className="font-heading font-semibold text-sm truncate block">{listing.name}</span>
                        <span className="text-[10px] font-mono text-trevo-text-muted">/{listing.slug}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/registry/${listing.slug}`)}>View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="mb-8">
            <PublishStepIndicator steps={STEPS} current={step} />
          </div>

          {/* Step Content */}
          <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="space-y-5">
                <Input label="Agent Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CodeSentry" maxLength={100} />
                <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line that sells — min 10 chars, max 200" maxLength={200} />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your agent do? Who is it for? What makes it different? (min 50 chars)" className="min-h-[140px]" />
                <Input label="Contact Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@company.com" />
                <div className="flex items-center gap-2 text-xs text-trevo-text-muted">
                  <Shield size={12} className="shrink-0" />
                  <span>Your email is only shared when someone sends you an enquiry.</span>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-heading font-medium mb-2">Capabilities <span className="text-trevo-text-muted">({capabilities.length}/20)</span></label>
                  <div className="flex gap-2">
                    <Input value={capInput} onChange={(e) => setCapInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addCap(); } }}
                      placeholder="e.g. code-review, data-analysis" />
                    <Button variant="secondary" size="sm" onClick={addCap} disabled={!capInput.trim()}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {capabilities.map((c, i) => (
                      <button key={i} onClick={() => setCapabilities(capabilities.filter((_, j) => j !== i))}
                        className="text-xs font-mono px-2 py-1 rounded bg-trevo-accent/10 text-trevo-accent hover:bg-trevo-danger/10 hover:text-trevo-danger transition-colors">
                        {c} ×
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-heading font-medium mb-2">Integrations <span className="text-trevo-text-muted">(optional, {integrations.length}/20)</span></label>
                  <div className="flex gap-2">
                    <Input value={intInput} onChange={(e) => setIntInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addInt(); } }}
                      placeholder="e.g. Slack, GitHub, Jira" />
                    <Button variant="secondary" size="sm" onClick={addInt} disabled={!intInput.trim()}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {integrations.map((c, i) => (
                      <button key={i} onClick={() => setIntegrations(integrations.filter((_, j) => j !== i))}
                        className="text-xs font-mono px-2 py-1 rounded bg-trevo-accent/10 text-trevo-accent hover:bg-trevo-danger/10 hover:text-trevo-danger transition-colors">
                        {c} ×
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-heading font-medium mb-2">Domain Verticals <span className="text-trevo-text-muted">({verticals.length}/5)</span></label>
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
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {useCases.map((uc, i) => (
                  <div key={i} className="border border-trevo-border bg-trevo-surface rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-trevo-text-muted">USE CASE {i + 1}</span>
                      {useCases.length > 1 && (
                        <button onClick={() => removeUseCase(i)} className="text-xs text-trevo-danger hover:underline flex items-center gap-1">
                          <Trash2 size={10} /> Remove
                        </button>
                      )}
                    </div>
                    <Input value={uc.title} onChange={(e) => updateUseCase(i, "title", e.target.value)} placeholder="Use case title" className="mb-2" />
                    <Textarea value={uc.description} onChange={(e) => updateUseCase(i, "description", e.target.value)} placeholder="Describe this use case" className="min-h-[80px]" />
                  </div>
                ))}
                {useCases.length < 10 && (
                  <Button variant="ghost" size="sm" onClick={addUseCase} className="gap-1">
                    <Plus size={14} /> Add Use Case
                  </Button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <p className="text-sm text-trevo-text-secondary">All links are optional but help verification go faster.</p>
                <Input label="Website URL" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://youragent.com" />
                <Input label="Demo URL" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://demo.youragent.com" />
                <Input label="Repository URL" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/agent" />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-heading font-semibold text-lg mb-4">Review Your Listing</h2>
                {[
                  { label: "Name", value: name },
                  { label: "Tagline", value: tagline },
                  { label: "Description", value: description },
                  { label: "Contact", value: contactEmail },
                  { label: "Capabilities", value: capabilities.join(", ") || "None" },
                  { label: "Integrations", value: integrations.join(", ") || "None" },
                  { label: "Verticals", value: verticals.join(", ") || "None" },
                  { label: "Use Cases", value: useCases.filter((u) => u.title).map((u) => u.title).join(", ") || "None" },
                  { label: "Website", value: websiteUrl || "—" },
                  { label: "Demo", value: demoUrl || "—" },
                  { label: "Repo", value: repoUrl || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-trevo-border last:border-0">
                    <span className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider">{item.label}</span>
                    <span className="text-sm text-right max-w-[60%] break-words">{item.value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-3 bg-trevo-accent/5 border border-trevo-accent/10 rounded-lg mt-4">
                  <Shield size={14} className="text-trevo-accent shrink-0" />
                  <span className="text-xs text-trevo-text-secondary">
                    Listing, enquiry, and booking submission is always <strong className="text-trevo-accent">free</strong>. No payment required.
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-trevo-border">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft size={14} /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} disabled={submitMutation.isPending || !canProceed()}>
                {submitMutation.isPending ? "Submitting..." : "Submit for Verification"}
              </Button>
            )}
          </div>

          {submitMutation.error && (
            <div className="mt-4 p-3 border border-trevo-danger/20 bg-trevo-danger/5 rounded-lg text-sm text-trevo-danger">
              {submitMutation.error.message}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
