import { describe, expect, test } from "bun:test"
import {
  extractListItems,
  extractMovieRef,
  fetchResponse,
  loadAllListItems,
  loadQualifiedMovies,
  normalizeMdblistMovie,
  qualifies,
} from "./ingest-mdblist.mjs"

const godfather = {
  title: "The Godfather",
  year: 1972,
  runtime: 175,
  ids: { tmdb: 238 },
  genres: [
    { id: 4, title: "Crime" },
    { id: 6, title: "Drama" },
  ],
  description: "The aging patriarch transfers control to his reluctant son.",
  ratings: [
    { source: "tomatoes", value: 97, votes: 153, url: "/m/the_godfather" },
    { source: "popcorn", value: 98, votes: 41094, url: "/m/the_godfather" },
  ],
}

describe("MDBList normalization", () => {
  test("maps Rotten Tomatoes critic and audience scores", () => {
    expect(normalizeMdblistMovie(godfather)).toEqual({
      id: "tmdb:238",
      sourceId: "238",
      title: "The Godfather",
      year: 1972,
      genres: ["Crime", "Drama"],
      critics: 97,
      audience: 98,
      criticReviews: 153,
      audienceRatings: 41094,
      director: undefined,
      runtime: "175 min",
      poster: undefined,
      rtUrl: "https://www.rottentomatoes.com/m/the_godfather",
      blurb: "The aging patriarch transfers control to his reluctant son.",
    })
  })

  test("enforces the product's strictly-above-90 rule", () => {
    expect(qualifies({ critics: 91, audience: 91 })).toBe(true)
    expect(qualifies({ critics: 90, audience: 99 })).toBe(false)
    expect(qualifies({ critics: 99, audience: 90 })).toBe(false)
  })

  test("accepts common list response shapes and extracts TMDB ids", () => {
    expect(extractListItems({ items: [{ id: 238, mediatype: "movie" }] })).toHaveLength(1)
    expect(extractMovieRef({ ids: { tmdb: 238 }, type: "movie" })).toEqual({ tmdbId: "238" })
    expect(extractMovieRef({ ids: { tmdb: 1399 }, type: "show" })).toBeNull()
  })

  test("accepts the flat tmdbid field returned by detail responses", () => {
    expect(normalizeMdblistMovie({ ...godfather, ids: undefined, tmdbid: 238 })?.id).toBe(
      "tmdb:238"
    )
  })

  test("accepts release_year from list responses with appended ratings", () => {
    expect(normalizeMdblistMovie({ ...godfather, year: undefined, release_year: 1972 })?.year).toBe(
      1972
    )
  })

  test("loads every list page before reconciliation", async () => {
    const offsets = []
    const pages = [
      {
        items: Array.from({ length: 100 }, (_, index) => ({ id: index + 1 })),
        hasMore: "true",
      },
      { items: [{ id: 101 }], hasMore: "false" },
    ]
    const items = await loadAllListItems(
      "https://api.mdblist.com/lists/example/the-90-90/items",
      "test-key",
      async (url) => {
        offsets.push(Number(url.searchParams.get("offset")))
        const page = pages.shift()
        return new Response(JSON.stringify({ items: page.items }), {
          headers: { "X-Has-More": page.hasMore },
        })
      }
    )

    expect(offsets).toEqual([0, 100])
    expect(items).toHaveLength(101)
  })

  test("prefers cursor pagination when MDBList returns a next cursor", async () => {
    const requests = []
    const pages = [
      { movies: [{ id: 1 }], pagination: { next_cursor: "next-page" } },
      { movies: [{ id: 2 }], pagination: {} },
    ]

    const items = await loadAllListItems(
      "https://api.mdblist.com/lists/example/the-90-90/items",
      "test-key",
      async (url) => {
        requests.push(new URL(url))
        return new Response(JSON.stringify(pages.shift()), {
          headers: requests.length === 1 ? {} : { "X-Has-More": "false" },
        })
      }
    )

    expect(requests[0].searchParams.get("append_to_response")).toBe(
      "genres,poster,description,ratings"
    )
    expect(requests[1].searchParams.get("cursor")).toBe("next-page")
    expect(requests[1].searchParams.has("offset")).toBe(false)
    expect(items).toHaveLength(2)
  })
})

describe("MDBList request handling", () => {
  test("hydrates unresolved list items through the batch endpoint", async () => {
    const originalFetch = globalThis.fetch
    const requests = []

    globalThis.fetch = async (input, options = {}) => {
      const url = new URL(input)
      requests.push({ url, options })

      if (url.pathname === "/lists/example/the-90-90/items") {
        return new Response(JSON.stringify({ movies: [{ ids: { tmdb: 238 } }] }), {
          headers: { "X-Has-More": "false" },
        })
      }
      if (url.pathname === "/tmdb/movie/" && options.method === "POST") {
        return new Response(JSON.stringify([godfather]))
      }

      return new Response("rate limited", {
        status: 429,
        headers: { "Retry-After": "0" },
      })
    }

    try {
      await expect(
        loadQualifiedMovies(
          "https://api.mdblist.com/lists/example/the-90-90/items",
          "test-key"
        )
      ).resolves.toEqual([expect.objectContaining({ id: "tmdb:238" })])
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toHaveLength(2)
    expect(requests[1].url.pathname).toBe("/tmdb/movie/")
    expect(JSON.parse(requests[1].options.body)).toEqual({ ids: [238] })
  })

  test("honors Retry-After before retrying a rate-limited request", async () => {
    const originalFetch = globalThis.fetch
    let attempts = 0

    globalThis.fetch = async () => {
      attempts += 1
      if (attempts === 1) {
        return new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": "1" },
        })
      }
      return new Response("{}")
    }

    const startedAt = Date.now()
    try {
      await fetchResponse("https://api.mdblist.com/test")
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(attempts).toBe(2)
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(900)
  })
})
