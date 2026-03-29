"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface Category {
  id: string
  title: string
  title_en?: string
  deleted?: boolean
}

interface Subcategory {
  id: string
  cateid: string
  title: string
  title_en?: string
  deleted?: boolean
}

interface CategoriesNavbarProps {
  currentCategoryId?: string
  isEnglish?: boolean
  categories?: Category[]
  subcategories?: Subcategory[]
}

export function CategoriesNavbar({
  currentCategoryId,
  isEnglish = false,
  categories = [],
  subcategories = [],
}: CategoriesNavbarProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const activeCategories = categories.filter((category) => !category.deleted && category.id && category.title)
  const activeSubcategories = subcategories.filter((sub) => !sub.deleted && sub.id)

  // Group subcategories by category
  const subcategoriesByCategory = activeSubcategories.reduce(
    (acc, sub) => {
      if (!acc[sub.cateid]) acc[sub.cateid] = []
      acc[sub.cateid].push(sub)
      return acc
    },
    {} as Record<string, Subcategory[]>
  )

  const handleMouseEnter = (categoryId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setHoveredCategory(categoryId)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (activeCategories.length === 0) {
    return (
      <div className="bg-neutral-950/80 backdrop-blur-2xl fixed top-[56px] sm:top-[64px] left-0 right-0 w-full z-[9998] border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <span className="text-neutral-500 text-sm font-medium">
              {isEnglish ? "Loading categories..." : "Зареждане на категории..."}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        ref={navRef}
        className="bg-neutral-950/80 backdrop-blur-2xl fixed top-[56px] sm:top-[64px] left-0 right-0 w-full z-[9998] border-b border-white/[0.08]"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop - Full width with flex wrap */}
          <div className="hidden md:flex items-center justify-center flex-wrap gap-x-1 gap-y-1 py-2.5">
            {activeCategories.map((category) => {
              const categoryTitle = isEnglish
                ? category.title_en || category.title
                : category.title
              const isActive = category.id === currentCategoryId
              const hasSubs = subcategoriesByCategory[category.id]?.length > 0
              const isHovered = hoveredCategory === category.id

              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(category.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={isEnglish ? `/en/category/${category.id}` : `/category/${category.id}`}
                    className={`
                      relative flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium
                      transition-all duration-300 ease-out whitespace-nowrap
                      ${
                        isActive
                          ? "bg-white text-neutral-900 shadow-sm"
                          : isHovered
                            ? "bg-white/[0.12] text-white"
                            : "text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                      }
                    `}
                  >
                    <span className="tracking-[-0.01em]">{categoryTitle}</span>
                    {hasSubs && (
                      <ChevronDown 
                        className={`h-3.5 w-3.5 opacity-60 transition-transform duration-300 ease-out ${isHovered ? "rotate-180" : ""}`} 
                      />
                    )}
                  </Link>

                  {/* Apple-style Subcategory Dropdown */}
                  {hasSubs && isHovered && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[10000]"
                      onMouseEnter={() => handleMouseEnter(category.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Dropdown arrow */}
                      <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/95 backdrop-blur-2xl border-l border-t border-neutral-200/50" />
                      
                      <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden min-w-[240px] max-h-[65vh] overflow-y-auto">
                        <div className="py-2">
                          {subcategoriesByCategory[category.id].map((sub, index) => {
                            const subTitle = isEnglish
                              ? sub.title_en || sub.title
                              : sub.title
                            return (
                              <Link
                                key={sub.id}
                                href={isEnglish ? `/en/subcategory/${sub.id}` : `/subcategory/${sub.id}`}
                                className="group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-neutral-700 hover:bg-neutral-100/80 active:bg-neutral-200/60 transition-all duration-200"
                                style={{ animationDelay: `${index * 20}ms` }}
                              >
                                <span className="flex-1 tracking-[-0.01em]">{subTitle}</span>
                                <ChevronDown className="h-3 w-3 -rotate-90 opacity-0 group-hover:opacity-40 transition-opacity duration-200" />
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile - Horizontal scroll */}
          <div className="flex md:hidden items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none -mx-4 px-4">
            {activeCategories.map((category) => {
              const categoryTitle = isEnglish
                ? category.title_en || category.title
                : category.title
              const isActive = category.id === currentCategoryId

              return (
                <Link
                  key={category.id}
                  href={isEnglish ? `/en/category/${category.id}` : `/category/${category.id}`}
                  className={`
                    relative flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium
                    transition-all duration-300 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                    }
                  `}
                >
                  <span className="tracking-[-0.01em]">{categoryTitle}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-[52px]" />
    </>
  )
}
