import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const CATEGORIES = ["Етикети", "Седящи пликове", "Фолио", "Кашони", "Вакуум пликове", "Буркан", "Бутилка"]

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await sql`SELECT * FROM supply_materials WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Материалът не е намерен" }, { status: 404 })
    }

    // Режим "доставка": добавя количество към наличността
    if (body.addStock !== undefined) {
      const add = Number(body.addStock)
      if (Number.isNaN(add)) {
        return NextResponse.json({ error: "Невалидно количество за доставка" }, { status: 400 })
      }
      const result = await sql`
        UPDATE supply_materials
        SET stock = stock + ${add}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return NextResponse.json(result[0])
    }

    // Пълна редакция на материала
    const category = body.category ?? existing[0].category
    const name = body.name ?? existing[0].name
    const stock = body.stock ?? existing[0].stock
    const minQuantity = body.min_quantity ?? existing[0].min_quantity

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Невалидна категория" }, { status: 400 })
    }
    if (!name || !name.toString().trim()) {
      return NextResponse.json({ error: "Името е задължително" }, { status: 400 })
    }
    if (Number.isNaN(Number(stock)) || Number(stock) < 0) {
      return NextResponse.json({ error: "Невалидна наличност" }, { status: 400 })
    }
    if (Number.isNaN(Number(minQuantity)) || Number(minQuantity) < 0) {
      return NextResponse.json({ error: "Невалидно минимално количество" }, { status: 400 })
    }

    const result = await sql`
      UPDATE supply_materials
      SET category = ${category},
          name = ${name.toString().trim()},
          stock = ${Number(stock)},
          min_quantity = ${Number(minQuantity)},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating supply material:", error)
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await sql`DELETE FROM supply_materials WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting supply material:", error)
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 })
  }
}
