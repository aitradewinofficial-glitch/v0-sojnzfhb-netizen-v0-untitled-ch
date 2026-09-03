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

export async function GET(req: NextRequest) {
  try {
    await ensureFishermenTable()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")?.trim().toLowerCase() || ""
    const storeFilter = searchParams.get("store") || ""

    const conditions: string[] = []
    const values: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`(LOWER(name) ILIKE $${idx} OR LOWER(phone) ILIKE $${idx} OR LOWER(store_name) ILIKE $${idx})`)
      values.push(`%${search}%`)
      idx++
    }
    if (storeFilter && storeFilter !== "all") {
      conditions.push(`customer_id = $${idx}`)
      values.push(storeFilter)
      idx++
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : ""

    const fishermen: any[] = await sql.query(
      `SELECT id, name, phone, customer_id, store_name, agreed_terms, agreed_marketing, is_winner, created_at
       FROM fishermen${whereClause}
       ORDER BY created_at DESC`,
      values,
    )

    // Броене по магазин (без филтрите за търсене)
    const storeCounts: any[] = await sql.query(
      `SELECT customer_id, store_name, COUNT(*)::int as count
       FROM fishermen
       GROUP BY customer_id, store_name
       ORDER BY count DESC`,
      [],
    )

    return NextResponse.json({
      fishermen: (Array.isArray(fishermen) ? fishermen : []).map((f: any) => ({
        id: f.id,
        name: f.name || "",
        phone: f.phone || "",
        customerId: f.customer_id || null,
        storeName: f.store_name || "",
        agreedTerms: Boolean(f.agreed_terms),
        agreedMarketing: Boolean(f.agreed_marketing),
        isWinner: Boolean(f.is_winner),
        createdAt: f.created_at,
      })),
      storeCounts: (Array.isArray(storeCounts) ? storeCounts : []).map((s: any) => ({
        customerId: s.customer_id || null,
        storeName: s.store_name || "Без магазин",
        count: Number(s.count) || 0,
      })),
      total: Array.isArray(fishermen) ? fishermen.length : 0,
    })
  } catch (error) {
    console.error("[API GET /api/admin/fishermen] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json({ error: "Грешка при зареждане на рибарите", details: errorMessage }, { status: 500 })
  }
}

// Маркиране / отмаркиране на печеливш
export async function PATCH(req: NextRequest) {
  try {
    await ensureFishermenTable()
    const body = await req.json()
    const { id, isWinner } = body

    if (!id) {
      return NextResponse.json({ error: "Липсва ID на рибар" }, { status: 400 })
    }

    await sql.query(`UPDATE fishermen SET is_winner = $1 WHERE id = $2`, [Boolean(isWinner), id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API PATCH /api/admin/fishermen] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json({ error: "Грешка при обновяване", details: errorMessage }, { status: 500 })
  }
}

// Изтриване на рибар
export async function DELETE(req: NextRequest) {
  try {
    await ensureFishermenTable()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Липсва ID на рибар" }, { status: 400 })
    }

    await sql.query(`DELETE FROM fishermen WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API DELETE /api/admin/fishermen] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json({ error: "Грешка при изтриване", details: errorMessage }, { status: 500 })
  }
}
