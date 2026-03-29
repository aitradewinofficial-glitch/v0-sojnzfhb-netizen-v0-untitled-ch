"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronRight, Search, Loader2 } from "lucide-react"
import { useMobileMenu } from "@/context/mobile-menu-context"

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

interface MobileMenuProps {
  categories: Category[]
  subcategories?: Subcategory[]
  currentCategoryId?: string
  currentSubcategoryId?: string
  isEnglish?: boolean
}

type SearchResult = {
  objectid: string
  title: string
  price: string
  photourl?: string
  description?: string
}

export function MobileMenu({
  categories,
  subcategories = [],
  currentCategoryId,
  currentSubcategoryId,
  isEnglish = false,
}: MobileMenuProps) {
  const { isOpen, activeTab, openMenu, closeMenu, setActiveTab } = useMobileMenu()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const activeCategories = categories.filter((category) => !category.deleted && category.id)
  const activeSubcategories = subcategories.filter((subcategory) => !subcategory.deleted && subcategory.id)

  const subcategoriesByCategory = activeSubcategories.reduce(
    (acc, subcategory) => {
      if (!acc[subcategory.cateid]) acc[subcategory.cateid] = []
      acc[subcategory.cateid].push(subcategory)
      return acc
    },
    {} as Record<string, Subcategory[]>,
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) closeMenu()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [closeMenu])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.body.classList.add("mobile-menu-open")
      // Focus search input when search tab is active
      if (activeTab === "search" && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    } else {
      document.body.style.overflow = "auto"
      document.body.classList.remove("mobile-menu-open")
    }
    return () => {
      document.body.style.overflow = "auto"
      document.body.classList.remove("mobile-menu-open")
    }
  }, [isOpen, activeTab])

  const toggleCategoryExpand = (categoryId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const searchUrl = isEnglish
        ? `/en/search?q=${encodeURIComponent(searchQuery.trim())}`
        : `/search?q=${encodeURIComponent(searchQuery.trim())}`
      window.location.href = searchUrl
      closeMenu()
    }
  }

  const fetchSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    try {
      setIsSearching(true)
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`)
      if (!response.ok) throw new Error("Failed to fetch suggestions")
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Error fetching search suggestions:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)
    if (value.trim()) {
      setIsSearching(true)
      searchDebounceTimeout.current = setTimeout(() => fetchSearchSuggestions(value), 300)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  const getCategoryTitle = (category: Category) =>
    isEnglish ? category.title_en || category.title || "No name" : category.title || category.title_en || "Без име"

  const getSubcategoryTitle = (subcategory: Subcategory) =>
    isEnglish
      ? subcategory.title_en || subcategory.title || "No name"
      : subcategory.title || subcategory.title_en || "Без име"

  const getCategoryUrl = (id: string) => (isEnglish ? `/en/category/${id}` : `/category/${id}`)
  const getSubcategoryUrl = (id: string) => (isEnglish ? `/en/subcategory/${id}` : `/subcategory/${id}`)
  const getProductUrl = (id: string) => (isEnglish ? `/en/product/${id}` : `/product/${id}`)
  const getSearchUrl = (q: string) =>
    isEnglish ? `/en/search?q=${encodeURIComponent(q)}` : `/search?q=${encodeURIComponent(q)}`

  const menuPanel = (
    <div 
      className="fixed md:hidden inset-x-0"
      style={{ 
        zIndex: 9998,
        top: "3.5rem", // Header height (h-14 = 56px)
        bottom: "4.5rem", // Bottom nav height (~72px)
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeMenu}
      />

      {/* Panel - Apple-style sheet */}
      <div 
        className="absolute inset-x-0 top-0 bottom-0 bg-white flex flex-col animate-in slide-in-from-top-2 duration-300 ease-out"
        style={{ maxHeight: "100%" }}
      >
        {/* Tab Switcher - Apple Segmented Control Style */}
        <div className="px-4 pt-4 pb-3 bg-neutral-50/80 backdrop-blur-xl border-b border-neutral-200/60">
          <div className="flex p-1 bg-neutral-200/60 rounded-xl">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "search"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Search className="h-4 w-4" />
              {isEnglish ? "Search" : "Търсене"}
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "categories"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
              {isEnglish ? "Categories" : "Категории"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === "search" ? (
            /* Search Tab Content */
            <div className="flex flex-col h-full">
              {/* Search Input */}
              <div className="px-4 py-4 bg-white sticky top-0 z-10 border-b border-neutral-100">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={isEnglish ? "Search products..." : "Търсене на продукти..."}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-full h-12 px-4 pl-12 rounded-2xl bg-neutral-100 border-0 text-neutral-900 text-base placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 animate-spin" />
                  )}
                </form>
              </div>

              {/* Search Results */}
              <div className="flex-1 px-4 py-2">
                {searchResults.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-1 mb-3">
                      {isEnglish ? "Results" : "Резултати"}
                    </p>
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <Link
                          key={result.objectid}
                          href={getProductUrl(result.objectid)}
                          className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-2xl transition-colors"
                          onClick={closeMenu}
                        >
                          {result.photourl && (
                            <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl overflow-hidden shadow-sm">
                              <Image
                                src={result.photourl || "/placeholder.svg"}
                                alt={result.title}
                                width={56}
                                height={56}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{result.title}</p>
                            <p className="text-sm font-bold text-amber-600 mt-0.5">
                              {result.price} {isEnglish ? "BGN" : "лв."}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                    {searchQuery.trim() && (
                      <Link
                        href={getSearchUrl(searchQuery)}
                        className="block mt-4 py-3 text-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                        onClick={closeMenu}
                      >
                        {isEnglish ? "View all results" : "Вижте всички резултати"} →
                      </Link>
                    )}
                  </div>
                ) : searchQuery.trim() && !isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="h-7 w-7 text-neutral-400" />
                    </div>
                    <p className="text-base font-semibold text-neutral-900">
                      {isEnglish ? "No results found" : "Няма резултати"}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {isEnglish ? "Try different keywords" : "Опитайте с други думи"}
                    </p>
                  </div>
                ) : !searchQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="h-7 w-7 text-neutral-400" />
                    </div>
                    <p className="text-base font-semibold text-neutral-900">
                      {isEnglish ? "Search products" : "Търсете продукти"}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {isEnglish ? "Enter keywords above" : "Въведете ключови думи"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            /* Categories Tab Content */
            <div className="py-2">
              {activeCategories.map((category) => {
                if (!category.id) return null
                const hasSubs = subcategoriesByCategory[category.id]?.length > 0
                const isExpanded = expandedCategories[category.id]

                return (
                  <div key={category.id} className="border-b border-neutral-100 last:border-b-0">
                    <div className="flex items-center">
                      <Link
                        href={getCategoryUrl(category.id)}
                        className={`flex-1 flex items-center px-5 py-4 text-base font-semibold transition-colors ${
                          category.id === currentCategoryId
                            ? "text-amber-600 bg-amber-50/50"
                            : "text-neutral-900 hover:bg-neutral-50"
                        }`}
                        onClick={closeMenu}
                      >
                        {getCategoryTitle(category)}
                      </Link>
                      {hasSubs && (
                        <button
                          className="p-4 text-neutral-400 hover:text-neutral-600 transition-colors"
                          onClick={(e) => toggleCategoryExpand(category.id, e)}
                          aria-label={`Toggle subcategories for ${getCategoryTitle(category)}`}
                        >
                          <ChevronRight 
                            className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} 
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories */}
                    {isExpanded && hasSubs && (
                      <div className="bg-neutral-50 border-t border-neutral-100">
                        {subcategoriesByCategory[category.id].map((subcategory) => {
                          if (!subcategory.id) return null
                          return (
                            <Link
                              key={subcategory.id}
                              href={getSubcategoryUrl(subcategory.id)}
                              className={`block px-8 py-3.5 text-sm font-medium border-b border-neutral-100 last:border-b-0 transition-colors ${
                                subcategory.id === currentSubcategoryId
                                  ? "text-amber-600 bg-amber-50/50"
                                  : "text-neutral-700 hover:bg-neutral-100"
                              }`}
                              onClick={closeMenu}
                            >
                              {getSubcategoryTitle(subcategory)}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Close Button at Bottom */}
        <div className="px-4 py-3 bg-neutral-50/80 backdrop-blur-xl border-t border-neutral-200/60 safe-area-bottom">
          <button
            onClick={closeMenu}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            {isEnglish ? "Close" : "Затвори"}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Hamburger button */}
      <button
        className="md:hidden flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        onClick={() => openMenu("categories")}
        aria-label={isEnglish ? "Open menu" : "Отвори меню"}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portal renders menu at document.body level */}
      {isOpen && mounted && createPortal(menuPanel, document.body)}
    </>
  )
}
