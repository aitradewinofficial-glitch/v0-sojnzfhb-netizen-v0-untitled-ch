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
    const salaryLevels = await sql`
      SELECT * FROM salary_levels 
      WHERE active = true 
      ORDER BY salary_per_day DESC
    `

    return NextResponse.json(salaryLevels)
  } catch (error) {
    console.error("Error fetching salary levels:", error)
    return NextResponse.json({ error: "Failed to fetch salary levels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql()
    const body = await request.json()
    const { level_name, salary_per_day } = body

    if (!level_name || !salary_per_day) {
      return NextResponse.json({ error: "Level name and salary per day are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO salary_levels (level_name, salary_per_day)
      VALUES (${level_name}, ${salary_per_day})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating salary level:", error)
    return NextResponse.json({ error: "Failed to create salary level" }, { status: 500 })
  }
}
