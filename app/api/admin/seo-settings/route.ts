import { NextResponse } from "next/server"
import { getSeoSettings, updateSeoSettings } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageKey = searchParams.get("pageKey") || "homepage"
    
    const settings = await getSeoSettings(pageKey)
    
    if (!settings) {
      // Return default values if no settings exist
      return NextResponse.json({
        page_key: pageKey,
        meta_title: "Мадикс Граундбейтс - Професионални риболовни принадлежности",
        meta_description: "Най-голямата фабрика за захранки в България. Висококачествени риболовни продукти от 1995 година.",
        meta_keywords: "риболов, захранки, риболовни принадлежности",
        og_title: "Мадикс Граундбейтс",
        og_description: "Професионални риболовни продукти",
        og_type: "website",
        og_locale: "bg_BG",
        twitter_card: "summary_large_image",
        robots: "index, follow",
        schema_type: "Organization",
        theme_color: "#f59e0b",
        background_color: "#ffffff",
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch SEO settings:", error)
    return NextResponse.json({ error: "Failed to fetch SEO settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { page_key = "homepage", ...data } = body

    const result = await updateSeoSettings(page_key, data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Failed to update SEO settings:", error)
    return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 })
  }
}
