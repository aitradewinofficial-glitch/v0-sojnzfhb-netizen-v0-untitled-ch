import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const { active } = await request.json()
    const partnerId = Number.parseInt(params.id)

    if (isNaN(partnerId)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 })
    }

    const result = await sql`
      UPDATE partners 
      SET active = ${active}
      WHERE id = ${partnerId}
      RETURNING id, name, active, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating partner:", error)
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 })
  }
}
