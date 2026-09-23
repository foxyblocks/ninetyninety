CREATE TABLE "ingest_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_key" text NOT NULL,
	"source" text NOT NULL,
	"mode" text DEFAULT 'full' NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"received_count" integer,
	"qualified_count" integer,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"release_year" integer NOT NULL,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"critics" integer NOT NULL,
	"audience" integer NOT NULL,
	"critic_reviews" integer,
	"audience_ratings" integer,
	"director" text,
	"runtime" text,
	"poster_url" text,
	"rt_url" text,
	"blurb" text,
	"active" boolean DEFAULT true NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "score_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"movie_id" text NOT NULL,
	"ingest_run_id" uuid NOT NULL,
	"critics" integer NOT NULL,
	"audience" integer NOT NULL,
	"critic_reviews" integer,
	"audience_ratings" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "public"."ingest_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingest_runs_run_key_unique" ON "ingest_runs" USING btree ("run_key");--> statement-breakpoint
CREATE INDEX "ingest_runs_started_at_idx" ON "ingest_runs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "movies_source_identity_unique" ON "movies" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "movies_active_title_idx" ON "movies" USING btree ("active","title");--> statement-breakpoint
CREATE UNIQUE INDEX "score_snapshots_run_movie_unique" ON "score_snapshots" USING btree ("ingest_run_id","movie_id");--> statement-breakpoint
CREATE INDEX "score_snapshots_movie_captured_idx" ON "score_snapshots" USING btree ("movie_id","captured_at");