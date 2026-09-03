"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/star-rating"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProductReviewFormProps {
  productId: string
  isEnglish?: boolean
  onReviewSubmitted?: () => void
}

export function ProductReviewForm({ productId, isEnglish = false, onReviewSubmitted }: ProductReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [reviewerName, setReviewerName] = useState("")
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error(isEnglish ? "Please select a rating" : "Моля, изберете оценка")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          reviewerName: reviewerName.trim() || null,
          reviewText: reviewText.trim() || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(isEnglish ? "Review submitted successfully!" : "Отзивът е изпратен успешно!")
        setRating(0)
        setReviewerName("")
        setReviewText("")
        onReviewSubmitted?.()
      } else {
        toast.error(data.error || (isEnglish ? "Failed to submit review" : "Грешка при изпращане на отзива"))
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error(isEnglish ? "Failed to submit review" : "Грешка при изпращане на отзива")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {isEnglish ? "Your Rating" : "Вашата оценка"} *
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
          isEnglish={isEnglish}
        />
      </div>

      <div>
        <label htmlFor="reviewerName" className="block text-sm font-medium text-neutral-700 mb-1.5">
          {isEnglish ? "Your Name" : "Вашето име"} ({isEnglish ? "optional" : "по избор"})
        </label>
        <Input
          id="reviewerName"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder={isEnglish ? "Enter your name" : "Въведете вашето име"}
          className="bg-white border-neutral-200"
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium text-neutral-700 mb-1.5">
          {isEnglish ? "Your Review" : "Вашият отзив"} ({isEnglish ? "optional" : "по избор"})
        </label>
        <Textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={isEnglish ? "Share your experience with this product..." : "Споделете вашия опит с този продукт..."}
          className="bg-white border-neutral-200 min-h-[100px] resize-none"
          maxLength={1000}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white py-3"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isEnglish ? "Submitting..." : "Изпращане..."}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {isEnglish ? "Submit Review" : "Изпрати отзив"}
          </>
        )}
      </Button>
    </form>
  )
}
