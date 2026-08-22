import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function POST(request: Request) {
  try {
    const sql = getSql()
    console.log("Получена заявка за изтриване на продукт")

    // Извличаме данните от заявката
    const data = await request.json()
    console.log("ID на продукта за изтриване:", data.id)

    // Валидираме задължителните полета
    if (!data.id) {
      return NextResponse.json({ success: false, error: "ID на продукта е задължително" }, { status: 400 })
    }

    // Проверяваме дали продуктът съществува
    const product = await sql`
      SELECT objectid, title FROM new_products
      WHERE objectid = ${data.id}
    `

    if (!product || product.length === 0) {
      return NextResponse.json({ success: false, error: "Продуктът не е намерен" }, { status: 404 })
    }

    // Изтриваме продукта от базата данни (soft delete)
    const result = await sql`
      UPDATE new_products
      SET deleted = true
      WHERE objectid = ${data.id}
      RETURNING objectid
    `

    console.log("Резултат от изтриване:", result)

    return NextResponse.json({
      success: true,
      message: "Продуктът беше изтрит успешно",
      id: data.id,
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"

    return NextResponse.json(
      {
        success: false,
        error: `Грешка при изтриване на продукта: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
