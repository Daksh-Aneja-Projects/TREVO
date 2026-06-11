import { NextRequest } from "next/server";
import Redis from "ioredis";
import { SSE_CHANNEL } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const channels = req.nextUrl.searchParams.getAll("channel");

  const encoder = new TextEncoder();
  let subscriber: Redis | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ channel: "system", data: { status: "connected" }, timestamp: Date.now() })}\n\n`));

      try {
        subscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        subscriber.connect().then(() => {
          subscriber!.subscribe(SSE_CHANNEL);

          subscriber!.on("message", (_channel: string, message: string) => {
            try {
              const event = JSON.parse(message);
              if (channels.length === 0 || channels.includes(event.channel)) {
                controller.enqueue(encoder.encode(`data: ${message}\n\n`));
              }
            } catch {}
          });
        }).catch(() => {
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            } catch {
              clearInterval(heartbeat);
            }
          }, 30000);
        });
      } catch {
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);
      }
    },
    cancel() {
      if (subscriber) {
        subscriber.unsubscribe();
        subscriber.disconnect();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
