"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface HeroBanner {
  id: number
  image_url: string
  link_url?: string | null
  sort_order?: number
}

interface HeroBannerCarouselProps {
  banners: HeroBanner[]
  autoPlayInterval?: number
  fallbackImage?: string
}

export function HeroBannerCarousel({
  banners,
  autoPlayInterval = 5000,
  fallbackImage = "/images/20250510-1413-d0-a0-d0-b5-d0-ba-d0-bb-d0-b0-d0-bc-d0-b5-d0-bd-20-d0-b1-d0-b0-d0-bd-d0-b5-d1-80-20-d0-b7-d0-b0-d1-85-d1-80-d0-b0-d0-bd-d0-ba-d0-b8-remix-01jtwyb7wwfm9ak0k3cm6xegsp.png",
}: HeroBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const slides = banners.length > 0 ? banners : [{ id: 0, image_url: fallbackImage, link_url: null }]
  const totalSlides = slides.length

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentIndex(index)
      setTimeout(() => setIsTransitioning(false), 700)
    },
    [isTransitioning],
  )

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % totalSlides)
  }, [currentIndex, totalSlides, goToSlide])

  const goPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + totalSlides) % totalSlides)
  }, [currentIndex, totalSlides, goToSlide])

  // Auto-advance
  useEffect(() => {
    if (totalSlides <= 1) return
    timerRef.current = setInterval(goNext, autoPlayInterval)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [goNext, autoPlayInterval, totalSlides])

  // Reset timer on manual navigation
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (totalSlides > 1) {
      timerRef.current = setInterval(goNext, autoPlayInterval)
    }
  }, [goNext, autoPlayInterval, totalSlides])

  // Touch handlers for swipe
  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        goNext()
      } else {
        goPrev()
      }
      resetTimer()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goPrev()
        resetTimer()
      } else if (e.key === "ArrowRight") {
        goNext()
        resetTimer()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev, resetTimer])

  const renderSlideContent = (slide: HeroBanner, index: number) => {
    const imageElement = (
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        key={slide.id}
      >
        <Image
          src={slide.image_url || "/placeholder.svg"}
          alt={`Banner ${index + 1}`}
          fill
          priority={index === 0}
          className="object-cover"
          sizes="100vw"
        />
      </div>
    )

    if (slide.link_url) {
      return (
        <Link
          href={slide.link_url}
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={slide.image_url || "/placeholder.svg"}
            alt={`Banner ${index + 1}`}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
        </Link>
      )
    }

    return imageElement
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Banner carousel"
      aria-roledescription="carousel"
    >
      {/* Aspect ratio container - 16:9 on mobile, ~21:9 cinematic on desktop */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[21/9] lg:aspect-[21/8]">
        {/* Slides */}
        {slides.map((slide, index) => renderSlideContent(slide, index))}

        {/* Navigation Arrows - only show when more than 1 banner */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={() => {
                goPrev()
                resetTimer()
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={() => {
                goNext()
                resetTimer()
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  goToSlide(index)
                  resetTimer()
                }}
                className={`transition-all duration-500 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-2.5 bg-white"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to banner ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
