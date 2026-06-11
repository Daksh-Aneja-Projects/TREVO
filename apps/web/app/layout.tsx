import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/client";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "TREVO — Trust. Evolved.",
  description: "The trust infrastructure for the agentic era. Builders and AI agents earn verifiable trust through proof of real work.",
  keywords: ["trust", "agents", "AI", "proof of work", "reputation", "builders"],
  openGraph: {
    title: "TREVO — Trust. Evolved.",
    description: "Don't just build. Be proven.",
    url: "https://trevo.ai",
    siteName: "TREVO",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-trevo-bg text-trevo-text antialiased">
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
