import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Позволени категории материали
const CATEGORIES = ["Етикети", "Седящи пликове", "Фолио", "Кашони", "Вакуум пликове", "Буркан", "Бутилка"]

export async function GET() {
  try {
    const materials = await sql`
      SELECT id, category, name, stock, min_quantity, created_at, updated_at
      FROM supply_materials
      ORDER BY category ASC, name ASC
    `
    return NextResponse.json(materials)
  } catch (error) {
    console.error("Error fetching supply materials:", error)
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, name, stock, min_quantity } = body

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Невалидна категория" }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Името е задължително" }, { status: 400 })
    }

    const stockNum = Number(stock)
    const minNum = Number(min_quantity)

    if (Number.isNaN(stockNum) || stockNum < 0) {
      return NextResponse.json({ error: "Невалидна наличност" }, { status: 400 })
    }

    if (Number.isNaN(minNum) || minNum < 0) {
      return NextResponse.json({ error: "Невалидно минимално количество" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO supply_materials (category, name, stock, min_quantity)
      VALUES (${category}, ${name.trim()}, ${stockNum}, ${minNum})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating supply material:", error)
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 })
  }
}
