import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Уверете се, че DATABASE_URL е правилно конфигуриран във вашите променливи на средата
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    // If id is provided, fetch single category with all fields including SEO
    if (id) {
      const categoryData = await sql`
        SELECT 
          "Document ID",
          cateid,
          createdat,
          deleted,
          description,
          objectid,
          option,
          photourl,
          pricefrom,
          retailerpricefrom,
          searchable,
          title,
          wholesalerpricefrom,
          title_en,
          description_en,
          title_bg,
          description_bg,
          updatedat,
          seo_meta_title,
          seo_meta_description,
          seo_meta_keywords,
          seo_og_title,
          seo_og_description,
          seo_og_image,
          seo_twitter_card,
          seo_twitter_title,
          seo_twitter_description,
          seo_twitter_image,
          seo_canonical_url,
          seo_robots,
          seo_schema_type,
          seo_focus_keyword,
          seo_secondary_keywords,
          seo_meta_title_bg,
          seo_meta_description_bg,
          seo_meta_keywords_bg,
          seo_og_title_bg,
          seo_og_description_bg
        FROM categories 
        WHERE "Document ID" = ${id}
      `

      return NextResponse.json({
        success: true,
        categories: categoryData,
      })
    }

    // Извличаме всички активни категории, подредени по име.
    // Можете да добавите филтър за активни категории, ако имате такова поле, напр. WHERE active = true
    const categoriesData = await sql`
      SELECT 
        "Document ID" as id, 
        title
      FROM categories 
      ORDER BY title ASC
    `

    // Връщаме успешно извлечените категории
    return NextResponse.json({
      success: true,
      categories: categoriesData,
    })
  } catch (error: any) {
    console.error("Error in /api/admin/categories GET handler:", error)
    // Връщаме грешка, ако нещо се обърка
    return NextResponse.json(
      {
        success: false,
        error: "Възникна грешка при извличане на категориите от базата данни.",
        details: error.message, // Може да е полезно за дебъг
      },
      { status: 500 },
    )
  }
}
