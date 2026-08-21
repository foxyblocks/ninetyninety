import { pathToFileURL } from "node:url"

const MDBLIST_API_HOST = "api.mdblist.com"
const RT_HOST = "www.rottentomatoes.com"
const MAX_MOVIES = 2000

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null
}

function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function firstString(...values) {
  for (const value of values) {
    const candidate = asString(value)
    if (candidate) return candidate
  }
  return null
}

function firstNumber(...values) {
  for (const value of values) {
    const candidate = asNumber(value)
    if (candidate !== null) return candidate
  }
  return null
}

function getIds(movie) {
  return asRecord(movie.ids) ?? {}
}

function getTmdbId(movie) {
  const ids = getIds(movie)
  const id = firstNumber(ids.tmdb, movie.tmdb_id, movie.tmdb)
  return id !== null && Number.isInteger(id) && id > 0 ? String(id) : null
}

function getRating(movie, sourceNames) {
  const ratings = Array.isArray(movie.ratings) ? movie.ratings : []
  for (const item of ratings) {
    const rating = asRecord(item)
    const source = rating && asString(rating.source)?.toLowerCase()
    if (rating && source && sourceNames.includes(source)) return rating
  }
  return null
}

function ratingScore(rating) {
  if (!rating) return null
  const value = firstNumber(rating.score, rating.value, rating.rating)
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 100 ? value : null
}

function ratingVotes(rating) {
  if (!rating) return undefined
  const value = asNumber(rating.votes)
  return value !== null && Number.isInteger(value) && value >= 0 ? value : undefined
}

function normalizeGenres(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") return asString(item)
      const record = asRecord(item)
      return record ? firstString(record.title, record.name) : null
    })
    .filter(Boolean)
}

function rottenTomatoesUrl(rating) {
  const raw = rating ? asString(rating.url) : null
  if (!raw) return undefined
  if (raw.startsWith("/")) return `https://${RT_HOST}${raw}`
  try {
    const url = new URL(raw)
    return url.hostname === RT_HOST || url.hostname === "rottentomatoes.com" ? url.href : undefined
  } catch {
    return undefined
  }
}

export function normalizeMdblistMovie(value) {
  const movie = asRecord(value)
  if (!movie) return null

  const tmdbId = getTmdbId(movie)
  const title = firstString(movie.title, movie.name)
  const year = firstNumber(movie.year, asString(movie.released)?.slice(0, 4))
  const criticsRating = getRating(movie, ["tomatoes", "tomato"])
  const audienceRating = getRating(movie, ["popcorn", "tomatoesaudience"])
  const critics = ratingScore(criticsRating)
  const audience = ratingScore(audienceRating)

  if (
    !tmdbId ||
    !title ||
    !year ||
    !Number.isInteger(year) ||
    critics === null ||
    audience === null
  ) {
    return null
  }

  const runtime = firstNumber(movie.runtime)
  return {
    id: `tmdb:${tmdbId}`,
    sourceId: tmdbId,
    title,
    year,
    genres: normalizeGenres(movie.genres),
    critics,
    audience,
    criticReviews: ratingVotes(criticsRating),
    audienceRatings: ratingVotes(audienceRating),
    director: firstString(movie.director) ?? undefined,
    runtime: runtime !== null && runtime > 0 ? `${runtime} min` : undefined,
    poster: firstString(movie.poster, movie.poster_url) ?? undefined,
    rtUrl: rottenTomatoesUrl(criticsRating) ?? rottenTomatoesUrl(audienceRating),
    blurb: firstString(movie.description, movie.overview, movie.plot) ?? undefined,
  }
}

export function qualifies(movie) {
  return movie.critics > 90 && movie.audience > 90
}

export function extractListItems(payload) {
  if (Array.isArray(payload)) return payload
  const record = asRecord(payload)
  if (!record) return []
  for (const key of ["movies", "items", "data", "results"]) {
    if (Array.isArray(record[key])) return record[key]
  }
  return []
}

export function extractMovieRef(value) {
  const item = asRecord(value)
  if (!item) return null
  const mediaType = firstString(item.mediatype, item.media_type, item.type)?.toLowerCase()
  if (mediaType && !["movie", "movies"].includes(mediaType)) return null
  const rawId = firstNumber(item.id)
  const tmdbId =
    getTmdbId(item) ?? (rawId !== null && Number.isInteger(rawId) ? String(rawId) : null)
  return tmdbId && /^\d+$/.test(tmdbId) ? { tmdbId } : null
}

function isExplicitNonMovie(value) {
  const item = asRecord(value)
  if (!item) return false
  const mediaType = firstString(item.mediatype, item.media_type, item.type)?.toLowerCase()
  return Boolean(mediaType && !["movie", "movies"].includes(mediaType))
}

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function isDryRun() {
  return ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase())
}

