"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  reviewCount?: number
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
  isEnglish?: boolean
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
  interactive = false,
  onRatingChange,
  className,
  isEnglish = false,
}: StarRatingProps) {
  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (interactive && onRatingChange && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      onRatingChange(starIndex + 1)
    }
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const fillPercentage = Math.min(Math.max(rating - index, 0), 1) * 100
          const isFilled = fillPercentage > 0
          const isPartial = fillPercentage > 0 && fillPercentage < 100

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleStarClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "relative focus:outline-none transition-transform",
                interactive && "cursor-pointer hover:scale-110 focus:scale-110",
                !interactive && "cursor-default"
              )}
              aria-label={
                interactive
                  ? isEnglish
                    ? `Rate ${index + 1} out of ${maxRating} stars`
                    : `Оценка ${index + 1} от ${maxRating} звезди`
                  : undefined
              }
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-neutral-200 fill-neutral-200"
                )}
              />
              {/* Foreground star (filled) - overlaid with clip for partial fill */}
              {isFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isPartial ? `${fillPercentage}%` : "100%" }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "text-amber-400 fill-amber-400"
                    )}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {showValue && (
        <span className={cn("font-medium text-neutral-700", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {reviewCount !== undefined && (
        <span className={cn("text-neutral-400", textSizeClasses[size])}>
          ({reviewCount} {isEnglish ? (reviewCount === 1 ? "review" : "reviews") : (reviewCount === 1 ? "отзив" : "отзива")})
        </span>
      )}
    </div>
  )
}

// Compact version for product cards - shows all 5 stars
export function StarRatingCompact({
  rating = 0,
  reviewCount,
  size = "sm",
  className,
  showEmpty = true,
}: {
  rating?: number
  reviewCount?: number
  size?: "sm" | "md"
  className?: string
  showEmpty?: boolean
}) {
  const maxRating = 5
  
  // If no rating and showEmpty is false, don't render anything
  if ((!rating || rating === 0) && !showEmpty) return null
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const fillPercentage = Math.min(Math.max((rating || 0) - index, 0), 1) * 100
          const isFilled = fillPercentage > 0
          const isPartial = fillPercentage > 0 && fillPercentage < 100

          return (
            <div key={index} className="relative">
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-neutral-300 stroke-neutral-300",
                  !isFilled && "fill-transparent"
                )}
              />
              {/* Foreground star (filled) - overlaid with clip for partial fill */}
              {isFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isPartial ? `${fillPercentage}%` : "100%" }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "text-amber-400 fill-amber-400"
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {rating > 0 && (
        <span className={cn("font-medium text-neutral-700", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className={cn("text-neutral-400", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
