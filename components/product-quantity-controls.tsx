"use client"

import { useState } from "react"
import { ShoppingCart, Minus, Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductQuantityControlsProps {
  productId: string
  productTitle: string
  productPrice: number
  photoUrl?: string
  promo_buy_qty?: number | null
  promo_free_qty?: number | null
  disabled?: boolean
  isEnglish?: boolean
}

export function ProductQuantityControls({
  productId,
  productTitle,
  productPrice,
  photoUrl,
  promo_buy_qty,
  promo_free_qty,
  disabled = false,
  isEnglish = false,
}: ProductQuantityControlsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const router = useRouter()
  const { addItem } = useCart()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0) {
      setQuantity(newQuantity)
    }
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

  return (
    <div className="space-y-5">
      {/* Quantity Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
          {isEnglish ? "Quantity" : "Количество"}
        </span>
        <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1 || disabled}
            className="flex h-11 w-11 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={isEnglish ? "Decrease quantity" : "Намали количеството"}
          >
            <Minus className="h-4 w-4" />
          </button>
          <Input
            type="number"
            min="1"
            value={quantity === 0 ? "" : quantity}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") {
                setQuantity(0)
              } else {
                const parsedValue = Number.parseInt(value)
                if (!isNaN(parsedValue)) {
                  setQuantity(parsedValue)
                }
              }
            }}
            disabled={disabled}
            className="w-14 text-center border-0 border-x border-neutral-200 bg-transparent text-base font-semibold text-neutral-900 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={disabled}
            className="flex h-11 w-11 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={isEnglish ? "Increase quantity" : "Увеличи количеството"}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={disabled || isAdded}
        className={`w-full rounded-xl py-6 text-base font-semibold tracking-wide transition-all duration-300 ${
          isAdded
            ? "bg-emerald-500 hover:bg-emerald-500 text-white"
            : "bg-neutral-900 hover:bg-neutral-800 text-white active:scale-[0.98]"
        } disabled:bg-neutral-200 disabled:text-neutral-400`}
        size="lg"
      >
        {isAdded ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            {isEnglish ? "Added to Cart" : "Добавено в количката"}
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isEnglish ? "Add to Cart" : "Добави в количката"}
          </>
        )}
      </Button>

      {disabled && (
        <p className="text-sm text-neutral-400 text-center">
          {isEnglish ? "Price not available for your customer type" : "Цената не е налична за вашия тип клиент"}
        </p>
      )}
    </div>
  )
}
