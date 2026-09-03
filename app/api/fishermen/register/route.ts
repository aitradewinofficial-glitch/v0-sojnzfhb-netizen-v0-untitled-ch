import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function ensureFishermenTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS fishermen (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      customer_id TEXT,
      store_name TEXT,
      agreed_terms BOOLEAN DEFAULT FALSE,
      agreed_marketing BOOLEAN DEFAULT FALSE,
      is_winner BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, customerId, agreedTerms, agreedMarketing } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Моля, въведете вашите имена." }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Моля, въведете телефонен номер." }, { status: 400 })
    }
    if (!agreedTerms) {
      return NextResponse.json({ error: "Трябва да се съгласите с общите условия." }, { status: 400 })
    }

    await ensureFishermenTable()

    // Намираме магазина по Document ID или objectid, за да запишем името му
    let storeName: string | null = null
    let resolvedCustomerId: string | null = customerId ? String(customerId).trim() : null

    if (resolvedCustomerId) {
      const storeResult: any[] = await sql.query(
        `SELECT "Document ID" as id, storename, companyname FROM customers WHERE "Document ID" = $1 OR objectid = $1 LIMIT 1`,
        [resolvedCustomerId],
      )
      if (Array.isArray(storeResult) && storeResult.length > 0) {
        const store = storeResult[0]
        resolvedCustomerId = store.id ? String(store.id) : resolvedCustomerId
        storeName = store.storename || store.companyname || null
      }
    }

    const insertResult: any[] = await sql.query(
      `INSERT INTO fishermen (name, phone, customer_id, store_name, agreed_terms, agreed_marketing)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        name.trim(),
        phone.trim(),
        resolvedCustomerId,
        storeName,
        Boolean(agreedTerms),
        Boolean(agreedMarketing),
      ],
    )

    const createdId = Array.isArray(insertResult) && insertResult.length > 0 ? insertResult[0].id : null

    return NextResponse.json({ success: true, id: createdId, storeName })
  } catch (error) {
    console.error("[API POST /api/fishermen/register] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json({ error: "Грешка при регистрацията", details: errorMessage }, { status: 500 })
  }
}
