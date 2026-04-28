# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `README.md` for a full feature/route/endpoint reference. This file captures the non-obvious bits.

## Repo layout

Turborepo + pnpm workspaces. Three workspaces:

- `apps/web` — Next.js 16 App Router frontend (port 3000)
- `apps/api` — NestJS 11 backend, port 3001, global `/api` prefix (set in `apps/api/src/main.ts`)
- `packages/shared` — `@outsauce/shared` — types, Zod schemas, plan/source constants. Imported by both `web` and `api`. Edit here, not in app-local copies.

`apps/web/CLAUDE.md` exists and pulls in `apps/web/AGENTS.md`. **Critical:** Next.js in `apps/web` is a non-standard version with breaking changes vs. trained knowledge. Before writing frontend code, read `apps/web/node_modules/next/dist/docs/` for the relevant API.

## Common commands

Run from repo root:

```bash
pnpm dev:web              # Next.js dev (3000)
pnpm dev:api              # NestJS watch mode (3001)
pnpm build:web | build:api
pnpm lint                 # turbo lint across workspaces
```

API tests (run from `apps/api`):

```bash
pnpm test                 # jest unit specs (*.spec.ts under src/)
pnpm test:e2e             # jest -c test/jest-e2e.json
pnpm test -- path/to/file.spec.ts   # single file
pnpm test -- -t "name"    # by test name
```

Supabase (Docker required):

```bash
npx supabase start        # local stack — copy URL + keys into .env
npx supabase db reset     # re-run all migrations in supabase/migrations/
npx supabase functions serve send-contact-email --no-verify-jwt --env-file .env
```

## Architecture notes

**Auth flow.** Frontend uses `@supabase/ssr`. `apps/web/middleware.ts` refreshes the session on every request and clears stale tokens. The `apiClient` (`apps/web/src/lib/api-client.ts`) attaches the Supabase access token as a Bearer to every NestJS call. On the API, `SupabaseAuthGuard` validates the token; `@CurrentUser()` extracts the user. Admin routes layer `AdminGuard` (checks `profiles.is_admin`).

**Two Supabase clients on the API.** `SupabaseService` exposes both an admin (service-role) client and a per-user client. Use the user client for anything that should respect RLS; use admin only for server-only operations (webhooks, admin module, triggers).

**Validation.** Request bodies validated by `ZodValidationPipe` against schemas exported from `@outsauce/shared/schemas`. Add new schemas there, not inline in modules.

**Realtime.** Three tables are published: `messages`, `scrape_jobs`, `notifications`. Frontend hooks (`use-realtime-scrape`, `use-realtime-messages`) subscribe via the browser Supabase client. Don't poll these — subscribe.

**Scraping is external.** The API doesn't scrape. It triggers an n8n workflow via webhook; n8n posts results back to `POST /api/webhooks/n8n/results`. The webhooks module is the only public (unauth) API surface — protected by `N8N_WEBHOOK_SECRET`.

**Plan limits enforced server-side.** `PLAN_LIMITS` in `packages/shared/src/constants/plans.ts` is the single source of truth for Free/Starter/Pro/Enterprise quotas. Usage is tracked per-period in the `usage` table and checked in service methods before creating scrapes/leads/AI generations.

**RLS everywhere.** All tables have Row Level Security enabled. When adding a migration, write the policy in the same file. `contact_submissions` is the only table allowing anon inserts.

**Profile auto-creation.** A trigger on `auth.users` insert creates the `profiles`, `subscriptions` (free), and `usage` rows. Don't create them manually in app code.

## Conventions

- Shared code goes in `packages/shared` — types in `src/types/`, Zod schemas in `src/schemas/`, constants in `src/constants/`. Import as `@outsauce/shared`.
- New API modules follow the existing pattern: `controller.ts`, `service.ts`, `module.ts`, register in `app.module.ts`.
- New protected pages go under `apps/web/src/app/(dashboard)/`; auth pages under `(auth)/`. The route group layouts handle chrome.
- UI components: shadcn/ui v4 with the **base-nova** style (built on `@base-ui/react`, not Radix primitives directly except where already imported). Add new ones via `npx shadcn add <name>` from `apps/web`.
- Design tokens live in `apps/web/src/app/globals.css` (OKLCH + brand vars). Don't hardcode colors — use the tokens.
- Default Anthropic model is `claude-opus-4-7`; override via `ANTHROPIC_MODEL`. Per-tool system prompts use prompt caching. AI endpoints return 503 if `ANTHROPIC_API_KEY` is unset.
