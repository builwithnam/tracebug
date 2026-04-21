# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm install                       # Install dependencies
pnpm build                         # Build all packages (turbo cached)
pnpm dev                           # Watch mode for all packages
pnpm --filter web dev              # Start Next.js dev server
pnpm --filter @tracebug/server dev # Start Express API server
```

### Testing
```bash
pnpm test                                    # Run all tests (vitest)
pnpm --filter @tracebug/server test          # Run server tests
pnpm --filter @tracebug/server test:watch    # Watch mode for server tests
```

### Linting & Formatting
```bash
pnpm lint                 # Lint all packages
pnpm lint:fix             # Lint and fix all packages
pnpm format               # Format with Prettier
pnpm check                # Lint + format check
```

### Type Checking
```bash
pnpm --filter @tracebug/server type-check  # Type check server
pnpm --filter @tracebug/core type-check    # Type check core package
```

## Architecture

This is a **pnpm workspace monorepo** using **Turborepo** for task orchestration.

```
tracebug/
├── server/                # @tracebug/server — Express API server (Node.js, ESM)
│   ├── src/
│   │   ├── index.ts       # Express entry point
│   │   ├── config.ts      # Loads ~/.tracebug/settings.json
│   │   ├── db.ts          # MySQL connection pool and queries
│   │   └── routes/
│   │       └── session.ts # GET /api/session route
│   └── tests/             # Server tests (session, db, config, integration)
├── apps/web/              # Next.js frontend (App Router)
│   └── src/app/
│       ├── page.tsx       # Landing page (enter share ID)
│       └── session/       # Session view (reads share_id from URL)
├── packages/
│   ├── core/              # @tracebug/core — headless business logic
│   ├── ui/                # @tracebug/ui — React UI components
│   └── tsconfig/          # @tracebug/tsconfig — shared TypeScript config
├── turbo.json             # Turborepo task pipeline configuration
└── pnpm-workspace.yaml    # Workspace definitions
```

### @tracebug/core
Platform-agnostic package with **zero runtime dependencies**. Contains:
- Domain types (`DbConfig`, `AppConfig`, `Message`, `MessageData`, `SessionData`)
- Pipeline stage parsing (`parseStage`, `parseAllStages`, `parseStat`)
- Response shaping (`messageToResponse`, `groupTracesByMessageId`)

### @tracebug/server
Independent Express API server. Contains:
- Entry point: `src/index.ts` — Express app with CORS, JSON parsing
- Routes: `src/routes/session.ts` — GET endpoint for session traces
- Database: `src/db.ts` — MySQL connection pool and queries
- Config: `src/config.ts` — loads `~/.tracebug/settings.json`

### apps/web (Next.js)
Next.js frontend using App Router. Two routes:
- `/` — Landing page (enter share ID)
- `/session?share_id=xxx` — Session trace view
- Uses `@tracebug/ui` components, `next.config.ts` rewrites `/api/*` to Express server

## Configuration

Database config is loaded from `~/.tracebug/settings.json`:

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

## Testing

Tests use **Vitest**. Test files use `*.test.ts` pattern.
- Server tests are in `server/tests/`
- Integration tests set up a fresh MySQL database for each run
- Tests use `beforeAll`/`afterAll` for database setup/teardown

## Terminology

| Term | Meaning |
|------|---------|
| **Session** | A conversation between a user and the chatbot |
| **Trace** | The full pipeline execution data for a session |
| **Share ID** | Public-facing identifier that maps to a session |
| **Pipeline Stage** | A named processing step (querier, router, scenario_selector, agent, generator, questioner) |

## Code Style

- **ESM only**: All files use `.js` extensions in imports (TypeScript emits ESM)
- **Prettier**: 100 char line width, double quotes, trailing commas, semicolons
- **ESLint**: `@_` prefix for unused vars, no explicit `any` (warn)
- **TypeScript**: Strict mode via `@tracebug/tsconfig`

## When Working with Database

The database layer is in `server/src/db.ts`. It uses a singleton connection pool.
- Always release connections (handled by `getConnection()`/`release()` pattern)
- The pool is reused across requests via `getPool()`
- Tests create/drop a test database automatically
