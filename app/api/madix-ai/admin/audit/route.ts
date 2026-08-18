import { NextResponse } from "next/server"
import { getAuditLog } from "@/lib/madix-ai/service"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const flaggedOnly = searchParams.get("flagged") === "true"
    return NextResponse.json({ entries: await getAuditLog({ flaggedOnly }) })
  } catch (err) {
    console.error("[v0] MADIX AI audit GET error:", err)
    return NextResponse.json({ error: "Грешка при зареждане на одит лога." }, { status: 500 })
  }
}
