import { NextRequest, NextResponse } from "next/server"
import { getAllReviews, updateProductReview, deleteProductReview, updateProductReviewApproval, getProductById } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  try {
    const { reviews, total } = await getAllReviews(page, limit)
    
    // Enrich reviews with product titles
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const product = await getProductById(review.product_id)
        return {
          ...review,
          product_title: product?.title || "Unknown Product",
        }
      })
    )

    return NextResponse.json({
      success: true,
      reviews: enrichedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewId, rating, reviewerName, reviewText, isApproved } = body

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
    }

    // If only updating approval status
    if (isApproved !== undefined && rating === undefined) {
      const success = await updateProductReviewApproval(reviewId, isApproved)
      if (!success) {
        return NextResponse.json({ error: "Failed to update review approval" }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    // Full update
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const success = await updateProductReview(reviewId, rating, reviewerName, reviewText, isApproved)

    if (!success) {
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reviewId = searchParams.get("id")

  if (!reviewId) {
    return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
  }

  try {
    const success = await deleteProductReview(parseInt(reviewId))

    if (!success) {
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
