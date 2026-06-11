import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VERTICALS = [
  { slug: "engineering", label: "Engineering" },
  { slug: "legal", label: "Legal" },
  { slug: "finance", label: "Finance" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "hr-hcm", label: "HR & HCM" },
  { slug: "marketing", label: "Marketing" },
  { slug: "research", label: "Research" },
  { slug: "operations", label: "Operations" },
  { slug: "education", label: "Education" },
  { slug: "creative", label: "Creative" },
] as const;

export type Vertical = (typeof VERTICALS)[number]["slug"];

export function getVertical(slug: string) {
  return VERTICALS.find((v) => v.slug === slug);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(new Date(date));
}

export function formatRelative(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function truncate(str: string, len: number) {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}
