import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { applyMaterialUsage } from "@/lib/supply"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { productName, productionLineId, partnerEmployeeId, quantity, productionDate, notes } = body
    const productionId = id

    // Get current employee from headers
    const currentEmployee = request.headers.get("x-employee-id")

    if (!currentEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the production belongs to the current employee
    const existingProduction = await sql`
      SELECT employee_id, product_name, quantity FROM productions WHERE id = ${productionId}
    `

    if (existingProduction.length === 0) {
      return NextResponse.json({ error: "Production not found" }, { status: 404 })
    }

    if (existingProduction[0].employee_id.toString() !== currentEmployee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const oldProductKey = existingProduction[0].product_name
    const oldQuantity = Number(existingProduction[0].quantity)

    // Resolve product_name to a valid key (production-<id> / online-<id>).
    // The statistics only count records with these prefixes, so we must never
    // store a raw display name here. If the incoming value isn't a valid key,
    // try to map it by name; otherwise keep the existing key.
    let resolvedProductName = productName
    if (
      typeof productName !== "string" ||
      (!productName.startsWith("production-") && !productName.startsWith("online-"))
    ) {
      const matched = await sql`
        SELECT CONCAT('production-', id::text) AS product_key
        FROM production_products
        WHERE name = ${productName}
          AND production_line_id = ${productionLineId}
        LIMIT 1
      `
      if (matched.length > 0) {
        resolvedProductName = matched[0].product_key
      } else {
        const current = await sql`SELECT product_name FROM productions WHERE id = ${productionId}`
        resolvedProductName = current[0]?.product_name ?? productName
      }
    }

    await sql`
      UPDATE productions 
      SET 
        product_name = ${resolvedProductName},
        production_line_id = ${productionLineId},
        partner_employee_id = ${partnerEmployeeId},
        quantity = ${quantity},
        production_date = ${productionDate},
        notes = ${notes},
        updated_at = NOW()
      WHERE id = ${productionId}
    `

    // Върни старото изразходване и приложи новото според рецептата
    await applyMaterialUsage(oldProductKey, -oldQuantity)
    await applyMaterialUsage(resolvedProductName, Number(quantity))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating production:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { processed } = body
    const productionId = id

    if (typeof processed !== "boolean") {
      return NextResponse.json({ error: "Invalid processed value" }, { status: 400 })
    }

    // Update the processed status
    const result = await sql`
      UPDATE productions 
      SET processed = ${processed}, updated_at = NOW()
      WHERE id = ${productionId}
      RETURNING id, processed
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Production not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, processed: result[0].processed })
  } catch (error) {
    console.error("Error updating processed status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productionId = id
    const currentEmployee = request.headers.get("x-employee-id")

    if (!currentEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the production belongs to the current employee
    const existingProduction = await sql`
      SELECT employee_id, product_name, quantity FROM productions WHERE id = ${productionId}
    `

    if (existingProduction.length === 0) {
      return NextResponse.json({ error: "Production not found" }, { status: 404 })
    }

    if (existingProduction[0].employee_id.toString() !== currentEmployee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sql`
      DELETE FROM productions WHERE id = ${productionId}
    `

    // Върни изразходените материали обратно в наличност
    await applyMaterialUsage(existingProduction[0].product_name, -Number(existingProduction[0].quantity))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting production:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
