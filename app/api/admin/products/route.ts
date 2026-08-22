import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function GET(request: NextRequest) {
  try {
    const sql = getSql()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("category")

    const offset = (page - 1) * limit

    if (id) {
      console.log(`Fetching product with ID: ${id}`)
      let productRows = await sql`
        SELECT * FROM new_products
        WHERE objectid = ${id}
        AND (deleted = false OR deleted IS NULL)
      `

      if (!productRows || productRows.length === 0) {
        productRows = await sql`
          SELECT * FROM new_products
          WHERE "Document ID" = ${id}
          AND (deleted = false OR deleted IS NULL)
        `
      }

      if (!productRows || productRows.length === 0) {
        return NextResponse.json({ success: false, error: "Продуктът не е намерен или е неактивен" }, { status: 404 })
      }

      const product = productRows[0] as any
      console.log(`Product found: ${product.title}`)

      // Fetch category title
      if (product.cateid) {
        try {
          const category = await sql`
            SELECT title FROM categories
            WHERE "Document ID" = ${product.cateid}
          `
          if (category && category.length > 0) {
            product.category_title = category[0].title
          }
        } catch (error) {
          console.error(`Error fetching category for product ${id}:`, error)
        }
      }

      // Fetch subcategory title
      if (product.subcateid) {
        try {
          const subcategory = await sql`
            SELECT title FROM subcategories 
            WHERE "Document ID" = ${product.subcateid}
          ` // Предполагаме, че таблицата е 'subcategories' и ключът е 'Document ID'
          if (subcategory && subcategory.length > 0) {
            product.subcategory_title = subcategory[0].title
          }
        } catch (error) {
          console.error(`Error fetching subcategory for product ${id}:`, error)
        }
      }

      product.active = product.deleted === false || product.deleted === null

      return NextResponse.json({ success: true, products: [product] })
    } else {
      console.log(
        `Fetching products list: page=${page}, limit=${limit}, search="${search}", category=${categoryId || "all"}`,
      )

      let query = sql`SELECT * FROM new_products WHERE (deleted = false OR deleted IS NULL)`
      let countQuery = sql`SELECT COUNT(*) as total FROM new_products WHERE (deleted = false OR deleted IS NULL)`

      if (search) {
        const searchTerm = `%${search}%`
        query = sql`${query} AND (title ILIKE ${searchTerm} OR description ILIKE ${searchTerm})`
        countQuery = sql`${countQuery} AND (title ILIKE ${searchTerm} OR description ILIKE ${searchTerm})`
      }

      if (categoryId) {
        query = sql`${query} AND cateid = ${categoryId}`
        countQuery = sql`${countQuery} AND cateid = ${categoryId}`
      }

      query = sql`${query} ORDER BY title LIMIT ${limit} OFFSET ${offset}`

      const [productsFromDb, countResult] = await Promise.all([query, countQuery])
      const total = countResult?.[0]?.total || 0

      console.log(`Found ${productsFromDb.length} products out of ${total} total`)

      const enrichedProducts = await Promise.all(
        productsFromDb.map(async (dbProduct) => {
          const product = dbProduct as any
          let category_title = "Без категория"
          let subcategory_title = "Без подкатегория"

          if (product.cateid) {
            try {
              const category = await sql`
                SELECT title FROM categories
                WHERE "Document ID" = ${product.cateid}
              `
              if (category && category.length > 0) {
                category_title = category[0].title
              }
            } catch (error) {
              console.error(`Error fetching category for product ${product.objectid}:`, error)
            }
          }

          if (product.subcateid) {
            try {
              const subcategory = await sql`
                SELECT title FROM subcategories
                WHERE "Document ID" = ${product.subcateid}
              ` // Предполагаме, че таблицата е 'subcategories' и ключът е 'Document ID'
              if (subcategory && subcategory.length > 0) {
                subcategory_title = subcategory[0].title
              }
            } catch (error) {
              console.error(`Error fetching subcategory for product ${product.objectid}:`, error)
            }
          }

          const isActiveBasedOnDeleted = product.deleted === false || product.deleted === null

          return {
            ...product,
            category_title,
            subcategory_title, // Добавяме името на подкатегорията
            active: isActiveBasedOnDeleted,
          }
        }),
      )

      return NextResponse.json({
        success: true,
        products: enrichedProducts,
        pagination: {
          total: Number.parseInt(String(total)),
          page,
          limit,
          pages: Math.ceil(Number.parseInt(String(total)) / limit),
        },
      })
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json(
      {
        success: false,
        error: `Грешка при зареждане на продуктите: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
