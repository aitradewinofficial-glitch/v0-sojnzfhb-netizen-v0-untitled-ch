import { NextResponse } from "next/server"
import { getDocuments } from "@/lib/madix-ai/service"

export async function GET() {
  try {
    return NextResponse.json({ documents: await getDocuments() })
  } catch (err) {
    console.error("[v0] MADIX AI documents GET error:", err)
    return NextResponse.json({ error: "Грешка при зареждане на документите." }, { status: 500 })
  }
}
