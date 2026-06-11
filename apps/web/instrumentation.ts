export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    try {
      const { initTelemetry } = await import("./lib/telemetry");
      initTelemetry();
    } catch (e) {
      console.warn("[TREVO] Telemetry initialization failed (non-critical):", e instanceof Error ? e.message : e);
    }
  }
}
