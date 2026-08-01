import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        pp.*,
        pl.name as production_line_name
      FROM production_products pp
      LEFT JOIN production_lines pl ON pp.production_line_id = pl.id
      ORDER BY pp.created_at DESC
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching production products:", error)
    return NextResponse.json({ error: "Failed to fetch production products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, production_line_id, daily_target, sales_value } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!production_line_id) {
      return NextResponse.json({ error: "Production line is required" }, { status: 400 })
    }

    if (!daily_target || daily_target <= 0) {
      return NextResponse.json({ error: "Daily target must be greater than 0" }, { status: 400 })
    }

    if (sales_value !== undefined && sales_value < 0) {
      return NextResponse.json({ error: "Sales value cannot be negative" }, { status: 400 })
    }

    // Рецепта: материал (или NULL) + количество на 1 бр. продукт
    const matId = (v: unknown) => (v === undefined || v === null || v === "" || v === "none" ? null : Number(v))
    const qty = (v: unknown) => (Number.isNaN(Number(v)) ? 0 : Number(v))

    const result = await sql`
      INSERT INTO production_products (
        name, production_line_id, daily_target, sales_value,
        label1_material_id, label1_qty,
        label2_material_id, label2_qty,
        sticker_material_id, sticker_qty,
        packaging_material_id, packaging_qty,
        box_material_id, box_qty
      )
      VALUES (
        ${name.trim()}, ${Number(production_line_id)}, ${Number(daily_target)}, ${Number(sales_value || 0)},
        ${matId(body.label1_material_id)}, ${qty(body.label1_qty)},
        ${matId(body.label2_material_id)}, ${qty(body.label2_qty)},
        ${matId(body.sticker_material_id)}, ${qty(body.sticker_qty)},
        ${matId(body.packaging_material_id)}, ${qty(body.packaging_qty)},
        ${matId(body.box_material_id)}, ${qty(body.box_qty)}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating production product:", error)
    return NextResponse.json({ error: "Failed to create production product" }, { status: 500 })
  }
}
