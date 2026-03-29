"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Gift, Check, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCart, type CartItem } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StarRatingCompact } from "@/components/star-rating"

interface ProductCardProps {
  id: string
  title: string
  description?: string
  price: number
  retailerprice?: number | null
  wholesalerprice?: number | null
  europe_price?: number | null
  price_eur?: number | null
  retailerprice_eur?: number | null
  wholesalerprice_eur?: number | null
  europe_price_eur?: number | null
  photourl?: string
  isLoggedIn: boolean
  customerType?: string | null
  discountPercent?: number
  isNew?: boolean
  discount?: number
  promo_buy_qty?: number | null
  promo_free_qty?: number | null
  promo_description?: string | null
  isEnglish?: boolean
  averageRating?: number | null
  reviewCount?: number | null
}

export function ProductCard({
  id,
  title,
  description,
  price,
  retailerprice,
  wholesalerprice,
  europe_price,
  price_eur,
  retailerprice_eur,
  wholesalerprice_eur,
  europe_price_eur,
  photourl,
  isLoggedIn,
  customerType,
  discountPercent,
  isNew = false,
  discount = 0,
  promo_buy_qty,
  promo_free_qty,
  promo_description,
  isEnglish = false,
  averageRating,
  reviewCount,
}: ProductCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { addItem } = useCart()
  const [isHovered, setIsHovered] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const formatPriceDisplay = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return "N/A"
    }
    return Number(value).toFixed(2)
  }

  const convertBgnToEur = (bgnPrice: number): number => {
    return bgnPrice / 1.96
  }

  const isEuropeanCustomer = () => {
    const type = customerType?.toLowerCase()
    return type === "european" || type === "europen"
  }

  // Get BGN price for customer type
  const getBasePriceForCustomer = (): number | null => {
    if (!isLoggedIn) {
      return Number(price)
    }
    const type = customerType?.toLowerCase()
    if (isEuropeanCustomer()) {
      return europe_price !== undefined && europe_price !== null ? Number(europe_price) : null
    } else if (type === "wholesaler" || type === "едро") {
      return wholesalerprice !== undefined && wholesalerprice !== null ? Number(wholesalerprice) : null
    } else if (type === "retailer" || type === "дребно") {
      return retailerprice !== undefined && retailerprice !== null ? Number(retailerprice) : null
    } else {
      return Number(price)
    }
  }

  // Get EUR price directly from database for customer type
  const getEurPriceForCustomer = (): number | null => {
    if (!isLoggedIn) {
      return price_eur !== undefined && price_eur !== null ? Number(price_eur) : null
    }
    const type = customerType?.toLowerCase()
    if (isEuropeanCustomer()) {
      return europe_price_eur !== undefined && europe_price_eur !== null ? Number(europe_price_eur) : null
    } else if (type === "wholesaler" || type === "едро") {
      return wholesalerprice_eur !== undefined && wholesalerprice_eur !== null ? Number(wholesalerprice_eur) : null
    } else if (type === "retailer" || type === "дребно") {
      return retailerprice_eur !== undefined && retailerprice_eur !== null ? Number(retailerprice_eur) : null
    } else {
      return price_eur !== undefined && price_eur !== null ? Number(price_eur) : null
    }
  }

  const displayPriceNumber = getBasePriceForCustomer()
  const displayEurPriceNumber = getEurPriceForCustomer()

  const getPriceLabel = (): string => {
    if (!isLoggedIn) return isEnglish ? "Standard Price" : "Стандартна цена"
    const type = customerType?.toLowerCase()
    if (isEuropeanCustomer()) return isEnglish ? "Price for European customers" : "Цена за европейски клиенти"
    if (type === "wholesaler" || type === "едро") return isEnglish ? "Wholesale Price" : "Цена за търговци на едро"
    if (type === "retailer" || type === "дребно") return isEnglish ? "Retail Price" : "Цена за търговци на дребно"
    return isEnglish ? "Standard Price" : "Стандартна цена"
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (displayPriceNumber === null || isAdded) return

    const priceForCart = displayPriceNumber

    const itemToAdd: CartItem = {
      id,
      title,
      price: priceForCart,
      quantity: 1,
      photourl,
      promo_buy_qty: promo_buy_qty,
      promo_free_qty: promo_free_qty,
      isEuropeanPrice: isEuropeanCustomer(),
    }
    addItem(itemToAdd)

    toast({
      title: isEnglish ? "Product added to cart" : "Продуктът е добавен в количката",
      description: isEnglish ? `${title} has been added successfully.` : `${title} е добавен успешно.`,
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push("/cart")}>
          {isEnglish ? "View Cart" : "Виж количката"}
        </Button>
      ),
    })

    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 2000)
  }

  let finalPromotionDisplayMessage: string | null = null
  if (promo_buy_qty && promo_buy_qty > 0 && promo_free_qty !== undefined && promo_free_qty >= 0) {
    if (promo_description) {
      finalPromotionDisplayMessage = promo_description
    } else if (promo_free_qty > 0) {
      finalPromotionDisplayMessage = isEnglish
        ? `Buy ${promo_buy_qty}, Get ${promo_free_qty} Free!`
        : `Купи ${promo_buy_qty}, Вземи ${promo_free_qty} безплатно!`
    } else {
      finalPromotionDisplayMessage = isEnglish
        ? `Special offer when buying ${promo_buy_qty} pcs.`
        : `Специална оферта при покупка на ${promo_buy_qty} бр.`
    }
  }

  const showQuantityPromoBadgeOnImage = promo_buy_qty && promo_buy_qty > 0 && promo_free_qty && promo_free_qty > 0

  const productUrl = isEnglish ? `/en/product/${id}` : `/product/${id}`

  const handleProductClick = (e: React.MouseEvent) => {
    if (isEnglish) {
      e.preventDefault()
      window.location.href = productUrl
    }
  }

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isEnglish) {
      return (
        <div className="block cursor-pointer h-full" onClick={handleProductClick}>
          {children}
        </div>
      )
    }
    return (
      <Link href={productUrl} className="block h-full">
        {children}
      </Link>
    )
  }

  return (
    <CardWrapper>
      <div
        className="group relative flex flex-col h-full rounded-2xl bg-white overflow-hidden transition-all duration-500 ease-out border border-neutral-200/60 hover:border-neutral-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {photourl ? (
            <Image
              src={photourl || "/placeholder.svg"}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-contain p-4 transition-all duration-700 ease-out ${isHovered ? "scale-110" : "scale-100"}`}
              onError={(e) => {
                e.currentTarget.src = `/placeholder.svg?height=256&width=256&text=${encodeURIComponent(title)}`
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm text-neutral-400 font-medium">
                {isEnglish ? "No image" : "Няма снимка"}
              </span>
            </div>
          )}

          {/* Badges - top left, minimal pill style */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
            {isNew && (
              <span className="inline-flex items-center rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-white">
                {isEnglish ? "New" : "Ново"}
              </span>
            )}
            {showQuantityPromoBadgeOnImage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-white">
                <Gift className="h-3 w-3" />
                {`${promo_buy_qty}+${promo_free_qty}`}
              </span>
            )}
          </div>

          {/* Quick add button - appears on hover */}
          <div
            className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ease-out ${
              isHovered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <button
              onClick={handleAddToCart}
              disabled={displayPriceNumber === null || isAdded}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold backdrop-blur-xl transition-all duration-200 ${
                isAdded
                  ? "bg-emerald-500/90 text-white"
                  : "bg-white/80 text-neutral-900 hover:bg-white shadow-lg shadow-black/5 active:scale-[0.98]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={
                isAdded
                  ? isEnglish ? "Product added successfully" : "Продуктът е добавен успешно"
                  : isEnglish ? "Add to cart" : "Добавяне в количка"
              }
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>{isEnglish ? "Added" : "Добавено"}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>{isEnglish ? "Add to Cart" : "Добави в количка"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-4 gap-2">
          {/* Title */}
          <h3 className="line-clamp-2 text-[13px] sm:text-sm font-semibold leading-snug text-neutral-900 group-hover:text-neutral-700 transition-colors duration-300">
            {title}
          </h3>

          {/* Rating - always show 5 stars (empty if no reviews) */}
          <StarRatingCompact 
            rating={averageRating || 0} 
            reviewCount={reviewCount || undefined} 
            size="sm" 
            showEmpty={true}
          />

          {/* Description - subtle, one line */}
          {description && (
            <p className="line-clamp-1 text-xs text-neutral-500 leading-relaxed">
              {description}
            </p>
          )}

          {/* Promo message */}
          {finalPromotionDisplayMessage && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 mt-0.5">
              <Gift className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <p className="text-[11px] font-medium text-amber-700 leading-tight line-clamp-2">
                {finalPromotionDisplayMessage}
              </p>
            </div>
          )}

          {/* Price section - pushed to bottom */}
          <div className="mt-auto pt-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-1">
              {getPriceLabel()}
            </p>
            {displayPriceNumber !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
                  {formatPriceDisplay(displayEurPriceNumber !== null ? displayEurPriceNumber : convertBgnToEur(displayPriceNumber))}
                  <span className="text-sm font-semibold text-neutral-500 ml-0.5">€</span>
                </span>
                <span className="text-xs text-neutral-400">
                  {formatPriceDisplay(displayPriceNumber)} лв.
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-neutral-400">N/A</span>
            )}
          </div>

          {/* Mobile add to cart - always visible on mobile, clean style */}
          <button
            onClick={handleAddToCart}
            disabled={displayPriceNumber === null || isAdded}
            className={`mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 lg:hidden ${
              isAdded
                ? "bg-emerald-500 text-white"
                : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]"
            } disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed`}
            aria-label={
              isAdded
                ? isEnglish ? "Product added successfully" : "Продуктът е добавен успешно"
                : isEnglish ? "Add to cart" : "Добавяне в количка"
            }
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>{isEnglish ? "Added" : "Добавено"}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>{isEnglish ? "Add to Cart" : "Добави в количка"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </CardWrapper>
  )
}
