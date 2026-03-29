"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter, X, SlidersHorizontal, ChevronDown, Check } from "lucide-react"

interface CategoryFilterPanelProps {
  categoryId: string
  subcategories: Array<{
    id: string
    title: string
    title_en?: string
    displayTitle?: string
  }>
  currentSubcategoryId?: string
  minPrice?: string
  maxPrice?: string
  sortOption: string
  isEnglish?: boolean
}

// Helper function to get English title with fallback
function getEnglishTitle(item: { title_en?: string; title: string; displayTitle?: string }): string {
  if (item.displayTitle) return item.displayTitle
  return item.title_en && item.title_en.trim() !== "" ? item.title_en : item.title
}

export function CategoryFilterPanel({
  categoryId,
  subcategories,
  currentSubcategoryId,
  minPrice,
  maxPrice,
  sortOption,
  isEnglish = false,
}: CategoryFilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localMinPrice, setLocalMinPrice] = useState(minPrice || "")
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || "")
  const [showFilters, setShowFilters] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position for sticky mobile filter bar
  useEffect(() => {
    const handleScroll = () => {
      // Show floating bar after scrolling past 200px
      setIsScrolled(window.scrollY > 200)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    const baseUrl = isEnglish ? `/en/category/${categoryId}` : `/category/${categoryId}`
    router.push(`${baseUrl}?${params.toString()}`)
  }

  const clearFilters = () => {
    setLocalMinPrice("")
    setLocalMaxPrice("")
    const baseUrl = isEnglish ? `/en/category/${categoryId}` : `/category/${categoryId}`
    router.push(baseUrl)
  }

  const applyPriceFilters = () => {
    updateFilters({
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      subcategory: currentSubcategoryId,
      sort: sortOption,
    })
  }

  const hasActiveFilters = currentSubcategoryId || minPrice || maxPrice

  return (
    <>
      {/* Floating Apple-style sticky filter bar for mobile - positioned at top */}
      <div
        className={`md:hidden fixed left-4 right-4 z-40 transition-all duration-300 ease-out ${
          isScrolled 
            ? "top-28 opacity-100 translate-y-0" 
            : "top-28 opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 p-2">
          <div className="flex items-center gap-1.5">
            {/* Filter button with Sheet for mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <button 
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] bg-gray-100/90 hover:bg-gray-200/90 active:scale-[0.98] text-gray-800 font-medium text-[13px] transition-all"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {isEnglish ? "Filters" : "Филтри"}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[20px] max-h-[70vh] pb-24">
                <SheetHeader className="text-left pb-4 border-b">
                  <SheetTitle className="text-lg font-semibold">{isEnglish ? "Price Range" : "Ценови диапазон"}</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPriceMobile" className="text-sm text-gray-500">{isEnglish ? "Min Price" : "Минимална цена"}</Label>
                    <Input
                      id="minPriceMobile"
                      type="number"
                      placeholder="0"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(e.target.value)}
                      className="h-12 rounded-xl text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPriceMobile" className="text-sm text-gray-500">{isEnglish ? "Max Price" : "Максимална цена"}</Label>
                    <Input
                      id="maxPriceMobile"
                      type="number"
                      placeholder="1000"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(e.target.value)}
                      className="h-12 rounded-xl text-base"
                    />
                  </div>
                  <Button onClick={applyPriceFilters} className="w-full h-12 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800">
                    {isEnglish ? "Apply Filters" : "Приложи филтри"}
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="w-full h-12 rounded-xl text-base text-red-600 hover:text-red-700 hover:bg-red-50">
                      {isEnglish ? "Clear All" : "Изчисти всички"}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Subcategory dropdown - Apple style */}
            {subcategories.length > 0 && (
              <Select
                value={currentSubcategoryId || "all"}
                onValueChange={(value) =>
                  updateFilters({
                    subcategory: value === "all" ? undefined : value,
                    minPrice,
                    maxPrice,
                    sort: sortOption,
                  })
                }
              >
                <SelectTrigger className="flex-1 h-10 px-4 rounded-[14px] bg-gray-100/90 border-0 text-[13px] font-medium text-gray-800 focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                  <span className="truncate">{currentSubcategoryId ? subcategories.find(s => s.id === currentSubcategoryId)?.title?.slice(0, 12) + (subcategories.find(s => s.id === currentSubcategoryId)?.title && subcategories.find(s => s.id === currentSubcategoryId)!.title.length > 12 ? "..." : "") : (isEnglish ? "All" : "Всички")}</span>
                  <ChevronDown className="h-4 w-4 ml-1 opacity-50 shrink-0" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-[0_10px_40px_rgb(0,0,0,0.15)] bg-white/95 backdrop-blur-xl p-1" align="center">
                  <SelectItem value="all" className="rounded-xl py-3 px-4 text-sm cursor-pointer focus:bg-gray-100">
                    <div className="flex items-center gap-2">
                      {!currentSubcategoryId && <Check className="h-4 w-4 text-blue-500" />}
                      <span>{isEnglish ? "All subcategories" : "Всички подкатегории"}</span>
                    </div>
                  </SelectItem>
                  {subcategories.map((subcategory) => {
                    const displayTitle = isEnglish ? getEnglishTitle(subcategory) : subcategory.title
                    return (
                      <SelectItem key={subcategory.id} value={subcategory.id} className="rounded-xl py-3 px-4 text-sm cursor-pointer focus:bg-gray-100">
                        <div className="flex items-center gap-2">
                          {currentSubcategoryId === subcategory.id && <Check className="h-4 w-4 text-blue-500" />}
                          <span>{displayTitle}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}

            {/* Sort dropdown - Apple style */}
            <Select
              value={sortOption}
              onValueChange={(value) =>
                updateFilters({
                  subcategory: currentSubcategoryId,
                  minPrice,
                  maxPrice,
                  sort: value,
                })
              }
            >
              <SelectTrigger className="w-auto min-w-[70px] h-10 px-4 rounded-[14px] bg-gray-100/90 border-0 text-[13px] font-medium text-gray-800 focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                <span>{sortOption === "title-asc" ? (isEnglish ? "A-Z" : "А-Я") : sortOption === "title-desc" ? (isEnglish ? "Z-A" : "Я-А") : sortOption === "price-asc" ? "↑" : "↓"}</span>
                <ChevronDown className="h-4 w-4 ml-1 opacity-50 shrink-0" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 shadow-[0_10px_40px_rgb(0,0,0,0.15)] bg-white/95 backdrop-blur-xl p-1 min-w-[180px]" align="end">
                <SelectItem value="title-asc" className="rounded-xl py-3 px-4 text-sm cursor-pointer focus:bg-gray-100">
                  <div className="flex items-center gap-2">
                    {sortOption === "title-asc" && <Check className="h-4 w-4 text-blue-500" />}
                    <span>{isEnglish ? "Name A-Z" : "Име А-Я"}</span>
                  </div>
                </SelectItem>
                <SelectItem value="title-desc" className="rounded-xl py-3 px-4 text-sm cursor-pointer focus:bg-gray-100">
                  <div className="flex items-center gap-2">
                    {sortOption === "title-desc" && <Check className="h-4 w-4 text-blue-500" />}
                    <span>{isEnglish ? "Name Z-A" : "Име Я-А"}</span>
                  </div>
                </SelectItem>
                <SelectItem value="price-asc" className="rounded-xl py-3 px-4 text-sm cursor-pointer focus:bg-gray-100">
                  <div className="flex items-center gap-2">
                    {sortOption === "price-asc" && <Check className="h-4 w-4 text-blue-500" />}
                    <span>{isEnglish ? "Price: Low to High" : "Цена ↑"}</span>
                  </div>
                </SelectItem>
                <SelectItem value="price-desc" className="rounded-xl py-3 px-4 text-sm cursor-pointer focus:bg-gray-100">
                  <div className="flex items-center gap-2">
                    {sortOption === "price-desc" && <Check className="h-4 w-4 text-blue-500" />}
                    <span>{isEnglish ? "Price: High to Low" : "Цена ↓"}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop filter panel - hidden on mobile */}
      <div className="hidden md:block space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {isEnglish ? "Filters" : "Филтри"}
          </Button>

          {subcategories.length > 0 && (
            <Select
              value={currentSubcategoryId || "all"}
              onValueChange={(value) =>
                updateFilters({
                  subcategory: value === "all" ? undefined : value,
                  minPrice,
                  maxPrice,
                  sort: sortOption,
                })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isEnglish ? "All subcategories" : "Всички подкатегории"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isEnglish ? "All subcategories" : "Всички подкатегории"}</SelectItem>
                {subcategories.map((subcategory) => {
                  const displayTitle = isEnglish ? getEnglishTitle(subcategory) : subcategory.title
                  return (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {displayTitle}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}

          <Select
            value={sortOption}
            onValueChange={(value) =>
              updateFilters({
                subcategory: currentSubcategoryId,
                minPrice,
                maxPrice,
                sort: value,
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">{isEnglish ? "Name A-Z" : "Име А-Я"}</SelectItem>
              <SelectItem value="title-desc">{isEnglish ? "Name Z-A" : "Име Я-А"}</SelectItem>
              <SelectItem value="price-asc">{isEnglish ? "Price: Low to High" : "Цена: Ниска към Висока"}</SelectItem>
              <SelectItem value="price-desc">{isEnglish ? "Price: High to Low" : "Цена: Висока към Ниска"}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {isEnglish ? "Clear filters" : "Изчисти филтри"}
            </Button>
          )}
        </div>

        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle>{isEnglish ? "Price Range" : "Ценови диапазон"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="minPrice">{isEnglish ? "Min Price" : "Минимална цена"}</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="0"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">{isEnglish ? "Max Price" : "Максимална цена"}</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="1000"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                  />
                </div>
                <Button onClick={applyPriceFilters}>{isEnglish ? "Apply" : "Приложи"}</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
