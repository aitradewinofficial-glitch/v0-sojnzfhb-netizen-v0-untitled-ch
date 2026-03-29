"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Scale, Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { useCompare, type CompareItem } from "@/context/compare-context"

interface CompareFloatingButtonProps {
  product: CompareItem
  isEnglish?: boolean
}

export function CompareFloatingButton({ product, isEnglish = false }: CompareFloatingButtonProps) {
  const { addItem, removeItem, isInCompare, getItemCount } = useCompare()
  const [isVisible, setIsVisible] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const inCompare = isInCompare(product.id)
  const itemCount = getItemCount()

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 300
      setIsVisible(window.scrollY > scrollThreshold)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleToggleCompare = () => {
    if (inCompare) {
      removeItem(product.id)
      toast.success(isEnglish ? "Removed from comparison" : "Премахнато от сравнение")
    } else {
      if (itemCount >= 4) {
        toast.error(
          isEnglish 
            ? "You can compare up to 4 products" 
            : "Можете да сравнявате до 4 продукта"
        )
        return
      }
      addItem(product)
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 1500)
      toast.success(isEnglish ? "Added to comparison" : "Добавено за сравнение")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-[76px] right-4 z-50 md:hidden flex flex-col items-end gap-3">
      {/* Compare badge with count - links to compare page */}
      {itemCount > 0 && (
        <Link
          href="/compare"
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-full shadow-lg shadow-neutral-900/20 transition-all duration-300 active:scale-95"
        >
          <Scale className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isEnglish ? "Compare" : "Сравни"} ({itemCount})
          </span>
        </Link>
      )}

      {/* Add/Remove from compare button */}
      <button
        onClick={handleToggleCompare}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 ${
          inCompare
            ? "bg-amber-500 text-white shadow-amber-500/30"
            : isAdded
            ? "bg-emerald-500 text-white shadow-emerald-500/30"
            : "bg-white text-neutral-700 border border-neutral-200 shadow-neutral-900/10"
        }`}
        aria-label={inCompare ? (isEnglish ? "Remove from comparison" : "Премахни от сравнение") : (isEnglish ? "Add to comparison" : "Добави за сравнение")}
      >
        {isAdded ? (
          <Check className="w-6 h-6" strokeWidth={2.5} />
        ) : inCompare ? (
          <Scale className="w-6 h-6" />
        ) : (
          <div className="relative">
            <Scale className="w-6 h-6" />
            <Plus className="w-3 h-3 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" strokeWidth={3} />
          </div>
        )}
      </button>
    </div>
  )
}
