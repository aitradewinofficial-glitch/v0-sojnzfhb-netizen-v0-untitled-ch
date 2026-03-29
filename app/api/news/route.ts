import { NextResponse } from "next/server"
import { getNews } from "@/lib/db"

export async function GET() {
  try {
    const news = await getNews(true) // Get only active news
    return NextResponse.json(news)
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}
