# tracebug

A local web UI for debugging chatbot session traces. Paste a `share_id` → get a human-readable session trace showing the full conversation and pipeline stages with collapsible, pretty-printed JSON.

## Problem

When testers log bugs, they provide a `share_id` + a note. To investigate, you must manually join across 3 tables in Adminer (`share` → `message` → `message_data`), squinting at deeply nested, triple-escaped JSON in pipeline stage fields. This is slow and painful.

## Solution

A local web UI tool. Paste a `share_id` → get a human-readable session trace showing the full conversation and pipeline stages with collapsible, pretty-printed JSON.

## Data Flow

```
share_id → share table → session_id
                         ├→ message (conversation timeline)
                         └→ message_data (pipeline trace per message)
```

## Database Schema

### `share`

| Field             | Type         | Null | Key | Default | Extra |
| ----------------- | ------------ | ---- | --- | ------- | ----- |
| id                | varchar(255) | NO   | PRI |         |       |
| session_id        | varchar(255) | NO   |     |         |       |
| first_message_id  | int(11)      | NO   |     | 0       |       |
| last_message_id   | int(11)      | NO   |     |         |       |
| created_at        | datetime     | YES  |     |         |       |
| updated_at        | datetime     | YES  |     |         |       |

- `id` is the share_id (PK)
- Maps 1:1 to `session_id`

### `message`

| Field         | Type         | Null | Key | Default | Extra         |
| ------------- | ------------ | ---- | --- | ------- | ------------- |
| id            | int(11)      | NO   | PRI |         | auto_increment |
| code          | text         | YES  |     |         |               |
| session_id    | varchar(255) | NO   | MUL |         |               |
| text          | text         | NO   |     |         |               |
| type          | varchar(10)  | NO   |     |         |               |
| feedback_type | varchar(10)  | YES  |     |         |               |
| referer_id    | int(11)      | YES  | MUL |         |               |
| quick_replies | text         | YES  |     |         |               |
| buttons       | text         | YES  |     |         |               |
| metadata      | text         | YES  |     |         |               |
| created_at    | datetime     | YES  |     |         |               |
| updated_at    | datetime     | YES  |     |         |               |

- One row per message (user, assistant, system, etc.)
- Ordered by `id` for conversation timeline

### `message_data`

| Field             | Type         | Null | Key | Default | Extra |
| ----------------- | ------------ | ---- | --- | ------- | ----- |
| id                | int(11)      | NO   | PRI |         |       |
| session_id        | varchar(255) | NO   | MUL |         |       |
| user_journey      | text         | YES  |     |         |       |
| querier           | text         | YES  |     |         |       |
| router            | mediumtext   | YES  |     |         |       |
| scenario_selector | text         | YES  |     |         |       |
| agent             | mediumtext   | YES  |     |         |       |
| generator         | text         | YES  |     |         |       |
| questioner        | text         | YES  |     |         |       |
| stat              | text         | YES  |     |         |       |
| created_at        | datetime     | YES  |     |         |       |
| updated_at        | datetime     | YES  |     |         |       |

- Multiple rows per session (one per processing step / per message)
- Pipeline stages store **LangChain AIMessage objects** as JSON strings
- Stages may be `NULL` when not triggered for that step
- `stat` stores timing metrics per stage

## Pipeline Stages

The chatbot processes each message through a pipeline:

```
querier → router → scenario_selector → agent → generator → questioner
```

### What each stage contains

- **querier** — LangChain `AIMessage` with language detection, tool calls (e.g., `planner`), intent extraction, token usage. Contains the initial parsing of the user's message.
- **router** — Array of `scenarioSelectorOutputs`. Each contains a tool call with cypher query, intent, search type, and the matched scenario metadata (flow ID, agent assignment, answer prompt templates, guidelines).
- **scenario_selector** — Can contain routing decisions and scenario matching logic.
- **agent** — The richest stage. Contains tool call results including:
  - Search context (e.g., clinic results with full content, addresses, images, specialties)
  - Sources (title + URL)
  - Entity IDs and names of matched results
  - Advice request structures (booking data)
  - Answer prompts with full guidelines
  - Cypher queries and parameters executed against the knowledge graph
  - Specialty priorities
- **generator** — Contains summary, sources, advice requests, answer prompts, memory state (router intents, province, service, booking state, turn count), specialties, and detailed query logs.
- **questioner** — Used when the system needs to ask a follow-up question instead of answering.
- **stat** — Timing breakdown: `querierDuration`, `routerDuration`, `scenarioSelectorDuration`, `agentDuration`, `generatorWaitDuration`, `generatorAnswerDuration`, `generatorQuestionDuration`, `questionerDuration` (all in milliseconds).

### Data format inside stages

All stage fields store **JSON strings** containing LangChain message structures:

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
        "tool_calls": [...]
      },
      "response_metadata": {
        "tokenUsage": {...},
        "model_name": "gpt-4.1-2025-04-14"
      }
    }
  },
  "tools": [...],
  "traceId": "...",
  "toolCalls": [...]
}
```

The `router` and `agent` fields can be **very large** (mediumtext) due to embedded clinic/doctor content.

## UX

### Landing Page
- Single input field: paste `share_id`
- Submit → loads session trace

### Session View
- **Conversation timeline** — all messages from `message` table, ordered by `id`
- Each message shows: `type` badge, `text` content, timestamp
- Click a message → expand to see pipeline stages

### Pipeline Stage View
- Show only stages that **fired** (non-NULL)
- Each stage is a collapsible section with pretty-printed, syntax-highlighted JSON
- **Timing table** rendered from `stat` field alongside the pipeline stages
- Key data extracted and highlighted (intent, route decision, tool calls, entity names)

### Rendering Strategy for Large JSON
- `router` and `agent` fields can be enormous (clinic content, knowledge graph queries)
- Default: show a **summary view** with key fields extracted
- Click to expand → full pretty-printed JSON in a scrollable, collapsible tree

## Tech Stack

- **TypeScript**
- **Node.js** server (HTTP API + static file serving)
- **MySQL client** (read-only queries only)
- **Frontend**: vanilla HTML/CSS/JS or lightweight framework (no heavy SPA framework needed)

## Configuration

Config file: `~/.tracebug/settings.json`

```json
{
  "db": {
    "host": "localhost",
    "port": 3306,
    "user": "readonly_user",
    "password": "...",
    "database": "production_db"
  }
}
```

The tool only executes read-only SELECT queries. No write permissions needed.

## Out of Scope (for now)

- Filtering / searching within sessions
- Comparing messages side-by-side
- Error / anomaly detection
- Authentication (local tool, trusted environment)
- SSH tunnel management (user sets up tunnel separately if needed)

## Usage

```bash
# Start the server
npx tracebug
# or
npm start

# Opens at http://localhost:3000 (or configured port)
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode with hot reload
npm run dev

# Build
npm run build
```
