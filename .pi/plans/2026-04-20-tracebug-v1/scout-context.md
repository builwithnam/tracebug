# Scout Context: tracebug

## Project Status
**Greenfield** — no code exists. Only spec docs (README.md, CONTEXT.md, research/) and git history.

## Tech Stack (decided)
- TypeScript
- Node.js HTTP server
- MySQL client (read-only)
- Vanilla HTML/CSS/JS frontend (no SPA framework)
- npm package distribution (`npx tracebug`)
- Config from `~/.tracebug/settings.json`

## Database Schema

### 3 tables, lookup chain: `share_id → session_id → {message, message_data}`

**share** — maps public share_id to internal session_id
- `id` varchar(255) PK (this IS the share_id)
- `session_id` varchar(255) NOT NULL
- `first_message_id` / `last_message_id` int(11)
- 1:1 with session

**message** — conversation timeline
- `id` int(11) PK auto_increment
- `session_id` varchar(255) NOT NULL
- `text` text NOT NULL
- `type` varchar(10) NOT NULL (user/assistant/system)
- `feedback_type` varchar(10), `referer_id` int(11)
- `quick_replies` text, `buttons` text, `metadata` text
- `code` text
- Ordered by `id` for timeline

**message_data** — pipeline traces per message
- `id` int(11) PK
- `session_id` varchar(255) NOT NULL
- 7 pipeline stage columns (all text/mediumtext, nullable):
  - `querier` text — language detection, intent, tool calls
  - `router` mediumtext — scenario selection, cypher queries (CAN BE HUGE)
  - `scenario_selector` text — routing decisions
  - `agent` mediumtext — search results, knowledge graph (CAN BE HUGE, 50KB+)
  - `generator` text — summary, sources, memory state
  - `questioner` text — follow-up questions
  - `stat` text — timing metrics per stage
- Multiple rows per session (one per processing step)
- NULL stages = skipped pipeline steps

## Data Format Challenge

All stage columns store **LangChain AIMessage objects** serialized as JSON strings:
```
{ "language": "vi", "message": { "lc": 1, "type": "constructor", "id": ["langchain_core","messages","AIMessage"], "kwargs": { "content": "", "additional_kwargs": { "tool_calls": [...] }, "response_metadata": { "tokenUsage": {...}, "model_name": "..." } } }, "tools": [...], "traceId": "...", "toolCalls": [...] }
```

Key problems:
- LangChain boilerplate wraps the actual data (lc, type, constructor, kwargs)
- Triple-escaped JSON in some fields
- `router` and `agent` can be 50KB+ per field (mediumtext)
- Each stage has completely different schema, nested at different depths

## API Design
- Single endpoint: `GET /api/session?share_id=xxx`
- Server does the 3-table join
- Returns clean data structure (server shapes, client renders)
- Read-only queries only

## UX Flow
1. Landing page → single input for share_id → submit
2. Session view → conversation timeline (messages ordered by id)
3. Click message → expand pipeline stages
4. Pipeline stage view:
   - Only show stages that fired (non-NULL)
   - Summary cards (key fields extracted, always visible)
   - Raw JSON tree (expand on click, collapsible)
   - Timing table from stat field
   - Show pipeline path explicitly (which stages ran/skipped)

## Key Decisions from README
- v1 scope: hardcoded schema for one specific chatbot system
- Message-first layout (conversation timeline is primary view)
- Two-layer rendering: summary cards + raw JSON tree
- Thin API layer (one endpoint) + client-side rendering
- No filtering, comparison, auth, SSH tunnel, or error detection in v1

## Pipeline Stages Detail
1. **querier** — language, intent, tool calls (planner), token usage
2. **router** — array of scenarioSelectorOutputs, cypher query, intent, scenario metadata
3. **scenario_selector** — routing decisions, scenario matching
4. **agent** — search results (clinics, doctors), sources, entity IDs, cypher queries, answer prompts
5. **generator** — summary, sources, memory state (router intents, province, service, booking state), specialties
6. **questioner** — follow-up questions
7. **stat** — timing: querierDuration, routerDuration, scenarioSelectorDuration, agentDuration, generatorWaitDuration, generatorAnswerDuration, generatorQuestionDuration, questionerDuration (ms)

## npm Package Requirements
- `npx tracebug` starts server + opens browser
- Config at `~/.tracebug/settings.json` with db credentials
- Dev mode with hot reload: `npm run dev`
- Build: `npm run build`
