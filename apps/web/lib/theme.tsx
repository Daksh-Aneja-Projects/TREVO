"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type ThemeMode = "light" | "dark";
type ThemeStrategy = "system" | "manual" | "auto";

interface ThemeContextValue {
  theme: ThemeMode;
  strategy: ThemeStrategy;
  setTheme: (mode: ThemeMode) => void;
  setStrategy: (strategy: ThemeStrategy) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  strategy: "system",
  setTheme: () => {},
  setStrategy: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemPreference(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getTimeBasedTheme(): ThemeMode {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function resolveTheme(strategy: ThemeStrategy, manualTheme: ThemeMode): ThemeMode {
  switch (strategy) {
    case "system": return getSystemPreference();
    case "manual": return manualTheme;
    case "auto": return getTimeBasedTheme();
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategyState] = useState<ThemeStrategy>("system");
  const [manualTheme, setManualTheme] = useState<ThemeMode>("dark");
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("trevo-theme-strategy") as ThemeStrategy | null;
    const storedManual = localStorage.getItem("trevo-theme-manual") as ThemeMode | null;
    const s = stored || "system";
    const m = storedManual || "dark";
    setStrategyState(s);
    setManualTheme(m);
    setThemeState(resolveTheme(s, m));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveTheme(strategy, manualTheme);
    setThemeState(resolved);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  }, [strategy, manualTheme, mounted]);

  useEffect(() => {
    if (!mounted || strategy !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setThemeState(getSystemPreference());
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [strategy, mounted]);

  useEffect(() => {
    if (!mounted || strategy !== "auto") return;
    const interval = setInterval(() => {
      setThemeState(getTimeBasedTheme());
    }, 60000);
    return () => clearInterval(interval);
  }, [strategy, mounted]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setManualTheme(mode);
    setStrategyState("manual");
    localStorage.setItem("trevo-theme-strategy", "manual");
    localStorage.setItem("trevo-theme-manual", mode);
  }, []);

  const setStrategy = useCallback((s: ThemeStrategy) => {
    setStrategyState(s);
    localStorage.setItem("trevo-theme-strategy", s);
    const resolved = resolveTheme(s, manualTheme);
    setThemeState(resolved);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
  }, [manualTheme]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [theme, setTheme]);

  if (!mounted) {
    return <div className="min-h-screen" style={{ background: "#0A0A0A" }} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, strategy, setTheme, setStrategy, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
