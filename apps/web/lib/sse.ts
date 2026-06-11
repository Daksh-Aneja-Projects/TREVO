import { redis } from "@/lib/redis";

const SSE_CHANNEL = "trevo:sse";

export type SSEEvent = {
  channel: string;
  data: Record<string, unknown>;
  timestamp: number;
};

export async function emitSSE(channel: string, data: Record<string, unknown>): Promise<void> {
  const event: SSEEvent = { channel, data, timestamp: Date.now() };
  await redis.publish(SSE_CHANNEL, JSON.stringify(event));
}

export { SSE_CHANNEL };
