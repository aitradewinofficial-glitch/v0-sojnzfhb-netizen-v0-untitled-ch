import { NextResponse } from "next/server"
import { getNews, createNews } from "@/lib/db"

export async function GET() {
  try {
    const news = await getNews(false) // Get all news including inactive
    return NextResponse.json(news)
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const news = await createNews(data)
    
    if (!news) {
      return NextResponse.json({ error: "Failed to create news" }, { status: 500 })
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error("Failed to create news:", error)
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 })
  }
}
