import { refreshCatalog } from "@/catalog/refresh"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: "Cron is not configured" }, { status: 503 })
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const force = new URL(request.url).searchParams.get("force") === "true"
    const result = await refreshCatalog({ force })
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog refresh failed"
    console.error("Catalog refresh failed", { message })
    return Response.json({ error: message }, { status: 500 })
  }
}
