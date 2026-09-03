import { NextResponse } from "next/server"
import { getNewsById, updateNews, deleteNews } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const news = await getNewsById(parseInt(id))
    
    if (!news) {
      return NextResponse.json({ error: "News not found" }, { status: 404 })
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const news = await updateNews(parseInt(id), data)
    
    if (!news) {
      return NextResponse.json({ error: "Failed to update news" }, { status: 500 })
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error("Failed to update news:", error)
    return NextResponse.json({ error: "Failed to update news" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = await deleteNews(parseInt(id))
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete news" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete news:", error)
    return NextResponse.json({ error: "Failed to delete news" }, { status: 500 })
  }
}
