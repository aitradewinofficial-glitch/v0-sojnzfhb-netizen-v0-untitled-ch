import { type NextRequest, NextResponse } from "next/server"
import { searchProducts } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    if (!query.trim()) {
      return NextResponse.json({ products: [] })
    }

    const products = await searchProducts(query)
    
    // Apply limit
    const limitedProducts = products.slice(0, limit)

    return NextResponse.json({ products: limitedProducts })
  } catch (error) {
    console.error("Error searching products:", error)
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    )
  }
}
