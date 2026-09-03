import { NextResponse } from "next/server"
import { sql } from "@/lib/db" // Използваме sql от lib/db.ts

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id } = body // Очакваме 'id' да е "Document ID"

    console.log(`API /admin/categories/delete - Получена POST заявка за ИЗТРИВАНЕ НА КАТЕГОРИЯ с ID: ${id}`)

    if (!id) {
      console.log("API /admin/categories/delete - ID липсва в заявката")
      return NextResponse.json({ success: false, error: "ID на категорията е задължително" }, { status: 400 })
    }

    // Проверяваме дали категорията съществува, преди да я изтрием
    // Това е добра практика, въпреки че DELETE няма да даде грешка, ако редът не съществува
    let existingCategory
    try {
      existingCategory = await sql.query(
        `SELECT "Document ID", title FROM categories WHERE "Document ID" = $1 LIMIT 1`,
        [id],
      )
    } catch (dbError: any) {
      console.error("API /admin/categories/delete - Грешка при проверка на съществуваща категория:", dbError)
      return NextResponse.json(
        { success: false, error: "Грешка в базата данни при проверка на категорията.", details: dbError.message },
        { status: 500 },
      )
    }

    if (!existingCategory || existingCategory.length === 0) {
      console.log(`API /admin/categories/delete - Категория с ID ${id} не е намерена за изтриване.`)
      // Може да върнем успех, тъй като целта (категорията да я няма) е постигната,
      // или грешка, че не е намерена. Засега ще върнем грешка за по-ясно състояние.
      return NextResponse.json({ success: false, error: "Категорията не е намерена" }, { status: 404 })
    }

    console.log(
      `API /admin/categories/delete - Намерена категория за изтриване: ${existingCategory[0]?.title || id}. Пристъпване към физическо изтриване...`,
    )

    // Физическо изтриване на категорията от базата данни
    const result = await sql.query(
      `DELETE FROM categories WHERE "Document ID" = $1 RETURNING "Document ID", title`, // RETURNING е полезно за логване
      [id],
    )

    console.log("API /admin/categories/delete - Резултат от DELETE заявката:", result)

    if (!result || result.length === 0) {
      // Това не би трябвало да се случи, ако проверката по-горе е минала и ID-то е валидно,
      // освен ако категорията не е изтрита междувременно от друг процес.
      console.log(
        `API /admin/categories/delete - Неуспешно физическо изтриване на категория с ID: ${id}. Заявката не върна изтрити редове.`,
      )
      return NextResponse.json(
        { success: false, error: "Неуспешно изтриване на категорията (възможно е вече да е изтрита)" },
        { status: 500 },
      )
    }

    console.log(
      `API /admin/categories/delete - Категорията '${result[0].title}' (ID: ${result[0]["Document ID"]}) беше успешно физически изтрита.`,
    )
    return NextResponse.json({
      success: true,
      message: "Категорията беше изтрита успешно от базата данни.",
      category: result[0],
    })
  } catch (error: any) {
    console.error("API /admin/categories/delete - Обща грешка при изтриване на категория:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Грешка при изтриване на категорията: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
