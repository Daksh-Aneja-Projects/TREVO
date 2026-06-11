import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-trevo-bg px-4">
      <div className="text-center">
        <div className="font-mono text-8xl font-bold text-trevo-accent/20 mb-4">404</div>
        <h1 className="font-display text-3xl font-bold mb-2">Not found</h1>
        <p className="text-sm text-trevo-text-secondary mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="inline-flex items-center gap-2 font-heading font-semibold text-sm bg-trevo-accent text-trevo-bg px-6 py-2.5 hover:bg-trevo-accent-dim transition-colors">
          Back to TREVO
        </Link>
      </div>
    </div>
  );
}
