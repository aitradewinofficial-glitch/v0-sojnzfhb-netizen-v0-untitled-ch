import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function GET() {
  try {
    const sql = getSql()
    const productionLines = await sql`
      SELECT id, name, description, active, created_at 
      FROM production_lines 
      ORDER BY created_at DESC
    `

    return NextResponse.json(productionLines)
  } catch (error) {
    console.error("Error fetching production lines:", error)
    return NextResponse.json({ error: "Failed to fetch production lines" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql()
    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO production_lines (name, description, active, created_at)
      VALUES (${name.trim()}, ${description?.trim() || null}, true, NOW())
      RETURNING id, name, description, active, created_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating production line:", error)
    return NextResponse.json({ error: "Failed to create production line" }, { status: 500 })
  }
}
