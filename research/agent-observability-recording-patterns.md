# Agent Observability: Recording Patterns & Debugging Gaps

## Context

Investigated a real production chatbot system to understand how AI agents record their internal processing data and the practical debugging challenges that emerge. This document captures the key findings about agent data storage patterns and the need for better tooling to make recorded data accessible.

---

## 1. How LangChain-Based Agents Store Pipeline Data

### The Multi-Table Normalization Pattern

LangChain-based chatbots typically normalize their data across multiple tables:

```
share (public-facing ID) → session (conversation context) → message (user/assistant turns)
                                                         → message_data (pipeline traces per turn)
```

**Key insight:** The public-facing identifier (share_id) is deliberately decoupled from the internal session identifier. This means anyone debugging from the outside (testers, support) starts with a key that requires a lookup chain before reaching any useful data.

### Pipeline Stages as Table Columns

Each `message_data` row stores a full pipeline execution as columns:

| Stage | Purpose | Typical Content |
|-------|---------|----------------|
| `querier` | Input parsing | Language detection, intent extraction, tool calls (planner) |
| `router` | Intent routing | Scenario selection, cypher queries, confidence scores |
| `scenario_selector` | Flow matching | Matched scenario metadata, answer prompt templates |
| `agent` | Data retrieval | Search results (clinics, doctors), knowledge graph queries, context assembly |
| `generator` | Response generation | Summary, sources, answer prompts, memory state, booking data |
| `questioner` | Clarification | Follow-up questions when the system can't answer directly |
| `stat` | Timing metrics | Duration per stage in milliseconds |

**Critical finding:** Stages that don't fire are stored as `NULL`. This means the same schema handles wildly different execution paths — a simple greeting only touches querier + generator, while a complex clinic search fires all 5 stages.

### The Data Format Problem

All stage columns store **LangChain AIMessage objects** serialized as JSON strings. These are not simple key-value structures:

```json
{
  "language": "vi",
  "message": {
    "lc": 1,
    "type": "constructor",
    "id": ["langchain_core", "messages", "AIMessage"],
    "kwargs": {
      "content": "",
      "additional_kwargs": {
        "tool_calls": [{
          "function": {
            "arguments": "{\"input\":\"...\",\"intent\":\"clinic\"}",
            "name": "planner"
          },
          "id": "call_XKZVY...",
          "type": "function"
        }]
      },
      "response_metadata": {
        "tokenUsage": { "promptTokens": 2049, "completionTokens": 38 },
        "model_name": "gpt-4.1-2025-04-14"
      }
    }
  },
  "tools": [...],
  "traceId": "...",
  "toolCalls": [...]
}
```

**Problems with this format:**
- **Triple-escaped JSON** — strings inside JSON inside JSON. Reading raw in a DB client is nearly impossible
- **LangChain verbosity** — 90% of the object is LangChain boilerplate (`lc`, `type`, `constructor`, `kwargs`), 10% is the actual data you care about
- **Massive payloads** — `router` and `agent` use `mediumtext` because a single row can contain full clinic/doctor content, knowledge graph query results, and answer prompt templates (easily 50KB+ per field)
- **No standard structure** — each stage has a completely different schema, nested at different depths

---

## 2. The Debugging Workflow Gap

### Current State: Manual Query Chains

When a tester reports a bug with just a `share_id`:

```
1. Adminer → SELECT session_id FROM share WHERE id = 'share_id'
2. Copy session_id
3. Adminer → SELECT * FROM message WHERE session_id = '...' ORDER BY id
4. Find the problematic message
5. Adminer → SELECT * FROM message_data WHERE session_id = '...' ORDER BY id
6. Find the matching message_data row
7. Stare at triple-escaped JSON in a tiny text area
8. Copy JSON → paste into formatter → try to read → repeat for each stage
```

**Time per bug:** 10-15 minutes of pure mechanical navigation before any actual analysis begins.

### Why This Matters for Agent Systems Generally

This isn't unique to this chatbot. The pattern generalizes:

1. **Agents produce rich internal state** — pipeline traces, routing decisions, tool call results, token usage, memory state
2. **That state is stored for production reasons** — auditing, analytics, debugging
3. **The storage format is optimized for the agent framework, not for humans** — LangChain serializes its own object graph, not a human-readable trace
4. **The people who need to read it (debuggers, testers, support) are not the ones who designed the storage** — there's a gap between write format and read format
5. **Production access is restricted** — read-only DB access means you can't even create temporary views or run complex JOINs

