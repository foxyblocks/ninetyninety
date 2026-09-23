# Catalog ingest

The production refresh runs as a daily Vercel Cron job. It treats an MDBList dynamic movie list as
the discovery source, rechecks every movie's current `tomatoes` and `popcorn` ratings, and commits
one complete reconciliation to Neon Postgres. Both scores must be strictly greater than 90.

## MDBList source

Create a dynamic movie list in MDBList with these filters:

- Tomatometer: 91–100
- Popcornmeter: 91–100
- Media type: movies

Use its API items URL as `MDBLIST_LIST_URL`:

`https://api.mdblist.com/lists/<username>/<list-slug>/items`

The adapter only sends the MDBList API key to `https://api.mdblist.com`. It accepts common list
response shapes, requests ratings and metadata directly on list pages, and hydrates any remaining
ID-only items through bounded batches on MDBList's TMDB movie endpoint. TMDB IDs remain the
catalog's stable movie IDs.

## Vercel configuration

Configure these environment variables in the Vercel project:

| Variable | Purpose |
| --- | --- |
| `MDBLIST_API_KEY` | Reads the saved MDBList list and current ratings. |
| `MDBLIST_LIST_URL` | MDBList API items URL. |
| `DATABASE_URL` | Neon pooled Postgres connection string. |
| `CRON_SECRET` | Authenticates Vercel's request to the cron route. |
| `NINETY_NINETY_MIN_MOVIES` | Safety floor; defaults to 25. |

## Operations

- Vercel invokes `GET /api/cron/refresh-catalog` daily at 08:17 UTC.
- GitHub Actions retains a manual dry-run workflow for validating the MDBList adapter.
- Add `?force=true` to an authenticated manual cron request to run more than once in one UTC day.
- A full result smaller than the safety floor or larger than the 2,000-record limit fails
  before any live write.
- Provider requests honor `Retry-After` when retrying rate limits and retry transient server
  failures. Any missing detail response fails the full run instead of publishing a partial catalog.
- A successful reconciliation marks movies that no longer qualify inactive while retaining score
  history. Database changes are atomic and repeat-safe.
