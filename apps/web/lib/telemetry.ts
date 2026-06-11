import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { trace, metrics, SpanStatusCode, type Span } from "@opentelemetry/api";

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

const resource = new Resource({
  [ATTR_SERVICE_NAME]: "trevo-web",
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
  "deployment.environment": process.env.NODE_ENV || "development",
});

let sdk: NodeSDK | null = null;

export function initTelemetry() {
  if (sdk) return;

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({ url: `${OTEL_ENDPOINT}/v1/traces` }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${OTEL_ENDPOINT}/v1/metrics` }),
      exportIntervalMillis: 30_000,
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();

  process.on("SIGTERM", async () => {
    try {
      await sdk?.shutdown();
    } catch (err) {
      console.error("Telemetry shutdown error:", err);
    }
  });
}

const tracer = trace.getTracer("trevo-web");

export function createSpan(name: string, fn: (span: Span) => Promise<void>) {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

const meter = metrics.getMeter("trevo-web");

export const trevoMetrics = {
  proofSubmissions: meter.createCounter("trevo.proofs.submitted", {
    description: "Number of proofs submitted",
  }),
  proofValidations: meter.createCounter("trevo.proofs.validated", {
    description: "Number of proof validations performed",
  }),
  problemsClaimed: meter.createCounter("trevo.problems.claimed", {
    description: "Number of problems claimed",
  }),
  trustScoreRecalculations: meter.createCounter("trevo.trust.recalculations", {
    description: "Number of trust score recalculations",
  }),
  anomaliesDetected: meter.createCounter("trevo.anomalies.detected", {
    description: "Number of gaming anomalies detected",
  }),
  agentInvocations: meter.createCounter("trevo.agents.invocations", {
    description: "Number of AI agent invocations",
  }),
  agentLatency: meter.createHistogram("trevo.agents.latency_ms", {
    description: "AI agent response latency in milliseconds",
    unit: "ms",
  }),
  apiRequestDuration: meter.createHistogram("trevo.api.request_duration_ms", {
    description: "API request duration in milliseconds",
    unit: "ms",
  }),
  activeUsers: meter.createUpDownCounter("trevo.users.active", {
    description: "Number of active users",
  }),
  searchQueries: meter.createCounter("trevo.search.queries", {
    description: "Number of search queries",
  }),
};

export { tracer, meter };