---

## 3. Different Approaches for Recording Agent Data

### Approach A: Framework-Level Serialization (Current)

Store the raw framework objects as-is.

- ✅ No data loss — everything is preserved
- ✅ Simple to implement — just serialize the LangChain message
- ❌ Not human-readable without tooling
- ❌ Tightly coupled to framework version (LangChain schema changes break things)
- ❌ Huge storage footprint (mediumtext for single fields)

### Approach B: Structured Event Logging

Log discrete events at each pipeline stage with a defined schema.

```json
{"event": "querier.complete", "session_id": "...", "data": {"language": "vi", "intent": "clinic", "tool": "planner"}}
{"event": "router.complete", "session_id": "...", "data": {"route": "clinic", "scenario": "Clinic - Other", "confidence": 0.92}}
{"event": "agent.complete", "session_id": "...", "data": {"entities_found": 3, "query": "...", "duration_ms": 1500}}
```

- ✅ Human-readable by default
- ✅ Queryable (filter by event type, session, etc.)
- ✅ Decoupled from framework internals
- ❌ Requires defining and maintaining a schema per event type
- ❌ Loses the raw data — if you need something you didn't log, you can't reconstruct it

### Approach C: Hybrid (Structured Summary + Raw Payload)

Store both a human-readable summary and the raw payload.

```json
{
  "summary": {"intent": "clinic", "route": "clinic", "entities": 3, "duration_ms": 6250},
  "raw": { /* full LangChain AIMessage */ }
}
```

- ✅ Fast scanning via summaries
- ✅ Drill-down available via raw payload
- ❌ Double storage
- ❌ Summary schema must be maintained alongside pipeline changes

### Approach D: External Observability Platform

Ship traces to a dedicated platform (LangSmith, LangFuse, Helicone, etc.).

- ✅ Purpose-built UI for trace viewing
- ✅ Search, filter, compare out of the box
- ✅ Analytics and monitoring built in
- ❌ External dependency, cost per trace
- ❌ Data leaves your infrastructure
- ❌ Still need to map your pipeline to their schema
- ❌ Not always feasible for production data (privacy, compliance)

---

## 4. Key Takeaways

### For Building Agent Systems

1. **Plan for observability from day one** — the debugging workflow is not a secondary concern. If testers and developers can't trace what the agent did, bug turnaround is slow.

2. **Separate the write schema from the read schema** — LangChain's internal representation is fine for storage, but you need a read-optimized view (either a tool, a view, or a derived table) that strips boilerplate and highlights decisions.

3. **The public identifier should be a first-class key** — if your bug reports start with `share_id`, your debug tool should accept `share_id` directly. Don't make humans do the lookup chain.

4. **Pipeline timing is high-value data** — the `stat` field (duration per stage) is small but incredibly useful. It tells you immediately where to look: "generator took 15s" or "router returned nothing."

5. **NULL stages are signal, not noise** — when a stage didn't fire, that tells you which path the pipeline took. Surface this explicitly (e.g., "Path: querier → router → generator (skipped: scenario_selector, agent, questioner)").

### For Building Debug Tools

1. **Accept the identifier the human has** — `share_id` in, not `session_id` in
2. **Pretty-print deeply nested JSON** — collapsible tree views, not raw text
3. **Extract key fields at the top level** — show intent, route, entities found, model used, token count without requiring the user to dig through LangChain boilerplate
4. **Show timing upfront** — a simple bar or table of stage durations immediately tells you where to investigate
5. **Hide NULL stages by default** — reduce noise, but make it clear which stages were skipped
6. **Read-only by design** — production debugging tools should never need write access

### For Recording Agent Interactions in Coding Agents

The same principle applies to coding agents (like this one): the context window produces valuable decisions, specs, and design rationale that evaporate when the session ends. The key insight:

- **The conversation IS the documentation** — but only if you capture it before the context window closes
- **Different recorders for different purposes** — the README captures the spec; this research doc captures the insights; the git history captures the decisions
- **Upload/persist early** — don't wait until the end of a session. As soon as a coherent artifact emerges (spec, insight, design), write it to disk
