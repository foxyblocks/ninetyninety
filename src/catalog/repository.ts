import { getDatabase } from "@/db"
import type { CatalogMovie, DisplayMovie } from "./types"

const CATALOG_LOCK_KEY = "ninetyninety.catalog.refresh"

interface IngestRunRow {
  id: string
  status: string
}

export async function claimIngestRun(runKey: string, source: string) {
  const { client } = getDatabase()
  const claimed = (await client`
    INSERT INTO ingest_runs (run_key, source, mode, status)
    VALUES (${runKey}, ${source}, 'full', 'running')
    ON CONFLICT (run_key) DO UPDATE
    SET status = 'running', error = NULL, started_at = now(), completed_at = NULL
    WHERE ingest_runs.status = 'failed'
    RETURNING id, status
  `) as IngestRunRow[]

  if (claimed[0]) return { claimed: true as const, runId: claimed[0].id }

  const existing = (await client`
    SELECT id, status FROM ingest_runs WHERE run_key = ${runKey} LIMIT 1
  `) as IngestRunRow[]

  return {
    claimed: false as const,
    runId: existing[0]?.id,
    status: existing[0]?.status ?? "unknown",
  }
}

export async function failIngestRun(runId: string, error: string) {
  const { client } = getDatabase()
  await client`
    UPDATE ingest_runs
    SET status = 'failed', error = ${error.slice(0, 2000)}, completed_at = now()
    WHERE id = ${runId}::uuid
  `
}

export async function reconcileCatalog(runId: string, source: string, catalog: CatalogMovie[]) {
  const { client } = getDatabase()
  const payload = JSON.stringify(catalog)

  // All catalog mutations share one HTTP transaction. Readers therefore see either the
  // previous complete catalog or the next complete catalog, never a partial refresh.
  await client.transaction([
    client`SELECT pg_advisory_xact_lock(hashtextextended(${CATALOG_LOCK_KEY}, 0))`,
    client`
      UPDATE movies
      SET active = false, updated_at = now()
      WHERE source = ${source} AND active = true
    `,
    client`
      WITH input AS (
        SELECT *
        FROM jsonb_to_recordset(${payload}::jsonb) AS movie(
          id text,
          "sourceId" text,
          title text,
          year integer,
          genres text[],
          critics integer,
          audience integer,
          "criticReviews" integer,
          "audienceRatings" integer,
          director text,
          runtime text,
          poster text,
          "rtUrl" text,
          blurb text
        )
      )
      INSERT INTO movies (
        id, source, source_id, title, release_year, genres, critics, audience,
        critic_reviews, audience_ratings, director, runtime, poster_url, rt_url, blurb,
        active, first_seen_at, last_seen_at, updated_at
      )
      SELECT
        id, ${source}, "sourceId", title, year, COALESCE(genres, ARRAY[]::text[]),
        critics, audience, "criticReviews", "audienceRatings", director, runtime,
        poster, "rtUrl", blurb, true, now(), now(), now()
      FROM input
      ON CONFLICT (id) DO UPDATE SET
        source = EXCLUDED.source,
        source_id = EXCLUDED.source_id,
        title = EXCLUDED.title,
        release_year = EXCLUDED.release_year,
        genres = EXCLUDED.genres,
        critics = EXCLUDED.critics,
        audience = EXCLUDED.audience,
        critic_reviews = EXCLUDED.critic_reviews,
        audience_ratings = EXCLUDED.audience_ratings,
        director = EXCLUDED.director,
        runtime = EXCLUDED.runtime,
        poster_url = EXCLUDED.poster_url,
        rt_url = EXCLUDED.rt_url,
        blurb = EXCLUDED.blurb,
        active = true,
        last_seen_at = now(),
        updated_at = now()
    `,
    client`
      WITH input AS (
        SELECT *
        FROM jsonb_to_recordset(${payload}::jsonb) AS movie(
          id text,
          critics integer,
          audience integer,
          "criticReviews" integer,
          "audienceRatings" integer
        )
      )
      INSERT INTO score_snapshots (
        movie_id, ingest_run_id, critics, audience, critic_reviews, audience_ratings
      )
      SELECT
        id, ${runId}::uuid, critics, audience, "criticReviews", "audienceRatings"
      FROM input
      ON CONFLICT (ingest_run_id, movie_id) DO NOTHING
    `,
    client`
      UPDATE ingest_runs
      SET
        status = 'succeeded',
        received_count = ${catalog.length},
        qualified_count = ${catalog.length},
        completed_at = now()
      WHERE id = ${runId}::uuid
    `,
  ])
}

interface MovieRow {
  id: string
  source_id: string
  title: string
  release_year: number
  genres: string[]
  critics: number
  audience: number
  critic_reviews: number | null
  audience_ratings: number | null
  director: string | null
  runtime: string | null
  poster_url: string | null
  rt_url: string | null
  blurb: string | null
  active: boolean
}

export async function getActiveMovies(): Promise<DisplayMovie[]> {
  const { client } = getDatabase()
  const rows = (await client`
    SELECT
      id, source_id, title, release_year, genres, critics, audience,
      critic_reviews, audience_ratings, director, runtime, poster_url, rt_url, blurb, active
    FROM movies
    WHERE active = true
    ORDER BY LEAST(critics, audience) DESC, title ASC
  `) as MovieRow[]

  return rows.map((movie) => ({
    id: movie.id,
    sourceId: movie.source_id,
    title: movie.title,
    year: movie.release_year,
    genres: movie.genres,
    critics: movie.critics,
    audience: movie.audience,
    criticReviews: movie.critic_reviews ?? undefined,
    audienceRatings: movie.audience_ratings ?? undefined,
    director: movie.director ?? undefined,
    runtime: movie.runtime ?? undefined,
    poster: movie.poster_url ?? undefined,
    rtUrl: movie.rt_url ?? undefined,
    blurb: movie.blurb ?? undefined,
    active: movie.active,
  }))
}

export async function getLatestSuccessfulRefresh() {
  const { client } = getDatabase()
  const rows = (await client`
    SELECT completed_at, qualified_count
    FROM ingest_runs
    WHERE status = 'succeeded'
    ORDER BY completed_at DESC
    LIMIT 1
  `) as Array<{ completed_at: string; qualified_count: number }>

  return rows[0]
}
