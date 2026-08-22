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
    const employeeId = Number.parseInt(params.id)
    const { daily_target } = await request.json()

    if (!daily_target || daily_target <= 0) {
      return NextResponse.json({ error: "Valid daily target is required" }, { status: 400 })
    }

    // Check if employee exists
    const employee = await sql`
      SELECT id FROM employees WHERE id = ${employeeId}
    `

    if (employee.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Update or insert employee target
    const result = await sql`
      INSERT INTO employee_targets (employee_id, daily_target, updated_at)
      VALUES (${employeeId}, ${daily_target}, NOW())
      ON CONFLICT (employee_id) 
      DO UPDATE SET 
        daily_target = ${daily_target},
        updated_at = NOW()
      RETURNING employee_id, daily_target
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating employee target:", error)
    return NextResponse.json({ error: "Failed to update employee target" }, { status: 500 })
  }
}
