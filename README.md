# tracebug

A local web UI for debugging chatbot session traces. Paste a `share_id` → get a human-readable session trace showing the full conversation and pipeline stages with collapsible, pretty-printed JSON.

## Quick Start

```bash
pnpm install
pnpm build
pnpm --filter web start
```

This starts a local server and opens the browser at `http://localhost:3000`.

## Monorepo Structure

```
tracebug/
├── apps/
│   └── web/                  # Web UI + API server (Node.js)
├── packages/
│   ├── core/                 # @tracebug/core — headless business logic
│   └── tsconfig/             # @tracebug/tsconfig — shared TypeScript config
├── turbo.json
└── pnpm-workspace.yaml
```

### `@tracebug/core`

Platform-agnostic package with zero runtime dependencies. Contains domain types, pipeline stage parsing, and response shaping. Reusable across any consumer (CLI, browser, different server frameworks).

### `apps/web`

The web application — thin HTTP server that uses `@tracebug/core` for business logic and `mysql2` for database access.

## Commands

```bash
pnpm build          # Build all packages (turbo cached)
pnpm dev            # Watch mode for all packages
pnpm test           # Run tests (vitest)
pnpm lint           # Lint all packages
pnpm check          # Lint + format check
```

## Configuration

Create `~/.tracebug/settings.json`:

```json
{
  "db": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your-password",
    "database": "bc_app"
  },
  "port": 3000
}
```

## Terminology

| Term | Meaning |
|------|---------|
| **Session** | A conversation between a user and the chatbot |
| **Trace** | The full pipeline execution data for a session |
| **Share ID** | Public-facing identifier that maps to a session |
| **Pipeline Stage** | A named processing step (querier, router, scenario_selector, agent, generator, questioner) |

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Build:** TypeScript, Turborepo
- **Package manager:** pnpm workspaces
- **Testing:** Vitest
- **Database:** MySQL (mysql2)
- **Frontend:** Vanilla HTML/CSS/JS
