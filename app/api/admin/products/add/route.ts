import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Създаваме SQL клиент
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("Получена заявка за добавяне на продукт")

    // Извличаме данните от заявката
    const data = await request.json()
    console.log("Данни за продукта:", data)

    // Валидираме задължителните полета
    if (!data.title) {
      return NextResponse.json({ success: false, error: "Името на продукта е задължително" }, { status: 400 })
    }

    if (!data.title_en) {
      return NextResponse.json(
        { success: false, error: "Името на продукта на английски е задължително" },
        { status: 400 },
      )
    }

    // Преобразуваме цените към числа
    const price = data.price ? Number.parseFloat(data.price) : null
    const wholesalerprice = data.wholesalerprice ? Number.parseFloat(data.wholesalerprice) : null
    const retailerprice = data.retailerprice ? Number.parseFloat(data.retailerprice) : null
    const europe_price = data.europe_price ? Number.parseFloat(data.europe_price) : null

    // EUR цени
    const price_eur = data.price_eur ? Number.parseFloat(data.price_eur) : null
    const wholesalerprice_eur = data.wholesalerprice_eur ? Number.parseFloat(data.wholesalerprice_eur) : null
    const retailerprice_eur = data.retailerprice_eur ? Number.parseFloat(data.retailerprice_eur) : null
    const europe_price_eur = data.europe_price_eur ? Number.parseFloat(data.europe_price_eur) : null

    // Активен статус се съхранява чрез колоната "deleted" (deleted = !active)
    const deleted = !(typeof data.active === "boolean" ? data.active : true)

    // Гарантираме, че колоните sku и barcode съществуват (както при други схема поправки)
    await sql`ALTER TABLE new_products ADD COLUMN IF NOT EXISTS sku TEXT`
    await sql`ALTER TABLE new_products ADD COLUMN IF NOT EXISTS barcode TEXT`

    // Логваме преобразуваните цени за дебъгване
    console.log("Преобразувани цени:", {
      price,
      wholesalerprice,
      retailerprice,
      europe_price,
      rawEuropePrice: data.europe_price,
    })

    // Генерираме уникален ID за продукта
    const objectid = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const documentId = crypto.randomUUID()

    // Записваме продукта в базата данни използвайки tagged template literals
    const result = await sql`
      INSERT INTO new_products (
        objectid, 
        "Document ID", 
        title, 
        title_en,
        description, 
        description_en,
        sku,
        barcode,
        price, 
        wholesalerprice, 
        retailerprice, 
        europe_price,
        price_eur,
        wholesalerprice_eur,
        retailerprice_eur,
        europe_price_eur,
        deleted,
        cateid, 
        subcateid, 
        photourl, 
        createdat,
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
        seo_og_description_bg
      ) VALUES (
        ${objectid}, 
        ${documentId}, 
        ${data.title}, 
        ${data.title_en || ""},
        ${data.description || ""}, 
        ${data.description_en || ""},
        ${data.sku || null},
        ${data.barcode || null},
        ${price}, 
        ${wholesalerprice}, 
        ${retailerprice}, 
        ${europe_price},
        ${price_eur},
        ${wholesalerprice_eur},
        ${retailerprice_eur},
        ${europe_price_eur},
        ${deleted},
        ${data.cateid === "none" ? null : data.cateid}, 
        ${data.subcateid === "none" ? null : data.subcateid}, 
        ${data.photourl || null}, 
        ${new Date().toISOString()},
        ${data.seo_meta_title || null},
        ${data.seo_meta_description || null},
        ${data.seo_meta_keywords || null},
        ${data.seo_og_title || null},
        ${data.seo_og_description || null},
        ${data.seo_og_image || null},
        ${data.seo_twitter_title || null},
        ${data.seo_twitter_description || null},
        ${data.seo_twitter_image || null},
        ${data.seo_canonical_url || null},
        ${data.seo_robots || 'index, follow'},
        ${data.seo_schema_brand || 'Мадикс Граундбейтс'},
        ${data.seo_schema_sku || null},
        ${data.seo_schema_availability || 'InStock'},
        ${data.seo_focus_keyword || null},
        ${data.seo_secondary_keywords || null},
        ${data.seo_alt_text || null},
        ${data.seo_meta_title_bg || null},
        ${data.seo_meta_description_bg || null},
        ${data.seo_meta_keywords_bg || null},
        ${data.seo_og_title_bg || null},
        ${data.seo_og_description_bg || null}
      )
      RETURNING objectid, title, title_en, europe_price
    `

    console.log("Резултат от запис:", result)

    // Проверяваме дали europe_price е записано правилно
    if (result.length > 0) {
      console.log("Записана европейска цена:", result[0].europe_price)
      console.log("Записано английско име:", result[0].title_en)
    }

    return NextResponse.json({
      success: true,
      message: "Продуктът беше добавен успешно",
      product: result[0],
    })
  } catch (error) {
    console.error("Error adding product:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"

    return NextResponse.json(
      {
        success: false,
        error: `Грешка при добавяне на продукта: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
