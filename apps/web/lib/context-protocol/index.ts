import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

interface ContextBlob {
  agentId: string;
  version: number;
  lastUpdated: string;
  coreCapabilities: string[];
  recentPatterns: string[];
  knownFailureModes: string[];
  domainContext: Record<string, string>;
  openProblems: { id: string; summary: string; status: string }[];
  collaborators: { id: string; trustLevel: number }[];
}

const CONTEXT_TTL_ACTIVE = 30 * 24 * 60 * 60;
const CONTEXT_TTL_INACTIVE = 7 * 24 * 60 * 60;
const MAX_CONTEXT_TOKENS = 8000;

function contextKey(agentId: string, sessionKey: string) {
  return `ctx:${agentId}:${sessionKey}`;
}

export async function loadContext(agentId: string, sessionKey: string): Promise<ContextBlob | null> {
  const cacheKey = contextKey(agentId, sessionKey);
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stored = await db.agentContext.findFirst({
    where: { agentId, sessionKey },
    orderBy: { updatedAt: "desc" },
  });

  if (!stored) return null;

  const blob = stored.contextBlob as unknown as ContextBlob;
  await redis.setex(cacheKey, 300, JSON.stringify(blob));
  return blob;
}

export async function saveContext(
  agentId: string,
  sessionKey: string,
  blob: ContextBlob,
  isActive: boolean = true
): Promise<void> {
  const ttl = isActive ? CONTEXT_TTL_ACTIVE : CONTEXT_TTL_INACTIVE;

  const existing = await db.agentContext.findFirst({
    where: { agentId, sessionKey },
  });

  if (existing) {
    await db.agentContext.update({
      where: { id: existing.id },
      data: {
        contextBlob: blob as unknown as Record<string, unknown>,
        ttl,
        updatedAt: new Date(),
      },
    });
  } else {
    await db.agentContext.create({
      data: {
        agentId,
        sessionKey,
        contextBlob: blob as unknown as Record<string, unknown>,
        ttl,
      },
    });
  }

  const cacheKey = contextKey(agentId, sessionKey);
  await redis.setex(cacheKey, Math.min(ttl, 300), JSON.stringify(blob));
}

export async function mergeContextDelta(
  existing: ContextBlob | null,
  delta: Partial<ContextBlob>
): Promise<ContextBlob> {
  const base: ContextBlob = existing || {
    agentId: delta.agentId || "",
    version: 0,
    lastUpdated: new Date().toISOString(),
    coreCapabilities: [],
    recentPatterns: [],
    knownFailureModes: [],
    domainContext: {},
    openProblems: [],
    collaborators: [],
  };

  return {
    ...base,
    version: base.version + 1,
    lastUpdated: new Date().toISOString(),
    coreCapabilities: dedupeAndTrim(
      [...base.coreCapabilities, ...(delta.coreCapabilities || [])],
      20
    ),
    recentPatterns: dedupeAndTrim(
      [...(delta.recentPatterns || []), ...base.recentPatterns],
      15
    ),
    knownFailureModes: dedupeAndTrim(
      [...base.knownFailureModes, ...(delta.knownFailureModes || [])],
      10
    ),
    domainContext: { ...base.domainContext, ...(delta.domainContext || {}) },
    openProblems: (delta.openProblems || base.openProblems).slice(0, 10),
    collaborators: (delta.collaborators || base.collaborators).slice(0, 20),
  };
}

export async function deleteContext(agentId: string, sessionKey: string): Promise<void> {
  await db.agentContext.deleteMany({ where: { agentId, sessionKey } });
  await redis.del(contextKey(agentId, sessionKey));
}

export async function cleanExpiredContexts(): Promise<number> {
  const result = await db.agentContext.deleteMany({
    where: {
      updatedAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  return result.count;
}

function dedupeAndTrim(arr: string[], max: number): string[] {
  return [...new Set(arr)].slice(0, max);
}

export type { ContextBlob };
