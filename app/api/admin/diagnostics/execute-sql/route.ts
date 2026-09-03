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
    const { sql: sqlQuery } = await request.json()

    if (!sqlQuery) {
      return NextResponse.json({ error: "SQL заявката е задължителна" }, { status: 400 })
    }

    console.log(`Изпълнение на SQL заявка: ${sqlQuery}`)

    // Изпълнение на SQL заявката
    const result = await sql.unsafe(sqlQuery)

    console.log(`SQL заявката върна ${result.length} реда`)

    return NextResponse.json({ result, rowCount: result.length })
  } catch (error) {
    console.error("Error executing SQL:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"

    return NextResponse.json(
      {
        error: `Грешка при изпълнение на SQL заявката: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
