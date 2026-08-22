import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const body = await request.json()
    const { level_name, salary_per_day } = body
    const id = params.id

    if (!level_name || !salary_per_day) {
      return NextResponse.json({ error: "Level name and salary per day are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE salary_levels 
      SET level_name = ${level_name}, 
          salary_per_day = ${salary_per_day},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Salary level not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating salary level:", error)
    return NextResponse.json({ error: "Failed to update salary level" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const id = params.id

    const result = await sql`
      UPDATE salary_levels 
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Salary level not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Salary level deleted successfully" })
  } catch (error) {
    console.error("Error deleting salary level:", error)
    return NextResponse.json({ error: "Failed to delete salary level" }, { status: 500 })
  }
}
