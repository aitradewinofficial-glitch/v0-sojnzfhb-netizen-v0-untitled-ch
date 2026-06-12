import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Създаваме SQL клиент
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("Получена заявка за изтриване на подкатегория")

    // Извличаме данните от заявката
    const data = await request.json()
    console.log("Данни за изтриване:", JSON.stringify(data, null, 2))

    // Валидираме задължителните полета
    if (!data.id) {
      return NextResponse.json({ success: false, error: "ID на подкатегорията е задължително" }, { status: 400 })
    }

    // Първо проверяваме дали подкатегорията съществува
    const existingSubcategory = await sql`
      SELECT "Document ID", title FROM subcategories WHERE "Document ID" = ${data.id}
    `

    console.log("Съществуваща подкатегория:", existingSubcategory)

    if (!existingSubcategory || existingSubcategory.length === 0) {
      return NextResponse.json({ success: false, error: "Подкатегорията не е намерена" }, { status: 404 })
    }

    // Проверяваме дали има продукти в тази подкатегория
    const productsCount = await sql`
      SELECT COUNT(*) as count FROM new_products WHERE subcateid = ${data.id}
    `

    const count = Number.parseInt(productsCount[0]?.count || "0")
    console.log(`Брой продукти в подкатегорията: ${count}`)

    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Не можете да изтриете тази подкатегория, защото съдържа ${count} продукта. Първо преместете или изтрийте продуктите.`,
        },
        { status: 400 },
      )
    }

    // Изтриваме подкатегорията от базата данни (soft delete)
    const result = await sql`
      UPDATE subcategories
      SET deleted = true
      WHERE "Document ID" = ${data.id}
      RETURNING "Document ID", title
    `

    console.log("Резултат от изтриване:", result)

    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, error: "Неуспешно изтриване на подкатегорията" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Подкатегорията беше изтрита успешно",
      subcategory: result[0],
    })
  } catch (error) {
    console.error("Error deleting subcategory:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"

    return NextResponse.json(
      {
        success: false,
        error: `Грешка при изтриване на подкатегорията: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
