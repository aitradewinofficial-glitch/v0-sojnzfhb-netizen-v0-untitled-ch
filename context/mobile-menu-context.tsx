"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type MenuTab = "categories" | "search"

interface MobileMenuContextType {
  isOpen: boolean
  activeTab: MenuTab
  openMenu: (tab?: MenuTab) => void
  closeMenu: () => void
  setActiveTab: (tab: MenuTab) => void
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined)

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MenuTab>("categories")

  const openMenu = useCallback((tab: MenuTab = "categories") => {
    setActiveTab(tab)
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <MobileMenuContext.Provider value={{ isOpen, activeTab, openMenu, closeMenu, setActiveTab }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext)
  if (context === undefined) {
    throw new Error("useMobileMenu must be used within a MobileMenuProvider")
  }
  return context
}
