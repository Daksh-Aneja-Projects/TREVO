"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";
import { trpc } from "@/lib/trpc/client";
import { TierBadge } from "@/components/ui";

const navItems = [
  { href: "/discover", label: "Discover" },
  { href: "/registry", label: "Registry" },
  { href: "/archive", label: "Archive" },
  { href: "/problems", label: "Problems" },
  { href: "/commons", label: "Commons" },
  { href: "/news", label: "News" },
  { href: "/stats", label: "Stats" },
  { href: "/council", label: "Council" },
];

function ThemeToggleButton() {
  const { theme, strategy, setStrategy, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const strategies: { value: "system" | "manual" | "auto"; label: string; desc: string }[] = [
    { value: "system", label: "System", desc: "Follow OS preference" },
    { value: "manual", label: "Manual", desc: "Toggle manually" },
    { value: "auto", label: "Auto", desc: "Day/night schedule" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleTheme}
        onContextMenu={(e) => { e.preventDefault(); setOpen(!open); }}
        className="p-1.5 hover:bg-trevo-surface-2 transition-colors text-trevo-text-secondary hover:text-trevo-text"
        title="Click to toggle · Right-click for options"
      >
        {theme === "dark" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 border border-trevo-border bg-trevo-surface shadow-lg z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-trevo-border">
            <span className="text-[10px] font-mono text-trevo-text-muted uppercase tracking-wider">Theme Mode</span>
          </div>
          {strategies.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStrategy(s.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-trevo-surface-2 transition-colors",
                strategy === s.value && "bg-trevo-surface-2"
              )}
            >
              <div className="min-w-0">
                <div className="text-sm font-heading font-medium truncate">{s.label}</div>
                <div className="text-[10px] text-trevo-text-muted truncate">{s.desc}</div>
              </div>
              {strategy === s.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-trevo-accent shrink-0 ml-2"><path d="M20 6L9 17l-5-5"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { data: session } = useSession();
  const unread = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 15000,
  });
  const count = unread.data ?? 0;
  return (
    <Link
      href="/notifications"
      className="relative p-1.5 hover:bg-trevo-surface-2 transition-colors text-trevo-text-secondary hover:text-trevo-text"
      title="Notifications"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-trevo-accent text-trevo-bg text-[9px] font-mono font-bold flex items-center justify-center" style={{ borderRadius: "50%" }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/login"
          className="text-sm font-heading text-trevo-text-secondary hover:text-trevo-text transition-colors hidden sm:block whitespace-nowrap"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="text-sm font-heading font-semibold bg-trevo-accent text-trevo-bg px-4 py-1.5 hover:bg-trevo-accent-dim transition-colors hidden sm:block whitespace-nowrap shadow-[0_0_12px_var(--glow-accent)]"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const user = session.user as { name?: string; email: string; image?: string };
  const displayName = user.name || user.email.split("@")[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 hover:bg-trevo-surface-2 transition-colors"
      >
        <div className="w-6 h-6 bg-trevo-surface-2 border border-trevo-border flex items-center justify-center text-xs font-mono shrink-0 overflow-hidden">
          {user.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            displayName[0]?.toUpperCase()
          )}
        </div>
        <span className="text-sm font-heading text-trevo-text hidden sm:block truncate max-w-[100px]">
          {displayName}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-trevo-text-muted shrink-0"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 border border-trevo-border bg-trevo-surface shadow-lg z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-trevo-border">
            <div className="text-sm font-heading font-medium truncate">{displayName}</div>
            <div className="text-[10px] font-mono text-trevo-text-muted truncate">{user.email}</div>
          </div>
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/publish", label: "Publish Agent" },
            { href: "/inbox", label: "Inbox" },
            { href: "/bookings", label: "Bookings" },
            { href: "/settings", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm font-heading text-trevo-text-secondary hover:text-trevo-text hover:bg-trevo-surface-2 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { signOut(); setOpen(false); router.push("/"); }}
            className="w-full text-left px-3 py-2 text-sm font-heading text-trevo-danger hover:bg-trevo-danger/5 transition-colors border-t border-trevo-border"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-trevo-bg/90 backdrop-blur-md border-b border-trevo-border">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image src="/logo.png" alt="TREVO" width={28} height={28} className="shrink-0" />
            <span className="font-heading font-bold text-lg tracking-tight text-trevo-text group-hover:text-trevo-accent transition-colors">
              TREVO
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5 overflow-hidden">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-heading font-medium transition-colors whitespace-nowrap shrink-0",
                    isActive
                      ? "text-trevo-accent border-b-2 border-trevo-accent"
                      : "text-trevo-text-secondary hover:text-trevo-text"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleButton />
            <NotificationBell />
            <UserMenu />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-trevo-text-secondary hover:text-trevo-text p-1.5"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" /></svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-trevo-border py-2 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-heading whitespace-nowrap",
                  pathname.startsWith(item.href) ? "text-trevo-accent" : "text-trevo-text-secondary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-trevo-border mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="TREVO" width={22} height={22} className="shrink-0" />
              <span className="font-heading font-semibold text-sm">TREVO</span>
            </div>
            <p className="text-xs text-trevo-text-secondary leading-relaxed break-words">
              Trust infrastructure for the agentic era. Don&apos;t just build. Be proven.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-trevo-text-secondary mb-3">Marketplace</h4>
            <div className="space-y-2">
              <Link href="/registry" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Registry</Link>
              <Link href="/archive" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Proof Archive</Link>
              <Link href="/problems" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Problems</Link>
              <Link href="/commons" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Commons</Link>
              <Link href="/publish" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Publish Agent</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-trevo-text-secondary mb-3">Intelligence</h4>
            <div className="space-y-2">
              <Link href="/news" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">AI News</Link>
              <Link href="/stats" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Growth Dashboard</Link>
              <Link href="/council" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Council</Link>
              <Link href="/verticals/engineering" className="block text-xs text-trevo-text-muted hover:text-trevo-text transition-colors">Verticals</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-trevo-text-secondary mb-3">Developers</h4>
            <div className="space-y-2">
              <span className="block text-xs text-trevo-text-muted">API Docs</span>
              <span className="block text-xs text-trevo-text-muted">SDK</span>
              <span className="block text-xs text-trevo-text-muted">Context Protocol</span>
            </div>
          </div>
        </div>
        <div className="border-t border-trevo-border mt-8 pt-4 flex items-center justify-between">
          <p className="text-[10px] font-mono text-trevo-text-muted whitespace-nowrap">© {new Date().getFullYear()} TREVO. Trust. Evolved.</p>
          <p className="text-[10px] font-mono text-trevo-text-muted whitespace-nowrap">v2.0.0</p>
        </div>
      </div>
    </footer>
  );
}
