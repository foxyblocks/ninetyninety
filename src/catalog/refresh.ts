import { randomUUID } from "node:crypto"
import { loadQualifiedMovies } from "./provider"
import { claimIngestRun, failIngestRun, reconcileCatalog } from "./repository"
import type { CatalogRefreshResult } from "./types"

const SOURCE = "mdblist"
const MAX_MOVIES = 2000

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function catalogMinimum() {
  const minimum = Number(process.env.NINETY_NINETY_MIN_MOVIES ?? "25")
  if (!Number.isInteger(minimum) || minimum < 1 || minimum > MAX_MOVIES) {
    throw new Error("NINETY_NINETY_MIN_MOVIES must be an integer between 1 and 2000")
  }
  return minimum
}

function dailyRunKey(force: boolean) {
  const date = new Date().toISOString().slice(0, 10)
  return force ? `${SOURCE}:manual:${date}:${randomUUID()}` : `${SOURCE}:daily:${date}`
}

export async function refreshCatalog({ force = false } = {}): Promise<CatalogRefreshResult> {
  const run = await claimIngestRun(dailyRunKey(force), SOURCE)
  if (!run.claimed) {
    return {
      status: "skipped",
      runId: run.runId,
      reason: `Today's refresh is already ${run.status}`,
    }
  }

  try {
    const movies = await loadQualifiedMovies(
      requiredEnvironmentVariable("MDBLIST_LIST_URL"),
      requiredEnvironmentVariable("MDBLIST_API_KEY")
    )
    const minimum = catalogMinimum()

    if (movies.length < minimum) {
      throw new Error(`Guardrail stopped refresh: ${movies.length} movies is below ${minimum}`)
    }
    if (movies.length > MAX_MOVIES) {
      throw new Error(`Guardrail stopped refresh: ${movies.length} movies exceeds ${MAX_MOVIES}`)
    }

    await reconcileCatalog(run.runId, SOURCE, movies)
    return { status: "succeeded", runId: run.runId, catalogSize: movies.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown catalog refresh failure"
    await failIngestRun(run.runId, message)
    throw error
  }
}
