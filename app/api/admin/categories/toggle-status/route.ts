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
    console.log("Получена заявка за превключване на статуса на категория")

    // Извличаме данните от заявката
    const data = await request.json()
    console.log("Данни за превключване на статуса:", JSON.stringify(data, null, 2))

    // Валидираме задължителните полета
    if (!data.id) {
      return NextResponse.json({ success: false, error: "ID на категорията е задължително" }, { status: 400 })
    }

    // Първо проверяваме дали категорията съществува
    const existingCategory = await sql`
      SELECT "Document ID", title, deleted FROM categories WHERE "Document ID" = ${data.id}
    `

    console.log("Съществуваща категория:", existingCategory)

    if (!existingCategory || existingCategory.length === 0) {
      return NextResponse.json({ success: false, error: "Категорията не е намерена" }, { status: 404 })
    }

    // Определяме новия статус (обратен на текущия)
    const currentStatus = existingCategory[0].deleted === true
    const newStatus = !currentStatus

    // Обновяване статуса на категорията
    const result = await sql`
      UPDATE categories
      SET deleted = ${newStatus}
      WHERE "Document ID" = ${data.id}
      RETURNING "Document ID", title, deleted
    `

    console.log("Резултат от превключване на статуса:", result)

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Неуспешно превключване на статуса на категорията" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Категорията беше ${newStatus ? "деактивирана" : "активирана"} успешно`,
      category: result[0],
    })
  } catch (error) {
    console.error("Error toggling category status:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"

    return NextResponse.json(
      {
        success: false,
        error: `Грешка при превключване на статуса на категорията: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
