# tracebug

A tool for debugging chatbot session traces. Paste a `share_id` → get a human-readable session trace showing the full conversation and pipeline stages.

- **Web UI:** Browser-based interface with collapsible, pretty-printed JSON
- **CLI:** Command-line tool for programmatic access and AI agents

## Quick Start

### Web UI

```bash
pnpm install
pnpm build
pnpm --filter web start
```

This starts a local server at `http://localhost:3000`.

### CLI

```bash
npx tracebug@latest abc123
```

See [CLI_INSTALL.md](CLI_INSTALL.md) for detailed installation instructions for AI agents.

## Monorepo Structure

```
tracebug/
├── apps/
│   └── web/                  # Web UI (Next.js)
├── packages/
│   ├── cli/                  # tracebug — CLI tool
│   ├── core/                 # @tracebug/core — headless business logic
│   ├── ui/                   # @tracebug/ui — React UI components
│   └── tsconfig/             # @tracebug/tsconfig — shared TypeScript config
├── server/                   # Express API server
├── turbo.json
└── pnpm-workspace.yaml
```

### `@tracebug/core`

Platform-agnostic package with zero runtime dependencies. Contains domain types, pipeline stage parsing, and response shaping. Reusable across any consumer (CLI, browser, different server frameworks).

### `packages/cli`

Command-line tool for querying session traces. Uses `@tracebug/core` for business logic and `mysql2` for database access. Supports JSON output for AI agent integration.

### `apps/web`

The web application — Next.js app that uses `@tracebug/core` and `@tracebug/ui` for the interface, with API routes using `mysql2` for database access.

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
