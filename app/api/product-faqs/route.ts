import { NextRequest, NextResponse } from "next/server"
import { getProductFAQs, getAllProductFAQs, addProductFAQ, updateProductFAQ, deleteProductFAQ } from "@/lib/db"

// GET - Fetch FAQs for a product
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get("productId")
  const includeInactive = searchParams.get("includeInactive") === "true"

  if (!productId) {
    return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
  }

  try {
    const faqs = includeInactive 
      ? await getAllProductFAQs(productId)
      : await getProductFAQs(productId)
    
    return NextResponse.json({
      success: true,
      faqs,
    })
  } catch (error) {
    console.error("Error fetching product FAQs:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch FAQs" }, { status: 500 })
  }
}

// POST - Add a new FAQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, question, answer, question_en, answer_en, display_order } = body

    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: "Question and answer are required" }, { status: 400 })
    }

    const faq = await addProductFAQ(
      productId,
      question,
      answer,
      question_en,
      answer_en,
      display_order || 0
    )

    if (!faq) {
      return NextResponse.json({ success: false, error: "Failed to add FAQ" }, { status: 500 })
    }

    return NextResponse.json({ success: true, faq })
  } catch (error) {
    console.error("Error adding product FAQ:", error)
    return NextResponse.json({ success: false, error: "Failed to add FAQ" }, { status: 500 })
  }
}

// PUT - Update an existing FAQ
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, question, answer, question_en, answer_en, display_order, is_active } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 })
    }

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: "Question and answer are required" }, { status: 400 })
    }

    const faq = await updateProductFAQ(
      id,
      question,
      answer,
      question_en,
      answer_en,
      display_order,
      is_active
    )

    if (!faq) {
      return NextResponse.json({ success: false, error: "Failed to update FAQ" }, { status: 500 })
    }

    return NextResponse.json({ success: true, faq })
  } catch (error) {
    console.error("Error updating product FAQ:", error)
    return NextResponse.json({ success: false, error: "Failed to update FAQ" }, { status: 500 })
  }
}

// DELETE - Delete an FAQ
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 })
  }

  try {
    const success = await deleteProductFAQ(id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to delete FAQ" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product FAQ:", error)
    return NextResponse.json({ success: false, error: "Failed to delete FAQ" }, { status: 500 })
  }
}
