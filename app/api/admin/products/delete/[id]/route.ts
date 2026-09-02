import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    console.log("Received request to delete product with ID:", params.id)

    // Validate required fields
    if (!params.id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    // Check if the product exists
    const product = await sql`
      SELECT objectid, title FROM new_products
      WHERE objectid = ${params.id}
    `

    if (!product || product.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    console.log("Found product to delete:", product)

    // Delete the product from the database (soft delete)
    const result = await sql`
      UPDATE new_products
      SET deleted = true
      WHERE objectid = ${params.id}
      RETURNING objectid
    `

    console.log("Delete result:", result)

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      id: params.id,
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: `Error deleting product: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
