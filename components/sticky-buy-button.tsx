"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Plus, Minus, Check } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/cart-context"

interface StickyBuyButtonProps {
  productId: string
  productTitle: string
  productPrice: number
  photoUrl?: string
  promo_buy_qty?: number | null
  promo_free_qty?: number | null
  disabled?: boolean
  isEnglish?: boolean
}

export function StickyBuyButton({
  productId,
  productTitle,
  productPrice,
  photoUrl,
  promo_buy_qty,
  promo_free_qty,
  disabled = false,
  isEnglish = false,
}: StickyBuyButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky button after scrolling past the main add to cart section
      const scrollThreshold = 400
      setIsVisible(window.scrollY > scrollThreshold)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  const handleAddToCart = () => {
    const finalQuantity = quantity < 1 ? 1 : quantity

    try {
      if (!productId || !productTitle || productPrice <= 0) {
        toast.error(isEnglish ? "Invalid product information" : "Невалидна информация за продукта")
        return
      }

      addItem({
        id: productId,
        title: productTitle,
        price: productPrice,
        quantity: finalQuantity,
        photourl: photoUrl || "",
        promo_buy_qty: promo_buy_qty || null,
        promo_free_qty: promo_free_qty || null,
      })

      toast.success(
        isEnglish ? `${productTitle} added to cart successfully!` : `${productTitle} е добавен в количката успешно!`,
      )

      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 2000)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error(isEnglish ? "Error adding product to cart" : "Грешка при добавяне на продукта в количката")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur container - Apple style */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-neutral-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="safe-area-bottom">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Quantity selector - compact Apple style */}
            <div className="flex items-center rounded-full bg-neutral-100 overflow-hidden">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || disabled}
                className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors active:bg-neutral-200 disabled:opacity-30"
                aria-label={isEnglish ? "Decrease quantity" : "Намали количеството"}
              >
                <Minus className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <span className="w-8 text-center text-base font-semibold text-neutral-900 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={disabled}
                className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors active:bg-neutral-200 disabled:opacity-30"
                aria-label={isEnglish ? "Increase quantity" : "Увеличи количеството"}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Buy button - Apple style */}
            <button
              onClick={handleAddToCart}
              disabled={disabled || isAdded}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-[15px] font-semibold transition-all duration-300 ${
                isAdded
                  ? "bg-emerald-500 text-white"
                  : disabled
                  ? "bg-neutral-200 text-neutral-400"
                  : "bg-neutral-900 text-white active:scale-[0.98] active:bg-neutral-800"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                  <span>{isEnglish ? "Added" : "Добавено"}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                  <span>{isEnglish ? "Buy" : "Купи"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
