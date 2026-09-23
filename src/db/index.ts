import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")

  const client = neon(databaseUrl)
  return {
    client,
    db: drizzle({ client, schema }),
  }
}

let database: ReturnType<typeof createDatabase> | undefined

// Lazy initialization keeps builds and static analysis from requiring production credentials.
export function getDatabase() {
  database ??= createDatabase()
  return database
}
