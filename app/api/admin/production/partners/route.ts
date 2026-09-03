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
    const partners = await sql`
      SELECT id, name, active, created_at 
      FROM partners 
      ORDER BY created_at DESC
    `

    return NextResponse.json(partners)
  } catch (error) {
    console.error("Error fetching partners:", error)
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql()
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO partners (name, active, created_at)
      VALUES (${name.trim()}, true, NOW())
      RETURNING id, name, active, created_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating partner:", error)
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 })
  }
}
