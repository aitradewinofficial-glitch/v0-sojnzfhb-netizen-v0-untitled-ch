import { getAuditLog } from "@/lib/madix-ai/service"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const flaggedOnly = searchParams.get("flagged") === "true"
    return Response.json({ entries: await getAuditLog({ flaggedOnly }) })
  } catch (err) {
    console.error("[v0] MADIX AI audit GET error:", err)
    return Response.json({ error: "Грешка при зареждане на одит лога." }, { status: 500 })
  }
}
