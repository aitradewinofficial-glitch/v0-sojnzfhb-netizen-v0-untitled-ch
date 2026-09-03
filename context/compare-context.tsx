"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type CompareItem = {
  id: string
  title: string
  price: number
  photourl?: string
  description?: string
  categoryTitle?: string
  subcategoryTitle?: string
}

type CompareContextType = {
  items: CompareItem[]
  addItem: (item: CompareItem) => void
  removeItem: (id: string) => void
  clearAll: () => void
  isInCompare: (id: string) => boolean
  getItemCount: () => number
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

const MAX_COMPARE_ITEMS = 4

export const CompareProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>([])

  useEffect(() => {
    const savedCompare = localStorage.getItem("compare")
    if (savedCompare) {
      try {
        setItems(JSON.parse(savedCompare))
      } catch (error) {
        console.error("Failed to parse compare from localStorage:", error)
        localStorage.removeItem("compare")
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("compare", JSON.stringify(items))
  }, [items])

  const addItem = (item: CompareItem) => {
    setItems((currentItems) => {
      if (currentItems.length >= MAX_COMPARE_ITEMS) {
        return currentItems
      }
      if (currentItems.find((i) => i.id === item.id)) {
        return currentItems
      }
      return [...currentItems, item]
    })
  }

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((i) => i.id !== id))
  }

  const clearAll = () => {
    setItems([])
  }

  const isInCompare = (id: string) => {
    return items.some((item) => item.id === id)
  }

  const getItemCount = () => {
    return items.length
  }

  return (
    <CompareContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearAll,
        isInCompare,
        getItemCount,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export const useCompare = () => {
  const context = useContext(CompareContext)
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider")
  }
  return context
}
