import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function GET(request: Request) {
  try {
    const sql = getSql()
    const url = new URL(request.url)
    const tableName = url.searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Името на таблицата е задължително" }, { status: 400 })
    }

    console.log(`Извличане на информация за таблица: ${tableName}`)

    // Извличане на информация за колоните от базата данни
    const result = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = ${tableName}
      ORDER BY 
        ordinal_position
    `

    console.log(`Намерени ${result.length} колони за таблица ${tableName}`)

    return NextResponse.json({ columns: result })
  } catch (error) {
    console.error("Error fetching table info:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"

    return NextResponse.json(
      {
        error: `Грешка при извличане на информация за таблицата: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
