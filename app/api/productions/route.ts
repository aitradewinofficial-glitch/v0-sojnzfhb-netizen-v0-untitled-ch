import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { applyMaterialUsage } from "@/lib/supply"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productionLineId, partnerEmployeeId, quantity, productionDate, notes } = body

    console.log("[v0] POST request body:", body)

    // Get current employee from headers or session
    const currentEmployee = request.headers.get("x-employee-id")

    if (!currentEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      INSERT INTO productions (
        employee_id, 
        production_line_id, 
        product_id,
        product_name, 
        partner_employee_id, 
        quantity, 
        production_date, 
        notes
      ) VALUES (
        ${currentEmployee},
        ${productionLineId},
        NULL,
        ${productId},
        ${partnerEmployeeId},
        ${quantity},
        ${productionDate},
        ${notes}
      )
      RETURNING id
    `

    console.log("[v0] Production created successfully:", result[0])

    // Автоматично намаляване на наличностите за изразходените материали
    await applyMaterialUsage(productId, Number(quantity))

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("[v0] Error creating production:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    let query
    if (employeeId) {
      query = sql`
        SELECT 
          p.id,
          p.employee_id,
          p.production_line_id,
          p.partner_employee_id,
          p.quantity,
          p.production_date,
          p.notes,
          p.created_at,
          p.updated_at,
          COALESCE(p.processed, false) as processed,
          e.name as employee_name,
          pl.name as production_line_name,
          pe.name as partner_name,
          COALESCE(np.title, pp.name, p.product_name) as product_name,
          p.product_name as product_key
        FROM productions p
        JOIN employees e ON p.employee_id = e.id
        JOIN production_lines pl ON p.production_line_id = pl.id
        LEFT JOIN employees pe ON p.partner_employee_id = pe.id
        LEFT JOIN new_products np ON p.product_name = np.objectid
        LEFT JOIN production_products pp ON p.product_name = CONCAT('production-', pp.id::text)
        WHERE p.employee_id = ${employeeId} OR p.partner_employee_id = ${employeeId}
        ORDER BY p.production_date DESC, p.created_at DESC
      `
    } else {
      query = sql`
        SELECT 
          p.id,
          p.employee_id,
          p.production_line_id,
          p.partner_employee_id,
          p.quantity,
          p.production_date,
          p.notes,
          p.created_at,
          p.updated_at,
          COALESCE(p.processed, false) as processed,
          e.name as employee_name,
          pl.name as production_line_name,
          pe.name as partner_name,
          COALESCE(np.title, pp.name, p.product_name) as product_name,
          p.product_name as product_key
        FROM productions p
        JOIN employees e ON p.employee_id = e.id
        JOIN production_lines pl ON p.production_line_id = pl.id
        LEFT JOIN employees pe ON p.partner_employee_id = pe.id
        LEFT JOIN new_products np ON p.product_name = np.objectid
        LEFT JOIN production_products pp ON p.product_name = CONCAT('production-', pp.id::text)
        ORDER BY p.production_date DESC, p.created_at DESC
      `
    }

    const productions = await query

    return NextResponse.json(productions)
  } catch (error) {
    console.error("Error fetching productions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
