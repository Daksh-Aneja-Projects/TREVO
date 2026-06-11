"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SSEEvent {
  channel: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export function useSSE(channels: string[]) {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const channelSet = useRef(new Set(channels));

  useEffect(() => {
    channelSet.current = new Set(channels);
  }, [channels]);

  const connect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    const params = new URLSearchParams();
    channels.forEach((c) => params.append("channel", c));
    const es = new EventSource(`/api/sse?${params.toString()}`);
    sourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        if (channelSet.current.has(event.channel)) {
          setLastEvent(event);
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(connect, 3000);
    };
  }, [channels]);

  useEffect(() => {
    connect();
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [connect]);

  return { lastEvent, connected };
}
