# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (turbo cached)
pnpm dev                  # Watch mode for all packages
pnpm --filter web start   # Start the web server (after build)
```

### Testing
```bash
pnpm test                 # Run all tests (vitest)
pnpm --filter web test            # Run web app tests
pnpm --filter web test:watch      # Watch mode for web tests
pnpm --filter web test tests/session.test.ts  # Run single test file
```

### Linting & Formatting
```bash
pnpm lint                 # Lint all packages
pnpm lint:fix             # Lint and fix all packages
pnpm format               # Format with Prettier
pnpm check                # Lint + format check
pnpm --filter web lint    # Lint web app only
pnpm --filter web format  # Format web app only
```

### Type Checking
```bash
pnpm --filter web type-check  # TypeScript type check (no emit)
pnpm --filter @tracebug/core type-check  # Type check core package
```

## Architecture

This is a **pnpm workspace monorepo** using **Turborepo** for task orchestration.

```
tracebug/
├── apps/web/              # Web UI + API server (Node.js, ESM)
├── packages/
│   ├── core/              # @tracebug/core — headless business logic
│   └── tsconfig/          # @tracebug/tsconfig — shared TypeScript config
├── turbo.json             # Turborepo task pipeline configuration
└── pnpm-workspace.yaml    # Workspace definitions
```

### @tracebug/core
Platform-agnostic package with **zero runtime dependencies**. Contains:
- Domain types (`DbConfig`, `AppConfig`, `Message`, `MessageData`, `SessionData`)
- Pipeline stage parsing (`parseStage`, `parseAllStages`, `parseStat`)
- Response shaping (`messageToResponse`, `groupTracesByMessageId`)

### apps/web
Thin HTTP server that uses `@tracebug/core` for business logic and `mysql2` for database access.
- Entry point: `src/index.ts`
- Server: `src/server.ts` — serves static files and handles `/api/session`
- API: `src/api/session.ts` — GET endpoint for session traces
- Database: `src/db.ts` — MySQL connection pool and queries

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

Tests use **Vitest** (migrated from `node:test`). Test files use `*.test.ts` pattern.
- Integration tests set up a fresh MySQL database for each run
- Tests use `beforeAll`/`afterAll` for database setup/teardown
- Mock HTTP request/response objects for API testing

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

The database layer is in `apps/web/src/db.ts`. It uses a singleton connection pool.
- Always release connections (handled by `getConnection()`/`release()` pattern)
- The pool is reused across requests via `getPool()`
- Tests create/drop a test database automatically
