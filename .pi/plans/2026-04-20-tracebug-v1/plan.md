# Plan: tracebug v1

## Architecture

```
src/
├── index.ts              # Entry point — starts server, opens browser
├── server.ts             # HTTP server (API + static file serving)
├── db.ts                 # MySQL connection + queries (read-only)
├── config.ts             # Reads ~/.tracebug/settings.json
├── api/
│   └── session.ts        # GET /api/session?share_id=xxx — 3-table join
└── public/
    ├── index.html         # Single-page app (landing + session view)
    ├── style.css          # All styles
    └── app.js             # Client-side rendering (vanilla JS)
```

No build step for the frontend — vanilla HTML/CSS/JS served directly. TypeScript compiles the server only.

## Data Flow

```
1. User pastes share_id in browser
2. Browser fetches GET /api/session?share_id=abc123
3. Server:
   a. SELECT session_id FROM share WHERE id = ?
   b. SELECT * FROM message WHERE session_id = ? ORDER BY id
   c. SELECT * FROM message_data WHERE session_id = ? ORDER BY id
   d. Shape into clean JSON payload
4. Frontend renders conversation timeline + trace data
```

## API Response Shape

```json
{
  "share_id": "abc123",
  "session_id": "sess_456",
  "messages": [
    {
      "id": 1,
      "type": "user",
      "text": "Where is the nearest clinic?",
      "created_at": "2025-04-14T10:00:00Z",
      "quick_replies": null,
      "buttons": null
    },
    {
      "id": 2,
      "type": "assistant",
      "text": "I found 3 clinics near you...",
      "created_at": "2025-04-14T10:00:05Z",
      "quick_replies": null,
      "buttons": null
    }
  ],
  "traces": [
    {
      "id": 101,
      "created_at": "2025-04-14T10:00:00Z",
      "stages": {
        "querier": { "raw": "...", "summary": { "language": "vi", "intent": "clinic", "model": "gpt-4.1" } },
        "router": null,
        "scenario_selector": null,
        "agent": { "raw": "...", "summary": { "entities_found": 3, "query": "..." } },
        "generator": { "raw": "...", "summary": { "sources_count": 3 } },
        "questioner": null,
        "stat": { "querierDuration": 120, "routerDuration": null, "agentDuration": 1500, ... }
      }
    }
  ]
}
```

Server parses each stage's raw JSON and extracts summary fields. Frontend receives both `summary` (for cards) and `raw` (for expandable JSON tree). This keeps the frontend thin — all LangChain unwrapping happens server-side.

## Server: Stage Parsing Strategy

Each stage column is a JSON string containing a LangChain AIMessage wrapper. Server parsing:

1. `JSON.parse()` the column value
2. Unwrap LangChain boilerplate: navigate through `message.kwargs.additional_kwargs.tool_calls` etc.
3. Extract high-signal fields into `summary` object (stage-specific schemas)
4. Keep original parsed JSON as `raw` for the expandable tree view
5. For `stat`: parse and return as flat key-value timing object

Stage-specific summary extraction (v1 hardcoded):

- **querier**: language, intent, model, tokenUsage (prompt/completion/total)
- **router**: matched scenario, intent, search type, cypher query (truncated if long)
- **scenario_selector**: matched scenario name, flow ID
- **agent**: entities found (names + IDs), source count, query summary
- **generator**: summary text, source count, memory state highlights (province, service, turn count)
- **questioner**: question text
- **stat**: all duration fields as ms values

## Frontend UX

### Landing (no share_id)
- Centered input field: "Enter share_id"
- Submit on Enter or button click
- Client-side navigation: `/#share_id=abc123` or just re-renders

### Session View (share_id loaded)
- **Header**: share_id, session_id, message count
- **Conversation timeline**: vertical list of messages
  - Each message: type badge (color-coded: user=blue, assistant=green, system=gray), text content, timestamp
  - Click to expand → shows trace data for that message
- **Trace panel** (expanded message):
  - Pipeline path indicator: `querier → agent → generator` (gray out skipped stages)
  - Timing bar/table from stat (visual: simple horizontal bars showing relative durations)
  - One collapsible section per fired stage
  - Each stage: summary card (key-value pairs) + expand button for raw JSON tree

### JSON Tree Component
- Built from scratch (vanilla JS)
- Collapsible nodes with ▶/▼ indicators
- String/number/boolean/null with distinct colors
- Truncate long strings, click to expand
- Max render depth ~10 levels, deeper levels load on expand

## NPM Package

```json
{
  "name": "tracebug",
  "version": "0.1.0",
  "bin": { "tracebug": "./dist/index.js" },
  "files": ["dist/", "src/public/"],
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  }
}
```

Dependencies:
- `mysql2` — MySQL client with promise support
- `open` — cross-platform "open browser" (or use child_process)
- `tsx` — dev dependency for TypeScript execution

## Config

Reads `~/.tracebug/settings.json`. Fail fast with clear error if missing.

## Implementation Order

1. Project scaffold (package.json, tsconfig, dir structure)
2. Config loading
3. Database layer (connection, queries)
4. API endpoint (3-table join, response shaping)
5. Stage parsing + summary extraction
6. Frontend HTML structure + CSS
7. Client-side JS (fetch, render conversation, render traces)
8. JSON tree component
9. Entry point (start server, open browser)
10. Polish: error states, loading states, edge cases
