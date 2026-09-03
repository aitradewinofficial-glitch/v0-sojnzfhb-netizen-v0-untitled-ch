import { NextRequest, NextResponse } from "next/server"
import { getProductReviews, getProductRatingSummary, createProductReview } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get("productId")

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
  }

  try {
    const [reviews, summary] = await Promise.all([
      getProductReviews(productId, true),
      getProductRatingSummary(productId),
    ])

    return NextResponse.json({
      success: true,
      reviews,
      summary: summary || { product_id: productId, review_count: 0, average_rating: 0 },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, rating, reviewerName, reviewerEmail, reviewText } = body

    if (!productId || !rating) {
      return NextResponse.json({ error: "Product ID and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const review = await createProductReview(productId, rating, reviewerName, reviewerEmail, reviewText)

    if (!review) {
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
