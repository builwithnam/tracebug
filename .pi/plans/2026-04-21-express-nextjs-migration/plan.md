# Plan: Express Server + Next.js Migration

**Date:** 2026-04-21

## Goal

Split the monolithic `apps/web` into:
1. **`server/`** — Independent Express API server (moved from `apps/web/src/server/`)
2. **`apps/web/`** — Next.js frontend using App Router (replaces Vite SPA)

## Current State

```
apps/web/
├── src/server/          # Raw Node.js HTTP server
│   ├── index.ts         # Entry point (creates server, opens browser)
│   ├── server.ts        # http.createServer with static file serving + API
│   ├── config.ts        # Loads ~/.tracebug/settings.json
│   ├── api/session.ts   # GET /api/session handler
│   └── db.ts            # MySQL pool + queries
├── src/frontend/        # Vite React SPA
│   ├── main.tsx
│   ├── App.tsx          # Client-side routing (LandingView / SessionView)
│   ├── globals.css
│   └── views/           # LandingView.tsx, SessionView.tsx
├── index.html
├── vite.config.ts
└── tests/               # Server-side tests (session, db, config, integration)
```

## Target State

```
server/                          # Independent Express API server
├── src/
│   ├── index.ts                 # Express app entry (replaces raw http)
│   ├── config.ts                # Unchanged — loads ~/.tracebug/settings.json
│   ├── db.ts                    # Unchanged — MySQL pool + queries
│   └── routes/
│       └── session.ts           # Express router for /api/session
├── tests/                       # Moved from apps/web/tests/
├── package.json                 # Express, mysql2, @tracebug/core
├── tsconfig.json
├── vitest.config.ts
└── eslint.config.js

apps/web/                        # Next.js frontend (App Router)
├── src/
│   └── app/
│       ├── layout.tsx           # Root layout (html, body, globals.css)
│       ├── page.tsx             # Landing page (enter share ID)
│       ├── globals.css          # Tailwind imports
│       └── session/
│           └── page.tsx         # Session view (reads share_id from URL)
├── package.json                 # Next.js, React, @tracebug/ui
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

## Key Decisions

### 1. Express Server (no static file serving)
- Express handles ONLY API routes (`/api/session`)
- No SPA fallback, no static file serving — that's Next.js's job now
- CORS enabled for cross-origin requests from Next.js dev server
- Config and DB code are unchanged from current implementation

### 2. Next.js App Router
- Two routes: `/` (landing) and `/session?share_id=xxx` (session view)
- Uses `@tracebug/ui` components directly (same as current SPA)
- Server Components where possible; client interactivity via `"use client"`
- `next.config.ts` rewrites `/api/**` to Express server in dev
- API URL configured via `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:3000`)

### 3. Workspace Configuration
- `pnpm-workspace.yaml` adds `server` to packages list
- `turbo.json` stays the same (tasks run in each workspace package)
- `server/` depends on `@tracebug/core`
- `apps/web/` depends on `@tracebug/ui` (which depends on React)

### 4. Tests
- All server tests move to `server/tests/`
- Integration test adapted: no longer tests static file serving (Express is API-only)
- Tests import from `../src/` paths (updated from current `../src/server/`)

## Migration Order

1. Create `server/` with Express — move server code, update imports to Express
2. Create Next.js `apps/web/` — replace Vite SPA with App Router pages
3. Update workspace configs — pnpm-workspace.yaml, turbo.json
4. Clean up — remove old Vite config, tsconfig.frontend.json, etc.
5. Verify — install, build, test
