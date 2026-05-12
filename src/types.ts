/**
 * Types for the Anthropic Agent Teams ↔ Suraya brain adapter.
 *
 * The Agent Teams runtime is referenced via duck-typed interfaces (we
 * don't take a hard dep on it until publish-time) so the adapter
 * compiles in isolation.
 */
import type {
  BrainClient,
  RetrieveResult,
  ObservationInput,
} from "@surayaorg/brain-sdk";

export type SurayaConnectOptions = {
  projectSlug: string;
  hmacSecret?: string;
  bootstrapToken?: string;
  baseUrl?: string;
  // Auto-batch emissions; default 5s window, 50-row cap
  emitBatch?: { intervalMs?: number; maxRows?: number };
};

export type SurayaBrainProxy = {
  client: BrainClient;
  retrieve(args: { q: string; topK?: number; scope?: string | null }): Promise<RetrieveResult[]>;
  emit(observation: ObservationInput): void; // batched, fire-and-forget
  flush(): Promise<void>;
  formatAsContext(results: RetrieveResult[]): string;
  mintSubAgentCapability?(args: SubAgentCapabilityRequest): Promise<string>;
};

export type SubAgentCapabilityRequest = {
  parent_canonical_handle: string;
  parent_project_slug: string;
  sub_agent_id: string;
  abilities: string[];
  expires_in_seconds?: number;
};

// Agent Teams lifecycle hook shapes — duck-typed
export type AgentStopEvent = {
  agent_id: string;
  team_id: string;
  stop_reason: string;
  turn_count?: number;
};

export type AgentErrorEvent = {
  agent_id: string;
  team_id: string;
  error: string;
  retriable?: boolean;
};
