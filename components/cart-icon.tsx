"use client"

import { useState, useRef, useEffect } from "react"
import { ShoppingBag, X, Plus, Minus, ArrowRight } from "lucide-react"
import { useCart } from "@/context/cart-context"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

export function CartIcon() {
  const { items, getItemCount, getTotalPrice, updateQuantity, removeItem } = useCart()
  const itemCount = getItemCount()
  const totalPrice = getTotalPrice()
  const pathname = usePathname()
  
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isEnglish = pathname.startsWith("/en")
  const cartUrl = isEnglish ? "/en/cart" : "/cart"
  const ariaLabel = isEnglish ? "Shopping list" : "Списък за запитване"

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Format price with currency
  const formatPrice = (price: number) => {
    return isEnglish ? `${price.toFixed(2)} BGN` : `${price.toFixed(2)} лв.`
  }

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={cartUrl}>
        <button
          className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label={ariaLabel}
        >
          <ShoppingBag className="h-[18px] w-[18px]" />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-neutral-900 text-[10px] font-bold leading-none">
              {itemCount}
            </span>
          )}
        </button>
      </Link>

      {/* Cart Hover Preview - Desktop Only */}
      {isHovered && itemCount > 0 && (
        <div 
          className="hidden md:block absolute top-full right-0 pt-3 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 overflow-hidden w-[340px] animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200/60">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {isEnglish ? "Your Cart" : "Вашата количка"}
                </h3>
                <span className="text-xs font-medium text-neutral-500 bg-neutral-200/60 px-2 py-0.5 rounded-full">
                  {itemCount} {isEnglish ? (itemCount === 1 ? "item" : "items") : (itemCount === 1 ? "артикул" : "артикула")}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-[280px] overflow-y-auto">
              {items.slice(0, 4).map((item) => {
                const paidQuantity = item.quantity - (item.freeItems || 0)
                const itemTotal = item.price * Math.max(0, paidQuantity)
                
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50 transition-colors">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-14 h-14 bg-neutral-100 rounded-xl overflow-hidden">
                      {item.photourl ? (
                        <Image
                          src={item.photourl}
                          alt={item.title}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={isEnglish ? `/en/product/${item.id}` : `/product/${item.id}`}
                        className="text-sm font-medium text-neutral-900 hover:text-amber-600 line-clamp-1 transition-colors"
                      >
                        {item.title}
                      </Link>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              updateQuantity(item.id, item.quantity - 1)
                            }}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3 text-neutral-600" />
                          </button>
                          <span className="text-xs font-semibold text-neutral-900 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              updateQuantity(item.id, item.quantity + 1)
                            }}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3 text-neutral-600" />
                          </button>
                        </div>
                        
                        {/* Free items badge */}
                        {item.freeItems && item.freeItems > 0 && (
                          <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                            +{item.freeItems} {isEnglish ? "FREE" : "БЕЗПЛАТНО"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-neutral-900">
                        {formatPrice(itemTotal)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeItem(item.id)
                        }}
                        className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        aria-label={isEnglish ? "Remove item" : "Премахни"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {/* Show more indicator if more than 4 items */}
              {items.length > 4 && (
                <div className="px-3 py-2 bg-neutral-50 text-center">
                  <span className="text-xs text-neutral-500">
                    +{items.length - 4} {isEnglish ? "more items" : "още артикула"}
                  </span>
                </div>
              )}
            </div>

            {/* Footer with Total and CTA */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-600">
                  {isEnglish ? "Total:" : "Общо:"}
                </span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <Link
                href={cartUrl}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-900 text-sm font-semibold rounded-xl transition-colors"
              >
                {isEnglish ? "View Cart" : "Виж количката"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Empty cart hover state */}
      {isHovered && itemCount === 0 && (
        <div 
          className="hidden md:block absolute top-full right-0 pt-3 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 overflow-hidden w-[280px] animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-900 mb-1">
                {isEnglish ? "Your cart is empty" : "Количката е празна"}
              </p>
              <p className="text-xs text-neutral-500">
                {isEnglish ? "Add products to get started" : "Добавете продукти, за да започнете"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
