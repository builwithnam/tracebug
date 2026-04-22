# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Quick Start (Makefile)
make help                             # Show all available commands
make dev                              # Start development environment (web + API servers)
make build                            # Build all packages
make test                             # Run all tests
make install                          # Install dependencies
make clean                            # Clean build artifacts and cache

# Development (pnpm)
pnpm install                          # Install dependencies
pnpm build                            # Build all packages (turbo cached)
pnpm dev                              # Watch mode for all packages
pnpm --filter web dev                 # Start Next.js dev server
pnpm --filter @tracebug/server dev    # Start Express API server

# Testing
pnpm test                             # Run all tests (vitest)
pnpm --filter @tracebug/server test   # Run server tests
pnpm --filter @tracebug/server test:watch  # Watch mode for server tests

# Linting & Formatting
pnpm lint                             # Lint all packages
pnpm lint:fix                         # Lint and fix all packages
pnpm format                           # Format with Prettier
pnpm check                            # Lint + format check

# Type Checking
pnpm --filter @tracebug/server type-check  # Type check server
pnpm --filter @tracebug/core type-check    # Type check core package
```

## Architecture

Backend + monorepo frontend (pnpm workspaces + Turborepo) with shared packages.

```
tracebug/
├── server/                # Express API server (Node.js, ESM)
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

## Documentation

- **DO NOT create summary docs after every task** - Only create documentation summaries for:
  - Major refactors or architecture changes
  - New features or significant additions
  - Breaking changes or migration guides
  - One-time setup tasks
- **Small tasks** (bug fixes, minor edits, small improvements) should NOT generate summary docs
- **Documentation location**: Use `docs/` folder for project documentation, keep root directory clean

## When Working with Database

The database layer is in `server/src/db.ts`. It uses a singleton connection pool.
- Always release connections (handled by `getConnection()`/`release()` pattern)
- The pool is reused across requests via `getPool()`
- Tests create/drop a test database automatically
