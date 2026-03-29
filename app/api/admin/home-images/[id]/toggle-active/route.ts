import { NextResponse } from "next/server"
import { toggleBannerActive } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
  }

  try {
    const { is_active } = await request.json()
    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 })
    }

    const result = await toggleBannerActive(id, is_active)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to toggle banner: ${errorMessage}` }, { status: 500 })
  }
}
