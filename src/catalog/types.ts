export interface CatalogMovie {
  id: string
  sourceId: string
  title: string
  year: number
  genres: string[]
  critics: number
  audience: number
  criticReviews?: number
  audienceRatings?: number
  director?: string
  runtime?: string
  poster?: string
  rtUrl?: string
  blurb?: string
}

export interface CatalogRefreshResult {
  status: "succeeded" | "skipped"
  runId?: string
  catalogSize?: number
  reason?: string
}

export interface DisplayMovie extends CatalogMovie {
  active: boolean
}