function mdblistUrl(rawUrl, apiKey) {
  const url = new URL(rawUrl)
  if (url.protocol !== "https:" || url.hostname !== MDBLIST_API_HOST) {
    throw new Error(`MDBLIST_LIST_URL must use https://${MDBLIST_API_HOST}`)
  }
  url.searchParams.set("apikey", apiKey)
  return url
}

async function fetchJson(url, options = {}) {
  const attempts = 4
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response
    try {
      response = await fetch(url, {
        ...options,
        headers: { accept: "application/json", ...options.headers },
        signal: AbortSignal.timeout(30000),
      })
    } catch (error) {
      if (attempt === attempts) {
        const hostname = new URL(url).hostname
        const detail = error instanceof Error ? error.message : "network error"
        throw new Error(`Request failed for ${hostname}: ${detail}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)))
      continue
    }

    if (response.ok) return response.json()
    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt === attempts) {
      throw new Error(`Request failed (${response.status}) for ${new URL(url).hostname}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)))
  }
  throw new Error("Request failed after retries")
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length)
  let cursor = 0
  async function worker() {
    while (cursor < values.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()))
  return results
}

async function loadQualifiedMovies(listUrl, apiKey) {
  const payload = await fetchJson(mdblistUrl(listUrl, apiKey))
  const items = extractListItems(payload)
  if (items.length === 0) throw new Error("MDBList returned an empty or unrecognized list response")

  const direct = []
  const refs = []
  let unresolved = 0
  for (const item of items) {
    const normalized = normalizeMdblistMovie(item)
    if (normalized) direct.push(normalized)
    else {
      const ref = extractMovieRef(item)
      if (ref) refs.push(ref)
      else if (!isExplicitNonMovie(item)) unresolved += 1
    }
  }
  if (unresolved > 0) {
    throw new Error(`MDBList returned ${unresolved} movie items without a usable TMDB id`)
  }

  const uniqueRefs = [...new Map(refs.map((ref) => [ref.tmdbId, ref])).values()]
  const hydrated = await mapWithConcurrency(uniqueRefs, 5, async ({ tmdbId }) => {
    const detailUrl = mdblistUrl(`https://${MDBLIST_API_HOST}/tmdb/movie/${tmdbId}`, apiKey)
    const detail = await fetchJson(detailUrl)
    const movie = normalizeMdblistMovie(detail)
    if (!movie) throw new Error(`Incomplete MDBList detail response for TMDB ${tmdbId}`)
    return movie
  })

  const deduplicated = [
    ...new Map([...direct, ...hydrated].map((movie) => [movie.id, movie])).values(),
  ]
  return deduplicated.filter(qualifies)
}

async function publishMovies(movies) {
  const ingestUrl = new URL(requiredEnv("NINETY_NINETY_INGEST_URL"))
  if (ingestUrl.protocol !== "https:" || !ingestUrl.hostname.endsWith(".chatgpt.site")) {
    throw new Error("NINETY_NINETY_INGEST_URL must use HTTPS on a chatgpt.site host")
  }

  const response = await fetchJson(ingestUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${requiredEnv("NINETY_NINETY_INGEST_SECRET")}`,
      "content-type": "application/json",
      "OAI-Sites-Authorization": `Bearer ${requiredEnv("NINETY_NINETY_SITES_TOKEN")}`,
    },
    body: JSON.stringify({ mode: "full", source: "mdblist", movies }),
  })
  return response
}

export async function main() {
  const apiKey = requiredEnv("MDBLIST_API_KEY")
  const listUrl = requiredEnv("MDBLIST_LIST_URL")
  const minimum = Number(process.env.NINETY_NINETY_MIN_MOVIES ?? "25")
  if (!Number.isInteger(minimum) || minimum < 1 || minimum > MAX_MOVIES) {
    throw new Error("NINETY_NINETY_MIN_MOVIES must be an integer between 1 and 2000")
  }

  const movies = await loadQualifiedMovies(listUrl, apiKey)
  if (movies.length < minimum) {
    throw new Error(
      `Guardrail stopped publish: only ${movies.length} qualified movies (minimum ${minimum})`
    )
  }
  if (movies.length > MAX_MOVIES) {
    throw new Error(
      `Guardrail stopped publish: ${movies.length} movies exceeds the API batch limit`
    )
  }

  console.log(`Validated ${movies.length} movies with both Rotten Tomatoes scores above 90`)
  if (isDryRun()) {
    console.log("Dry run complete; the live catalog was not changed")
    return
  }

  const result = await publishMovies(movies)
  console.log(`Published catalog: ${result.catalogSize ?? movies.length} movies`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
