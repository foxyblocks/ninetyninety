import { getActiveMovies, getLatestSuccessfulRefresh } from "@/catalog/repository"
import type { DisplayMovie } from "@/catalog/types"
import { MovieExplorer } from "@/components/movie-explorer"

export const dynamic = "force-dynamic"

export default async function Home() {
  let movies: DisplayMovie[] = []
  let refreshedAt: string | undefined

  try {
    const [catalog, latestRefresh] = await Promise.all([
      getActiveMovies(),
      getLatestSuccessfulRefresh(),
    ])
    movies = catalog
    refreshedAt = latestRefresh?.completed_at
      ? new Date(latestRefresh.completed_at).toISOString()
      : undefined
  } catch (error) {
    console.error("Unable to load the movie catalog", error)
  }

  return <MovieExplorer initialMovies={movies} refreshedAt={refreshedAt} />
}
