import { NextResponse } from "next/server"
import { put, type PutBlobResult } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    // Generate unique filename
    const filename = `news/${nanoid(10)}-${file.name.replace(/\s/g, "-")}`

    // Upload to Vercel Blob
    const blob: PutBlobResult = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("Error uploading news image:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown upload error"
    return NextResponse.json({ error: `File upload failed: ${errorMessage}` }, { status: 500 })
  }
}
