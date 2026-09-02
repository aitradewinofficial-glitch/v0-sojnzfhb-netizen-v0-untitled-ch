import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const employeeId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const targets = await sql`
      SELECT 
        det.target_date,
        det.daily_target,
        det.product_id,
        det.production_line_id,
        np.title as product_name,
        pl.name as production_line_name,
        det.created_at,
        det.updated_at
      FROM daily_employee_targets det
      LEFT JOIN new_products np ON det.product_id = np.objectid
      LEFT JOIN production_lines pl ON det.production_line_id = pl.id
      WHERE det.employee_id = ${employeeId}
        AND det.target_date >= ${startDate}
        AND det.target_date <= ${endDate}
      ORDER BY det.target_date ASC
    `

    return NextResponse.json(targets)
  } catch (error) {
    console.error("Error fetching daily targets:", error)
    return NextResponse.json({ error: "Failed to fetch daily targets" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const employeeId = Number.parseInt(params.id)
    const { target_date, daily_target, product_id, production_line_id } = await request.json()

    if (!target_date || !daily_target || daily_target <= 0) {
      return NextResponse.json({ error: "Valid target date and daily target are required" }, { status: 400 })
    }

    if (!product_id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    if (!production_line_id) {
      return NextResponse.json({ error: "Production line ID is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO daily_employee_targets (employee_id, target_date, daily_target, product_id, production_line_id, updated_at)
      VALUES (${employeeId}, ${target_date}, ${daily_target}, ${product_id}, ${production_line_id}, NOW())
      ON CONFLICT (employee_id, target_date, product_id, production_line_id) 
      DO UPDATE SET 
        daily_target = ${daily_target},
        updated_at = NOW()
      RETURNING *
    `

    console.log(
      `[v0] Updated daily target for employee ${employeeId} on ${target_date} for product ${product_id} and line ${production_line_id}: ${daily_target}`,
    )

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating daily target:", error)
    return NextResponse.json({ error: "Failed to update daily target" }, { status: 500 })
  }
}
