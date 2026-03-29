import { NextResponse } from "next/server"
import { updateBannerSortOrder } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
  }

  try {
    const { sort_order } = await request.json()
    if (typeof sort_order !== "number") {
      return NextResponse.json({ error: "sort_order must be a number" }, { status: 400 })
    }

    const result = await updateBannerSortOrder(id, sort_order)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to update sort order: ${errorMessage}` }, { status: 500 })
  }
}
