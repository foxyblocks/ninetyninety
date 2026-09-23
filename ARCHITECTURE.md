# NinetyNinety Architecture

**Status:** Implementation in progress. This document distinguishes the target system from the legacy production path until cutover is verified.

## Product rule

NinetyNinety is a movie discovery app for titles whose Rotten Tomatoes critics score and audience score are both strictly greater than 90. The product should show the current qualifying catalog while retaining enough history to explain when a movie entered or left it.

## Target system

```text
MDBList
   │
   ▼
Vercel Cron ──► catalog refresh function ──► Neon Postgres
                                                    ▲
                                                    │
                                  Next.js UI + API routes

GitHub ──► CI checks ──► Vercel deployment
```

The application has one production runtime: Vercel. Neon owns durable relational data. GitHub owns source control and CI, but does not normally schedule product work.

### Vercel

Vercel hosts the Next.js application, server-rendered pages, API routes, and scheduled catalog refresh.

- A daily Vercel Cron invokes `GET /api/cron/refresh-catalog`.
- The route verifies `CRON_SECRET`, runs the refresh, records its result, and returns a useful status.
- The refresh should comfortably fit inside a normal Vercel Function. If it later needs fan-out, durable retries, or more than the function time limit, move the orchestration to Vercel Workflow or Queues rather than rebuilding a queue inside the app.
- A separate public `/api/ingest` route is unnecessary when the scheduler and worker live in the same app.

### Catalog refresh module

Provider and business logic should live in a framework-independent TypeScript module rather than directly in the route handler. The same module can be used by the cron route, tests, and a manual backfill command.

Its responsibilities are:

1. Fetch the configured MDBList list and any missing movie details.
2. Normalize provider responses around the TMDB ID.
3. Keep only movies where both scores are greater than 90.
4. Reject suspiciously small, oversized, partial, or malformed results.
5. Reconcile the complete result into the database.

The provider adapter owns pagination, rate-limit handling, and retries. It must never publish a partial catalog after an upstream failure.

### Neon Postgres

Neon is the proposed database because it preserves Postgres while fitting a portfolio of small, mostly idle apps. The minimum useful model is:

- `movies`: stable movie identity, display metadata, current scores, and current qualification state.
- `score_snapshots`: score history captured during successful refreshes.
- `ingest_runs`: start/end timestamps, source, counts, status, and failure details.

TMDB ID is the stable external key. A full refresh updates or inserts current movies and marks absent movies inactive; it does not delete their history.

The refresh must be repeat-safe (idempotent). Re-running the same input should converge on the same state. A database lock prevents overlapping refreshes, and the visible catalog changes only after the complete replacement succeeds.

### Next.js UI

The UI reads the active catalog from Neon through server-side data access. Chakra UI remains the component and styling system. Initial product scope is the movie grid, search, filtering, and sorting; authentication and user-specific features are later concerns.

## Configuration and secrets

Production runtime configuration belongs in Vercel:

- `DATABASE_URL`
- `MDBLIST_API_KEY`
- `MDBLIST_LIST_URL`
- `CRON_SECRET`
- `NINETY_NINETY_MIN_MOVIES`

Only server-side code may access database credentials and provider secrets. GitHub should not retain duplicate runtime secrets after the Vercel cutover.

## GitHub Actions

GitHub Actions remains responsible for linting, formatting, unit tests, builds, and migration checks. A manually triggered workflow may remain for exceptional backfills, but the normal daily refresh should not depend on Actions.

## Current state

The repository currently contains a working MDBList fetch/normalize/validate script, a placeholder Vercel homepage, and an unused Supabase client helper. It does not contain a Vercel ingest or cron route.

The scheduled GitHub workflow still posts the validated catalog to the older GPT Site. That Site has its own database, but its ingest endpoint is misconfigured and the scheduled runs fail after validation. The GPT Site and its database are temporary legacy infrastructure, not part of the target architecture.

## Cutover sequence

1. Provision Neon and commit the initial schema migration.
2. Recover any data worth keeping from the old Site or paused Supabase project.
3. Refactor the existing ingest script into the shared catalog module and add the secured Vercel cron route.
4. Make the Next.js UI read the Neon catalog.
5. Deploy, run a guarded production refresh, verify the UI, then remove the GitHub schedule and retire the GPT Site path.

Until step 5 is verified, the old system should not be treated as successfully migrated.
