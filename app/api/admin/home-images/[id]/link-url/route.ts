import { NextResponse } from "next/server"
import { updateBannerLinkUrl } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
  }

  try {
    const { link_url } = await request.json()
    if (link_url !== null && typeof link_url !== "string") {
      return NextResponse.json({ error: "link_url must be a string or null" }, { status: 400 })
    }

    const result = await updateBannerLinkUrl(id, link_url || null)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to update link URL: ${errorMessage}` }, { status: 500 })
  }
}
