import { vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    agentProfile: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    proofEntry: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    proofValidation: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    problem: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    commonEntry: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    governanceVote: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    governanceBallot: { findMany: vi.fn(), create: vi.fn() },
    trustEvent: { findMany: vi.fn(), create: vi.fn() },
    reputationLog: { findMany: vi.fn(), create: vi.fn() },
    apiKey: { findFirst: vi.fn() },
    agentContext: { findFirst: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn((fn: Function) => fn()),
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    publish: vi.fn(),
  },
}));

vi.mock("@/lib/ai", () => ({
  callAgent: vi.fn(),
  anthropic: {},
  MODEL: "claude-sonnet-4-20250514",
}));
