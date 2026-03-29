"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Grid3X3, ShoppingBag, User } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useMobileMenu } from "@/context/mobile-menu-context"

interface StickyBottomNavProps {
  isEnglish?: boolean
}

export function StickyBottomNav({ isEnglish = false }: StickyBottomNavProps) {
  const pathname = usePathname()
  const { items } = useCart()
  const { isOpen, activeTab, openMenu } = useMobileMenu()
  
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0)

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === "/" || pathname === "/en") return "home"
    if (pathname.includes("/category") || pathname.includes("/subcategory")) return "categories"
    if (pathname.includes("/cart")) return "cart"
    if (pathname.includes("/account") || pathname.includes("/auth")) return "account"
    return "home"
  }

  const currentActiveTab = getActiveTab()

  // Check if search or categories tab in menu is active
  const isSearchActive = isOpen && activeTab === "search"
  const isCategoriesActive = isOpen && activeTab === "categories"

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault()
    openMenu("search")
  }

  const handleCategoriesClick = (e: React.MouseEvent) => {
    e.preventDefault()
    openMenu("categories")
  }

  const navItems = [
    {
      id: "home",
      href: isEnglish ? "/en" : "/",
      icon: Home,
      label: isEnglish ? "Home" : "Начало",
      isActive: currentActiveTab === "home" && !isOpen,
    },
    {
      id: "search",
      href: "#",
      icon: Search,
      label: isEnglish ? "Search" : "Търсене",
      onClick: handleSearchClick,
      isActive: isSearchActive,
    },
    {
      id: "categories",
      href: "#",
      icon: Grid3X3,
      label: isEnglish ? "Categories" : "Категории",
      onClick: handleCategoriesClick,
      isActive: isCategoriesActive,
    },
    {
      id: "cart",
      href: isEnglish ? "/en/cart" : "/cart",
      icon: ShoppingBag,
      label: isEnglish ? "Cart" : "Количка",
      badge: cartItemsCount > 0 ? cartItemsCount : undefined,
      isActive: currentActiveTab === "cart" && !isOpen,
    },
    {
      id: "account",
      href: isEnglish ? "/en/account" : "/account",
      icon: User,
      label: isEnglish ? "Account" : "Профил",
      isActive: currentActiveTab === "account" && !isOpen,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden">
      {/* Apple-style backdrop blur */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-neutral-200/60 shadow-[0_-1px_3px_rgba(0,0,0,0.08)]">
        <div className="safe-area-bottom">
          <div className="flex items-center justify-around px-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon

              if (item.onClick) {
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`relative flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-xl transition-all duration-200 ${
                      item.isActive
                        ? "text-amber-600"
                        : "text-neutral-400 active:text-neutral-600 active:scale-95"
                    }`}
                  >
                    <div className="relative">
                      <Icon
                        className={`h-6 w-6 transition-all duration-200 ${
                          item.isActive ? "scale-110" : ""
                        }`}
                        strokeWidth={item.isActive ? 2.5 : 1.8}
                      />
                    </div>
                    <span
                      className={`mt-0.5 text-[10px] font-semibold tracking-tight ${
                        item.isActive ? "text-amber-600" : "text-neutral-500"
                      }`}
                    >
                      {item.label}
                    </span>
                    {/* Active indicator */}
                    {item.isActive && (
                      <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-amber-600" />
                    )}
                  </button>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-xl transition-all duration-200 ${
                    item.isActive
                      ? "text-amber-600"
                      : "text-neutral-400 active:text-neutral-600 active:scale-95"
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`h-6 w-6 transition-all duration-200 ${
                        item.isActive ? "scale-110" : ""
                      }`}
                      strokeWidth={item.isActive ? 2.5 : 1.8}
                    />
                    {/* Cart badge */}
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full shadow-sm">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-0.5 text-[10px] font-semibold tracking-tight ${
                      item.isActive ? "text-amber-600" : "text-neutral-500"
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Active indicator */}
                  {item.isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-amber-600" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
