"use client";

import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-trevo-danger/8 mx-auto mb-5">
        <AlertTriangle size={24} strokeWidth={1.5} className="text-trevo-danger" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-sm text-trevo-text-secondary mb-6 max-w-sm mx-auto leading-relaxed break-words">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="primary" onClick={reset}>Try Again</Button>
        <Button variant="secondary" onClick={() => window.location.href = "/"}>Go Home</Button>
      </div>
      {error.digest && (
        <p className="text-[10px] font-mono text-trevo-text-muted mt-6">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
