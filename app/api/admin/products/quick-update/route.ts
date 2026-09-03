import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function POST(request: Request) {
  const sql = getSql()
  console.log(`API /api/admin/products/quick-update POST handler invoked at ${new Date().toISOString()}`)
  try {
    const data = await request.json()
    console.log("Получени данни за quick-update:", data)

    if (!data.id || !data.field) {
      return NextResponse.json({ success: false, error: "ID и поле са задължителни" }, { status: 400 })
    }

    // Валидни колони за обновяване
    const validColumns = [
      "title",
      "description",
      "price",
      "retailerprice",
      "wholesalerprice",
      "europe_price",
      "cateid",
      "subcateid",
      "photourl",
      "sku",
      "barcode",
      "stock",
      "weight",
      "dimensions",
      "active",
      "deleted",
    ]

    if (!validColumns.includes(data.field)) {
      return NextResponse.json({ success: false, error: `Невалидно поле: ${data.field}` }, { status: 400 })
    }

    // Обработка на стойността според типа поле
    let processedValue = data.value

    if (data.field === "active" || data.field === "deleted") {
      processedValue = Boolean(data.value)
    } else if (["price", "retailerprice", "wholesalerprice", "europe_price", "weight"].includes(data.field)) {
      if (data.value === null || data.value === undefined || String(data.value).trim() === "") {
        processedValue = null
      } else {
        processedValue = Number.parseFloat(String(data.value))
        if (Number.isNaN(processedValue)) {
          // Ако парсването към float не успее, може би искаме да върнем грешка или да оставим null
          // Засега оставяме null, ако не е валидно число
          console.warn(`Could not parse float for field ${data.field}, value: ${data.value}. Setting to null.`)
          processedValue = null
        }
      }
    } else if (data.field === "stock") {
      if (data.value === null || data.value === undefined || String(data.value).trim() === "") {
        processedValue = null
      } else {
        processedValue = Number.parseInt(String(data.value), 10)
        if (Number.isNaN(processedValue)) {
          console.warn(`Could not parse int for field ${data.field}, value: ${data.value}. Setting to null.`)
          processedValue = null
        }
      }
    } else if (data.field === "cateid" || data.field === "subcateid") {
      if (data.value === null || data.value === undefined || String(data.value).trim() === "") {
        processedValue = null
      } else {
        const parsedInt = Number.parseInt(String(data.value), 10)
        if (Number.isNaN(parsedInt)) {
          console.error(`Невалидна стойност за ${data.field}: ${data.value}`)
          return NextResponse.json(
            { success: false, error: `Невалидна стойност за ${data.field}: ${data.value}` },
            { status: 400 },
          )
        }
        processedValue = parsedInt
      }
    } else if (typeof data.value === "string" && data.value.trim() === "") {
      // За други текстови полета, ако са празен стринг, ги правим null
      processedValue = null
    }

    console.log(
      `Обновяване на поле ${data.field} със стойност (processed):`,
      processedValue,
      `(type: ${typeof processedValue})`,
    )

    // Първо проверяваме дали продуктът съществува
    const checkProduct = await sql`
      SELECT objectid FROM new_products 
      WHERE (objectid = ${String(data.id)} OR "Document ID" = ${String(data.id)}) 
      AND (deleted = FALSE OR deleted IS NULL)
      LIMIT 1
    `

    if (!checkProduct || checkProduct.length === 0) {
      return NextResponse.json({ success: false, error: "Продуктът не е намерен или е изтрит" }, { status: 404 })
    }
    const actualProductId = checkProduct[0].objectid

    // Използваме sql.unsafe за динамично име на колона, но параметризираме стойностите
    // ВАЖНО: data.field е валидирано спрямо validColumns, което предпазва от SQL инжекция през името на колоната.
    const updateQuery = `UPDATE new_products SET "${data.field}" = $1, updated_at = NOW() WHERE (objectid = $2 OR "Document ID" = $2) AND (deleted = FALSE OR deleted IS NULL) RETURNING objectid, title, "${data.field}"`

    console.log("SQL Query (quick-update):", updateQuery)
    console.log("Query Params (quick-update):", [processedValue, actualProductId])

    const result = await sql.unsafe(updateQuery, [processedValue, actualProductId])

    if (!result || result.length === 0) {
      console.error("Неуспешно обновяване (quick-update), резултат:", result)
      return NextResponse.json({ success: false, error: "Неуспешно обновяване на полето" }, { status: 500 })
    }

    console.log("Успешно обновяване (quick-update):", result[0])

    return NextResponse.json({
      success: true,
      message: `Полето ${data.field} е обновено успешно`,
      product: result[0],
    })
  } catch (error) {
    console.error("Критична грешка в /api/admin/products/quick-update:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна сървърна грешка"
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name, cause: error.cause }
        : { message: String(error) }
    return NextResponse.json(
      {
        success: false,
        error: `Грешка при бързо обновяване: ${errorMessage}`,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
