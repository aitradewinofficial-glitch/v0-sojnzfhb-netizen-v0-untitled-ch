"use client"

import Link from "next/link"
import Image from "next/image"
import { User, LogOut, Phone, Globe, ChevronDown } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { MobileMenu } from "@/components/mobile-menu"
import { CartIcon } from "@/components/cart-icon"
import { SearchForm } from "@/components/search-form"

interface Category {
  id: string
  title: string
  deleted?: boolean
}

interface Subcategory {
  id: string
  cateid: string
  title: string
}

interface SiteHeaderProps {
  categories: Category[]
  subcategories?: Subcategory[]
  currentCategoryId?: string
  currentSubcategoryId?: string
  isLoggedIn?: boolean
  userName?: string
  isEnglishProp?: boolean
}

export function SiteHeader({
  categories,
  subcategories = [],
  currentCategoryId,
  currentSubcategoryId,
  isLoggedIn = false,
  userName = "",
  isEnglishProp = false,
}: SiteHeaderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn)
  const [name, setName] = useState(userName)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const languageRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (response.ok) {
          const data = await response.json()
          setIsAuthenticated(data.isAuthenticated)
          setName(data.user?.name || "")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }
    checkAuth()
  }, [])

  // Detect scroll for visual changes
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        setIsAuthenticated(false)
        setName("")
        const currentLocale = pathname.startsWith("/en") ? "/en" : "/"
        router.push(currentLocale)
        router.refresh()
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const currentLocale = pathname.startsWith("/en") ? "en" : "bg"
  let pathWithoutLocale = pathname.startsWith("/en") ? pathname.substring(3) : pathname
  if (pathWithoutLocale === "") pathWithoutLocale = "/"
  const switchToEnglishPath = `/en${pathWithoutLocale}`
  const switchToBulgarianPath = pathWithoutLocale

  const handleLanguageChange = (locale: string) => {
    const newPath = locale === "en" ? switchToEnglishPath : switchToBulgarianPath
    window.location.href = newPath
    setShowLanguageDropdown(false)
  }

  const isEnglish = isEnglishProp || pathname.startsWith("/en")

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 w-full z-[9999]
          transition-all duration-300 ease-out
          ${
            scrolled
              ? "bg-neutral-900/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"
              : "bg-neutral-900 backdrop-blur-xl"
          }
        `}
      >
        <div className="container mx-auto px-4 sm:px-6">
          {/* Main row */}
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link
              href={currentLocale === "en" ? "/en" : "/"}
              className="flex items-center flex-shrink-0 group"
            >
              <div className="relative h-9 w-24 sm:h-11 sm:w-36 transition-opacity group-hover:opacity-80">
                <Image
                  src="/images/design-mode/new-madiks.png"
                  alt="Madix Groundbaits"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Search -- Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <SearchForm
                fullWidth={true}
                placeholder={currentLocale === "en" ? "Search products..." : "Търсене на продукти..."}
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* EFTA badge -- Desktop */}
              <div className="hidden lg:flex items-center mr-2">
                <div className="relative h-9 w-9 opacity-70 hover:opacity-100 transition-opacity">
                  <Image
                    src="/images/design-mode/Eftta-Member-removebg-preview.png"
                    alt="EFTA Member"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Contact -- Desktop */}
              <Link
                href={currentLocale === "en" ? "/en/contact" : "/contact"}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{currentLocale === "en" ? "Contact" : "Контакт"}</span>
              </Link>

              {/* Language -- Desktop */}
              <Link
                href={currentLocale === "en" ? "/" : "/en"}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{currentLocale === "en" ? "БГ" : "EN"}</span>
              </Link>

              {/* Divider -- Desktop */}
              <div className="hidden lg:block w-px h-5 bg-white/10 mx-1" />

              {/* Language -- Mobile */}
              <div className="relative lg:hidden" ref={languageRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-1 px-2 py-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">{currentLocale === "en" ? "EN" : "БГ"}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${showLanguageDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showLanguageDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-neutral-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                    <button
                      onClick={() => handleLanguageChange("bg")}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        currentLocale !== "en"
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-neutral-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      Български
                    </button>
                    <button
                      onClick={() => handleLanguageChange("en")}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        currentLocale === "en"
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-neutral-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              {/* User */}
              {isAuthenticated ? (
                <>
                  <Link href={currentLocale === "en" ? "/en/account/dashboard" : "/account/dashboard"}>
                    <button className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors">
                      <User className="h-[18px] w-[18px]" />
                    </button>
                  </Link>

                  <CartIcon />

                  {/* Logout icon -- Mobile */}
                  <button
                    onClick={handleLogout}
                    className="flex lg:hidden items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>

                  {/* Logout button -- Desktop */}
                  <button
                    onClick={handleLogout}
                    className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-neutral-900 bg-white hover:bg-neutral-200 rounded-full transition-colors"
                  >
                    {currentLocale === "en" ? "Logout" : "Изход"}
                  </button>
                </>
              ) : (
                <>
                  <Link href={currentLocale === "en" ? "/en/account" : "/account"}>
                    <button className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors">
                      <User className="h-[18px] w-[18px]" />
                    </button>
                  </Link>

                  <CartIcon />
                </>
              )}

              {/* Mobile hamburger */}
              <MobileMenu
                categories={categories}
                subcategories={subcategories}
                currentCategoryId={currentCategoryId}
                currentSubcategoryId={currentSubcategoryId}
                isEnglish={isEnglish}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Spacer - matches header height (56px on mobile, 64px on desktop) */}
      <div className="h-14 sm:h-16" />
    </>
  )
}
