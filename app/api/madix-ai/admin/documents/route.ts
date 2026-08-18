import { getDocuments } from "@/lib/madix-ai/service"

export async function GET() {
  try {
    return Response.json({ documents: await getDocuments() })
  } catch (err) {
    console.error("[v0] MADIX AI documents GET error:", err)
    return Response.json({ error: "Грешка при зареждане на документите." }, { status: 500 })
  }
}
