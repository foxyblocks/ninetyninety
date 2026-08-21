import { describe, expect, test } from "bun:test"
import {
  extractListItems,
  extractMovieRef,
  normalizeMdblistMovie,
  qualifies,
} from "./ingest-mdblist.mjs"

const godfather = {
  title: "The Godfather",
  year: 1972,
  runtime: 175,
  ids: { tmdb: 238 },
  genres: [{ id: 4, title: "Crime" }, { id: 6, title: "Drama" }],
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
})
