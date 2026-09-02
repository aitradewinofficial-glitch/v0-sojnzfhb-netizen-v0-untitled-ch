import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function GET(request: NextRequest) {
  try {
    const sql = getSql()
    const { searchParams } = new URL(request.url)
    const includeTargets = searchParams.get("includeTargets") === "true"

    let employees

    if (includeTargets) {
      employees = await sql`
        SELECT 
          e.id, 
          e.name, 
          e.active, 
          e.created_at,
          e.salary_level_id,
          sl.level_name as salary_level_name,
          COALESCE(et.daily_target, 3000) as daily_target
        FROM employees e
        LEFT JOIN employee_targets et ON e.id = et.employee_id
        LEFT JOIN salary_levels sl ON e.salary_level_id = sl.id
        ORDER BY e.created_at DESC
      `
    } else {
      employees = await sql`
        SELECT 
          e.id, 
          e.name, 
          e.active, 
          e.created_at, 
          e.salary_level_id,
          sl.level_name as salary_level_name
        FROM employees e
        LEFT JOIN salary_levels sl ON e.salary_level_id = sl.id
        ORDER BY e.created_at DESC
      `
    }

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql()
    const { name, salary_level_id } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO employees (name, active, salary_level_id, created_at, updated_at)
      VALUES (${name.trim()}, true, ${salary_level_id || null}, NOW(), NOW())
      RETURNING id, name, active, salary_level_id, created_at
    `

    await sql`
      INSERT INTO employee_targets (employee_id, daily_target)
      VALUES (${result[0].id}, 3000)
      ON CONFLICT (employee_id) DO NOTHING
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
