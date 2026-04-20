# tracebug

A local web UI for debugging chatbot session traces. Paste a `share_id` → get a human-readable session trace showing the full conversation and pipeline stages with collapsible, pretty-printed JSON.

## Language

**Session**:
A conversation between a user and the chatbot, identified internally by `session_id`.
_Avoid_: conversation, chat

**Trace**:
The full pipeline execution data for a session — all `message_data` rows with their stage payloads.
_Avoid_: log, execution, record

**Share ID**:
The public-facing identifier that testers and support use to reference a session. Maps 1:1 to a `session_id` via the `share` table.
_Avoid_: share, public id, link id

**Pipeline Stage**:
A named step in the chatbot's processing pipeline (querier, router, scenario_selector, agent, generator, questioner). Each stage produces a JSON payload stored in `message_data`.
_Avoid_: step, phase, processor

**Summary Card**:
A compact key-value display extracted from a pipeline stage's raw JSON. Shows the high-signal fields without requiring the user to dig into the full payload.

**Message**:
A single user or assistant turn in a session. Ordered by `id` for the conversation timeline.

## Relationships

- A **Share ID** maps to exactly one **Session**
- A **Session** has many **Messages** (conversation timeline)
- A **Session** has many **Trace** entries (one per processing step, each containing multiple **Pipeline Stages**)
- Each **Trace** entry corresponds to one or more **Messages**

## Decisions

- **v1 scope**: Hardcoded schema for one specific chatbot system. Generalization (other schemas, other frameworks, other databases) is TODO.
- **Runtime**: Web UI only. `npx tracebug` starts a server and opens a browser. CLI-only mode is TODO.
- **Layout**: Message-first. Conversation timeline is the primary view. Click a message to see its pipeline stages.
- **Rendering**: Two layers — summary cards (always visible) + raw JSON tree (expand on click). Schema-aware rendering is TODO.
- **Frontend**: Vanilla HTML/CSS/JS for v1. Framework migration is TODO.
- **Distribution**: npm package only. Docker is TODO.
- **Server**: Thin API layer (one endpoint) + client-side rendering. Server handles the 3-table join logic, frontend receives a clean data structure.
- **API**: Single endpoint `GET /api/session?share_id=xxx` returns everything in one payload.

## Example dialogue

> **Dev:** "I'm looking at share_id `abc123` — the bot told the user there are no clinics, but I know there should be."
> **Dev:** "Let me check the trace. The querier detected intent `clinic`, router matched scenario `Clinic - Other`... but the agent stage returned zero entities. The cypher query was filtering by province and got no results."

## Flagged ambiguities

- "trace" could mean an individual pipeline stage payload or the full set of pipeline data for a session. Resolved: **Trace** is the full set; individual items are **Pipeline Stages**.
