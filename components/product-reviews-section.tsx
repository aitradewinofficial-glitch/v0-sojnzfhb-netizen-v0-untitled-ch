"use client"

import { useState, useEffect } from "react"
import { StarRating } from "@/components/star-rating"
import { ProductReviewForm } from "@/components/product-review-form"
import { MessageSquare, User, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Review {
  id: number
  product_id: string
  rating: number
  reviewer_name: string | null
  review_text: string | null
  created_at: string
}

interface ReviewSummary {
  product_id: string
  review_count: number
  average_rating: number
}

interface ProductReviewsSectionProps {
  productId: string
  isEnglish?: boolean
}

export function ProductReviewsSection({ productId, isEnglish = false }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`)
      const data = await response.json()
      if (data.success) {
        setReviews(data.reviews)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isEnglish ? "en-US" : "bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <section className="py-12 md:py-16 border-t border-neutral-200/60">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              {isEnglish ? "Customer Reviews" : "Отзиви от клиенти"}
            </h2>
            {summary && summary.review_count > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <StarRating
                  rating={summary.average_rating}
                  size="md"
                  showValue
                  reviewCount={summary.review_count}
                  isEnglish={isEnglish}
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 text-neutral-700 bg-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {showForm
              ? isEnglish
                ? "Cancel"
                : "Отказ"
              : isEnglish
                ? "Write a Review"
                : "Напиши отзив"}
          </Button>
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="mb-10 p-6 bg-white rounded-2xl border border-neutral-200/60 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {isEnglish ? "Share Your Experience" : "Споделете вашия опит"}
            </h3>
            <ProductReviewForm
              productId={productId}
              isEnglish={isEnglish}
              onReviewSubmitted={() => {
                setShowForm(false)
                fetchReviews()
              }}
            />
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 bg-white rounded-2xl border border-neutral-200/60 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {review.reviewer_name || (isEnglish ? "Anonymous" : "Анонимен")}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.review_text && (
                  <p className="mt-3 text-neutral-600 text-sm leading-relaxed">
                    {review.review_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200/60">
            <MessageSquare className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">
              {isEnglish
                ? "No reviews yet. Be the first to share your experience!"
                : "Все още няма отзиви. Бъдете първият, който ще сподели своя опит!"}
            </p>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="mt-4 rounded-xl border-neutral-300 hover:bg-neutral-100 text-neutral-700 bg-transparent"
              >
                {isEnglish ? "Write a Review" : "Напиши отзив"}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
