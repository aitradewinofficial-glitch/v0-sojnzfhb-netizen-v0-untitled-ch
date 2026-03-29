import { NextResponse, type NextRequest } from "next/server"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  console.log(`API /api/admin/products/update POST handler invoked at ${new Date().toISOString()}`)
  let sql: NeonQueryFunction<false, false>

  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set!")
      return NextResponse.json(
        { success: false, error: "Конфигурационна грешка: Липсва променлива за връзка с базата данни." },
        { status: 500 },
      )
    }

    sql = neon(process.env.DATABASE_URL)
    console.log("Neon DB connection initialized successfully.")

    const data = await request.json()
    console.log("Данни за обновяване на продукт (API):", JSON.stringify(data, null, 2))

    const {
      id,
      title,
      description,
      price,
      retailerprice,
      wholesalerprice,
      europe_price,
      price_eur,
      retailerprice_eur,
      wholesalerprice_eur,
      europe_price_eur,
      cateid, // Expecting string or null/undefined
      subcateid, // Expecting string or null/undefined
      photourl,
      active,
      // SEO fields
      seo_meta_title,
      seo_meta_description,
      seo_meta_keywords,
      seo_og_title,
      seo_og_description,
      seo_og_image,
      seo_twitter_title,
      seo_twitter_description,
      seo_twitter_image,
      seo_canonical_url,
      seo_robots,
      seo_schema_brand,
      seo_schema_sku,
      seo_schema_availability,
      seo_focus_keyword,
      seo_secondary_keywords,
      seo_alt_text,
      seo_meta_title_bg,
      seo_meta_description_bg,
      seo_meta_keywords_bg,
      seo_og_title_bg,
      seo_og_description_bg,
    } = data

    if (!id) {
      console.warn("Missing product ID in request.")
      return NextResponse.json({ success: false, error: "ID на продукта е задължително" }, { status: 400 })
    }
    if (!title) {
      console.warn("Missing product title in request.")
      return NextResponse.json({ success: false, error: "Името на продукта е задължително" }, { status: 400 })
    }

    const numPrice = price !== undefined && price !== "" && price !== null ? Number.parseFloat(String(price)) : null
    const numRetailerPrice =
      retailerprice !== undefined && retailerprice !== "" && retailerprice !== null
        ? Number.parseFloat(String(retailerprice))
        : null
    const numWholesalerPrice =
      wholesalerprice !== undefined && wholesalerprice !== "" && wholesalerprice !== null
        ? Number.parseFloat(String(wholesalerprice))
        : null
    const numEuropePrice =
      europe_price !== undefined && europe_price !== "" && europe_price !== null
        ? Number.parseFloat(String(europe_price))
        : null
    // EUR prices
    const numPriceEur =
      price_eur !== undefined && price_eur !== "" && price_eur !== null
        ? Number.parseFloat(String(price_eur))
        : null
    const numRetailerPriceEur =
      retailerprice_eur !== undefined && retailerprice_eur !== "" && retailerprice_eur !== null
        ? Number.parseFloat(String(retailerprice_eur))
        : null
    const numWholesalerPriceEur =
      wholesalerprice_eur !== undefined && wholesalerprice_eur !== "" && wholesalerprice_eur !== null
        ? Number.parseFloat(String(wholesalerprice_eur))
        : null
    const numEuropePriceEur =
      europe_price_eur !== undefined && europe_price_eur !== "" && europe_price_eur !== null
        ? Number.parseFloat(String(europe_price_eur))
        : null

    // Correct handling for cateid and subcateid as strings or null
    const finalCateId = cateid !== null && cateid !== undefined && String(cateid).trim() !== "" ? String(cateid) : null
    const finalSubCateId =
      subcateid !== null && subcateid !== undefined && String(subcateid).trim() !== "" ? String(subcateid) : null

    console.log(`Processed string/null values - CateID: ${finalCateId}, SubCateID: ${finalSubCateId}`)

    let existingProductQuery = await sql`
      SELECT objectid FROM new_products WHERE objectid = ${String(id)} AND (deleted = FALSE OR deleted IS NULL)
    `
    if (!existingProductQuery || existingProductQuery.length === 0) {
      existingProductQuery = await sql`
        SELECT "Document ID" as objectid FROM new_products WHERE "Document ID" = ${String(id)} AND (deleted = FALSE OR deleted IS NULL)
      `
    }

    if (!existingProductQuery || existingProductQuery.length === 0) {
      console.warn(`Product not found or deleted for ID: ${id}`)
      return NextResponse.json({ success: false, error: "Продуктът не е намерен или е изтрит" }, { status: 404 })
    }
    const actualProductId = existingProductQuery[0].objectid
    console.log(`Product found. Actual Product ID for update: ${actualProductId}`)

    const dbDeletedValue = !(typeof active === "boolean" ? active : true)

    const result = await sql`
      UPDATE new_products
      SET 
        title = ${title},
        description = ${description || null},
        price = ${numPrice},
        retailerprice = ${numRetailerPrice},
        wholesalerprice = ${numWholesalerPrice},
        europe_price = ${numEuropePrice},
        price_eur = ${numPriceEur},
        retailerprice_eur = ${numRetailerPriceEur},
        wholesalerprice_eur = ${numWholesalerPriceEur},
        europe_price_eur = ${numEuropePriceEur},
        cateid = ${finalCateId},
        subcateid = ${finalSubCateId},
        photourl = ${photourl || null},
        deleted = ${dbDeletedValue},
        seo_meta_title = ${seo_meta_title || null},
        seo_meta_description = ${seo_meta_description || null},
        seo_meta_keywords = ${seo_meta_keywords || null},
        seo_og_title = ${seo_og_title || null},
        seo_og_description = ${seo_og_description || null},
        seo_og_image = ${seo_og_image || null},
        seo_twitter_title = ${seo_twitter_title || null},
        seo_twitter_description = ${seo_twitter_description || null},
        seo_twitter_image = ${seo_twitter_image || null},
        seo_canonical_url = ${seo_canonical_url || null},
        seo_robots = ${seo_robots || 'index, follow'},
        seo_schema_brand = ${seo_schema_brand || null},
        seo_schema_sku = ${seo_schema_sku || null},
        seo_schema_availability = ${seo_schema_availability || 'InStock'},
        seo_focus_keyword = ${seo_focus_keyword || null},
        seo_secondary_keywords = ${seo_secondary_keywords || null},
        seo_alt_text = ${seo_alt_text || null},
        seo_meta_title_bg = ${seo_meta_title_bg || null},
        seo_meta_description_bg = ${seo_meta_description_bg || null},
        seo_meta_keywords_bg = ${seo_meta_keywords_bg || null},
        seo_og_title_bg = ${seo_og_title_bg || null},
        seo_og_description_bg = ${seo_og_description_bg || null}
      WHERE (objectid = ${actualProductId} OR "Document ID" = ${actualProductId})
      RETURNING objectid, title, deleted, cateid, subcateid
    `

    if (!result || result.length === 0) {
      console.error(
        "Failed to update product in database. Query result empty. Actual Product ID:",
        actualProductId,
        "Payload ID:",
        id,
      )
      return NextResponse.json(
        {
          success: false,
          error: "Неуспешно обновяване на продукта (записът не е намерен след опит за обновяване или не е обновен)",
        },
        { status: 500 },
      )
    }

    console.log("Продуктът е обновен успешно (API):", result[0])
    return NextResponse.json({
      success: true,
      message: "Продуктът беше обновен успешно",
      product: {
        ...result[0],
        active: !result[0].deleted, // Ensure active status is correctly reflected based on 'deleted'
      },
    })
  } catch (error) {
    console.error("Критична грешка в /api/admin/products/update (API):", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна сървърна грешка"
    const errorDetails = {
      message: errorMessage,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error && error.cause ? String(error.cause) : undefined,
    }

    return NextResponse.json(
      {
        success: false,
        error: `Грешка при обновяване на продукта: ${errorMessage}`,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
