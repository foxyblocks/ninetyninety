# Catalog ingest

The scheduled workflow treats an MDBList dynamic movie list as the discovery source, rechecks every
movie's current `tomatoes` and `popcorn` ratings, and sends one authenticated full reconciliation to
the ChatGPT Site. The Site remains the source of truth for eligibility and enforces the same strict
rule: both scores must be greater than 90.

## MDBList source

Create a dynamic movie list in MDBList with these filters:

- Tomatometer: 91–100
- Popcornmeter: 91–100
- Media type: movies

Use its API items URL as `MDBLIST_LIST_URL`:

`https://api.mdblist.com/lists/<username>/<list-slug>/items`

The adapter only sends the MDBList API key to `https://api.mdblist.com`. It accepts common list
response shapes, hydrates list items through MDBList's TMDB movie endpoint, and uses TMDB IDs as the
catalog's stable movie IDs.

## GitHub configuration

Create these Actions secrets:

| Secret | Purpose |
| --- | --- |
| `MDBLIST_API_KEY` | Reads the saved MDBList list and current ratings. |
| `NINETY_NINETY_INGEST_SECRET` | Authenticates to the Site's `/api/ingest` route. |

Create these Actions variables:

| Variable | Value |
| --- | --- |
| `MDBLIST_LIST_URL` | The MDBList API items URL above. |

The Site ingest URL and the 25-movie safety floor are committed in the workflow because they are
non-secret application configuration.

The same `NINETY_NINETY_INGEST_SECRET` value must be stored as the Site's secret runtime variable
`INGEST_SECRET`.

## Operations

- The schedule runs daily at 08:17 UTC and publishes after validation.
- Merging a workflow or adapter change into `main` also publishes after validation.
- A manual run defaults to dry-run mode. Enable the `publish` input to update production.
- A full result smaller than the safety floor or larger than the Site's 2,000-record limit fails
  before any live write.
- Provider requests retry rate limits and transient server failures. Any missing detail response
  fails the full run instead of publishing a partial catalog.
- A successful full reconciliation hides movies that no longer qualify but retains their score
  history in the Site database.
