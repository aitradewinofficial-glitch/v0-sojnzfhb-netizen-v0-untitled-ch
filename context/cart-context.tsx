"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { isEuropeanCustomer } from "@/lib/client-auth"

// Актуализиран CartItem тип, за да включва промоционални правила
export type CartItem = {
  id: string
  title: string
  price: number
  quantity: number
  photourl?: string
  freeItems?: number
  isEuropeanPrice?: boolean
  eurPrice?: number | null
  promo_buy_qty?: number | null // Количество за покупка за промоция
  promo_free_qty?: number | null // Безплатно количество при промоция
}

// НОВА функция за изчисляване на промоции за цялата количка
const calculatePromotions = (items: CartItem[]): CartItem[] => {
  // 0. Създаваме копие на артикулите и нулираме безплатните бройки, за да започнем на чисто.
  const processedItems = items.map((item) => ({ ...item, freeItems: 0 }))

  // 1. Групираме артикулите по ключ на промоцията (напр. "100-10" за "купи 100, вземи 10")
  const promoGroups = new Map<string, CartItem[]>()
  processedItems.forEach((item) => {
    if (item.promo_buy_qty && item.promo_free_qty && item.promo_buy_qty > 0) {
      const key = `${item.promo_buy_qty}-${item.promo_free_qty}`
      if (!promoGroups.has(key)) {
        promoGroups.set(key, [])
      }
      promoGroups.get(key)!.push(item)
    }
  })

  // Ако няма групи с промоции, връщаме артикулите с нулирани безплатни бройки.
  if (promoGroups.size === 0) {
    return processedItems
  }

  // 2. Итерираме през всяка група с промоция
  for (const groupItems of promoGroups.values()) {
    // Всички артикули в групата имат еднакви правила за промоция
    const { promo_buy_qty, promo_free_qty } = groupItems[0]
    if (!promo_buy_qty || !promo_free_qty) continue

    // Изчисляваме общото количество артикули в тази промоционална група
    const totalQuantityInGroup = groupItems.reduce((sum, item) => sum + item.quantity, 0)

    // Проверяваме дали е достигнато минималното количество за активиране на промоцията
    if (totalQuantityInGroup < promo_buy_qty) {
      continue // Продължаваме към следващата група
    }

    // Изчисляваме общия брой безплатни артикули за тази група
    const totalFreeForGroup = Math.floor(totalQuantityInGroup / promo_buy_qty) * promo_free_qty

    // 3. Разпределяме безплатните артикули, като започваме от най-евтините в групата
    const allIndividualItemsInGroup = groupItems
      .flatMap((item) => Array(item.quantity).fill({ productId: item.id, price: item.price }))
      .sort((a, b) => a.price - b.price)

    // Вземаме най-евтините артикули, които ще бъдат безплатни
    const freeItemIdentifiers = allIndividualItemsInGroup.slice(0, totalFreeForGroup)

    // Преброяваме колко безплатни бройки се падат на всеки продукт (по ID)
    const freeItemsCountPerProduct = new Map<string, number>()
    freeItemIdentifiers.forEach((freeItem) => {
      freeItemsCountPerProduct.set(freeItem.productId, (freeItemsCountPerProduct.get(freeItem.productId) || 0) + 1)
    })

    // 4. Обновяваме основния масив `processedItems` с изчислените безплатни бройки
    processedItems.forEach((item, index) => {
      if (freeItemsCountPerProduct.has(item.id)) {
        processedItems[index].freeItems = freeItemsCountPerProduct.get(item.id)
      }
    })
  }

  return processedItems
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getTotalPrice: () => number
  isEuropeanCustomer: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const CART_STORAGE_KEY = "cart"
const CART_EXPIRY_MS = 60 * 60 * 1000

type StoredCart = {
  items: CartItem[]
  savedAt: number
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isEuropean, setIsEuropean] = useState(false)
  const hasLoadedCart = useRef(false)

  useEffect(() => {
    const checkCustomerType = () => {
      const european = isEuropeanCustomer()
      setIsEuropean(european)
      console.log("Cart context - Is European customer:", european)
    }
    checkCustomerType()
  }, [])

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as StoredCart | CartItem[]
        const storedItems = Array.isArray(parsedCart) ? parsedCart : parsedCart.items
        const savedAt = Array.isArray(parsedCart) ? 0 : parsedCart.savedAt
        const isExpired = !savedAt || Date.now() - savedAt >= CART_EXPIRY_MS

        if (isExpired) {
          localStorage.removeItem(CART_STORAGE_KEY)
        } else {
          setItems(calculatePromotions(storedItems))
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    }
    hasLoadedCart.current = true
  }, [])

  useEffect(() => {
    if (!hasLoadedCart.current) return

    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    const storedCart: StoredCart = { items, savedAt: Date.now() }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart))
  }, [items])

  const addItem = (item: CartItem) => {
    console.log("[CartContext] addItem called with item:", JSON.parse(JSON.stringify(item)))
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex((i) => i.id === item.id)
      let updatedItems

      if (existingItemIndex >= 0) {
        updatedItems = [...currentItems]
        const existingItem = updatedItems[existingItemIndex]
        existingItem.quantity += item.quantity
        // Уверяваме се, че промоционалните правила и цената са актуални
        existingItem.promo_buy_qty = item.promo_buy_qty
        existingItem.promo_free_qty = item.promo_free_qty
        existingItem.price = item.price
        existingItem.eurPrice = item.eurPrice
        existingItem.isEuropeanPrice = isEuropean
      } else {
        // Създаваме нов артикул, без да задаваме freeItems; те ще бъдат изчислени
        const newItem: CartItem = {
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          photourl: item.photourl,
          eurPrice: item.eurPrice,
          isEuropeanPrice: isEuropean,
          promo_buy_qty: item.promo_buy_qty,
          promo_free_qty: item.promo_free_qty,
        }
        updatedItems = [...currentItems, newItem]
      }
      // Преизчисляваме промоциите за цялата количка след всяка промяна
      return calculatePromotions(updatedItems)
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((currentItems) => {
      const updatedItems = currentItems.map((item) => (item.id === id ? { ...item, quantity } : item))
      // Преизчисляваме промоциите за цялата количка
      return calculatePromotions(updatedItems)
    })
  }

  const removeItem = (id: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter((i) => i.id !== id)
      // Преизчисляваме промоциите за цялата количка
      return calculatePromotions(updatedItems)
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      // Логиката тук остава същата, тъй като `freeItems` вече е правилно изчислено
      const paidQuantity = item.quantity - (item.freeItems || 0)
      const actualPaidQuantity = Math.max(0, paidQuantity)
      return total + item.price * actualPaidQuantity
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotalPrice,
        isEuropeanCustomer: isEuropean,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
