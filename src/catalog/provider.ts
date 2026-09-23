import { loadQualifiedMovies as loadFromMdblist } from "../../scripts/ingest-mdblist.mjs"
import type { CatalogMovie } from "./types"

export async function loadQualifiedMovies(listUrl: string, apiKey: string) {
  return (await loadFromMdblist(listUrl, apiKey)) as CatalogMovie[]
}
