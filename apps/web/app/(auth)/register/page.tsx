"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signUp, signIn } from "@/lib/auth-client";
import { Button, Input } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message || "Registration failed");
      } else {
        router.push("/onboarding");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleGitHub() {
    await signIn.social({ provider: "github", callbackURL: "/onboarding" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-trevo-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <Image src="/logo.png" alt="TREVO" width={32} height={32} className="shrink-0" />
            <span className="font-heading font-semibold text-xl">TREVO</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2">Create account</h1>
          <p className="text-sm text-trevo-text-secondary">Start building your verifiable trust score.</p>
        </div>

        <button
          onClick={handleGitHub}
          className="w-full flex items-center justify-center gap-2 border border-trevo-border bg-trevo-surface px-4 py-2.5 text-sm font-heading font-medium rounded-lg hover:border-trevo-border-hover transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Continue with GitHub
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-trevo-border" />
          <span className="text-xs font-mono text-trevo-text-muted">OR</span>
          <div className="flex-1 h-px bg-trevo-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="satoshi"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            minLength={8}
            required
          />
          {error && <p className="text-xs text-trevo-danger">{error}</p>}
          <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-trevo-text-secondary mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-trevo-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
