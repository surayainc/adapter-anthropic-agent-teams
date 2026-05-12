# @surayaorg/adapter-anthropic-agent-teams

Adapter that lets an Anthropic Agent Teams deployment write into and read from the Suraya brain via the public Brain SDK.

G4 (v1.3 §6.4). MIT-licensed. Highest leverage of the three v1 adapters because Agent Teams is the official Anthropic-blessed multi-agent surface.

> **Sandbox note.** Lives in suraya meta at `apps/adapter-anthropic-agent-teams/` until `surayainc/adapter-anthropic-agent-teams` is created. Publish to npm as `@surayaorg/adapter-anthropic-agent-teams`.

## What it does

Wraps `@surayaorg/brain-sdk` for use inside an Agent Teams runtime:

1. **Observation emission** — every team session emits a `decision` or `failure` observation when an agent escalates or hits a stop-reason; the adapter handles batching + retries.
2. **Memory retrieval** — when a team agent receives a query that benefits from prior context, the adapter retrieves top-k memory nodes scoped to the team's project_slug.
3. **Capability minting** — when a parent agent spawns a sub-agent (Agent Teams pattern), the adapter mints a narrower brain capability for that sub-agent (per ADR-0043 T1.8).

## Quick start

```typescript
import { suraya } from "@surayaorg/adapter-anthropic-agent-teams";

const brain = suraya.connect({
  projectSlug: "my-project",
  hmacSecret: process.env.SURAYA_BRAIN_WEBHOOK_SECRET_MY_PROJECT,
});

// Inside an agent definition:
const memories = await brain.retrieve({ q: userQuery, topK: 5 });
const context = brain.formatAsContext(memories);

// agent.systemPrompt now includes:
// "Brain context (top 5 observations matching your query): …"
```

## API

- `suraya.connect(options)` — returns a `SurayaBrainProxy` with `retrieve` + `emit` + `mintSubAgentCapability` + `formatAsContext`
- `suraya.middleware(options)` — Agent Teams middleware that auto-attaches brain context to every turn (opt-in per agent)
- `suraya.lifecycleHooks(options)` — `onAgentStop`, `onAgentError`, `onSubAgentSpawn` handlers that auto-emit observations

## Status (2026-05-23)

- ✅ README + design
- ✅ TypeScript types (src/types.ts)
- ✅ Reference connect() implementation (src/connect.ts)
- ❌ Middleware integration with Agent Teams runtime (needs Agent Teams SDK to be available; out-of-band)
- ❌ Lifecycle hooks (depends on Agent Teams hook surface)
- ❌ Tests
- ❌ npm publish (gated on OQ-15 npm org + automation token)
