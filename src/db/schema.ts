import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const ingestRuns = pgTable(
  "ingest_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runKey: text("run_key").notNull(),
    source: text("source").notNull(),
    mode: text("mode").notNull().default("full"),
    status: text("status").notNull().default("running"),
    receivedCount: integer("received_count"),
    qualifiedCount: integer("qualified_count"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ingest_runs_run_key_unique").on(table.runKey),
    index("ingest_runs_started_at_idx").on(table.startedAt),
  ]
)

export const movies = pgTable(
  "movies",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
    releaseYear: integer("release_year").notNull(),
    genres: text("genres").array().notNull().default([]),
    critics: integer("critics").notNull(),
    audience: integer("audience").notNull(),
    criticReviews: integer("critic_reviews"),
    audienceRatings: integer("audience_ratings"),
    director: text("director"),
    runtime: text("runtime"),
    posterUrl: text("poster_url"),
    rtUrl: text("rt_url"),
    blurb: text("blurb"),
    active: boolean("active").notNull().default(true),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("movies_source_identity_unique").on(table.source, table.sourceId),
    index("movies_active_title_idx").on(table.active, table.title),
  ]
)

export const scoreSnapshots = pgTable(
  "score_snapshots",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    movieId: text("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    ingestRunId: uuid("ingest_run_id")
      .notNull()
      .references(() => ingestRuns.id, { onDelete: "cascade" }),
    critics: integer("critics").notNull(),
    audience: integer("audience").notNull(),
    criticReviews: integer("critic_reviews"),
    audienceRatings: integer("audience_ratings"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("score_snapshots_run_movie_unique").on(table.ingestRunId, table.movieId),
    index("score_snapshots_movie_captured_idx").on(table.movieId, table.capturedAt),
  ]
)
