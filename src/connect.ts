/**
 * Adapter entry point: suraya.connect()
 *
 * Wraps a BrainClient with Agent-Teams-friendly helpers — batched
 * emit, context-formatted retrieve, sub-agent capability minting.
 */
import { BrainClient } from "@surayaorg/brain-sdk";
import type {
  SurayaConnectOptions,
  SurayaBrainProxy,
  SubAgentCapabilityRequest,
} from "./types.js";
import type { ObservationInput, RetrieveResult } from "@surayaorg/brain-sdk";

function connect(options: SurayaConnectOptions): SurayaBrainProxy {
  const client = new BrainClient({
    baseUrl: options.baseUrl ?? "https://brain.suraya.ai",
    projectSlug: options.projectSlug,
    ...(options.hmacSecret ? { hmacSecret: options.hmacSecret } : {}),
    ...(options.bootstrapToken ? { bootstrapToken: options.bootstrapToken } : {}),
  });

  const emitBatchInterval = options.emitBatch?.intervalMs ?? 5000;
  const emitBatchMax = options.emitBatch?.maxRows ?? 50;
  const queue: ObservationInput[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  async function drain(): Promise<void> {
    if (queue.length === 0) return;
    const batch = queue.splice(0, emitBatchMax);
    for (const obs of batch) {
      try {
        await client.emitObservation(obs);
      } catch (err) {
        console.warn("[@surayaorg/adapter-anthropic-agent-teams] emit failed", err);
      }
    }
  }

  function schedule(): void {
    if (flushTimer) return;
    flushTimer = setTimeout(async () => {
      flushTimer = null;
      await drain();
    }, emitBatchInterval);
  }

  return {
    client,

    async retrieve(args): Promise<RetrieveResult[]> {
      const res = await client.retrieve({
        q: args.q,
        topK: args.topK ?? 5,
        scope: args.scope ?? null,
      });
      return res.results;
    },

    emit(observation): void {
      queue.push(observation);
      if (queue.length >= emitBatchMax) {
        void drain();
      } else {
        schedule();
      }
    },

    async flush(): Promise<void> {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      await drain();
    },

    formatAsContext(results: RetrieveResult[]): string {
      if (results.length === 0) {
        return "Brain context: no observations matched the current query.";
      }
      const lines = results.map(
        (r, i) =>
          `  ${i + 1}. [${r.type}] ${r.representative_summary} (similarity ${r.similarity.toFixed(2)}, confidence ${r.confidence.toFixed(2)})`
      );
      return [
        `Brain context (top ${results.length} observations matching the current query):`,
        ...lines,
      ].join("\n");
    },

    async mintSubAgentCapability(_args: SubAgentCapabilityRequest): Promise<string> {
      // Brain-side capability minting endpoint is T1.8 (ADR-0043) —
      // shipping in a future PR. For now we surface the contract so
      // adapter consumers can build against the signature today.
      throw new Error(
        "mintSubAgentCapability requires T1.8 brain capability endpoint (ADR-0043); not yet wired"
      );
    },
  };
}

export const suraya = {
  connect,
};
