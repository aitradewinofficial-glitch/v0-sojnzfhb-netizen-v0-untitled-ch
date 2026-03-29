"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState, useEffect, useRef } from "react"
import { Search, X, Loader2, ArrowRight, History } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

type SearchResult = {
  objectid: string
  title: string
  price: string
  photourl?: string
  description?: string
}

interface SearchFormProps {
  className?: string
  fullWidth?: boolean
  placeholder?: string
}

export function SearchForm({ className = "", fullWidth = false, placeholder }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const storedSearches = localStorage.getItem("recentSearches")
    if (storedSearches) {
      try {
        setRecentSearches(JSON.parse(storedSearches).slice(0, 5))
      } catch (e) {
        console.error("Error parsing recent searches:", e)
      }
    }
  }, [])

  const saveToRecentSearches = (term: string) => {
    if (!term.trim()) return
    const updatedSearches = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 5)
    setRecentSearches(updatedSearches)
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prevIndex) => {
            const maxIndex = results.length > 0 ? results.length - 1 : recentSearches.length - 1
            return prevIndex < maxIndex ? prevIndex + 1 : prevIndex
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0) {
            if (results.length > 0 && selectedIndex < results.length) {
              router.push(`/product/${results[selectedIndex].objectid}`)
              saveToRecentSearches(query)
              setShowDropdown(false)
            } else if (recentSearches.length > 0 && selectedIndex < recentSearches.length) {
              handleSearch(recentSearches[selectedIndex])
            }
          } else if (query.trim()) {
            handleSearch(query)
          }
          break
        case "Escape":
          setShowDropdown(false)
          setIsFocused(false)
          break
      }
    }

    if (showDropdown) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showDropdown, selectedIndex, results, recentSearches, router, query])

  const fetchSearchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`)
      if (!response.ok) throw new Error("Failed to fetch suggestions")
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error("Error fetching search suggestions:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)

    if (value.trim()) {
      setIsLoading(true)
      setShowDropdown(true)
      debounceTimeout.current = setTimeout(() => fetchSearchSuggestions(value), 300)
    } else {
      setResults([])
      setShowDropdown(isFocused)
      setIsLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    saveToRecentSearches(searchQuery)
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setShowDropdown(false)
    setIsFocused(false)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setShowDropdown(isFocused)
    setIsLoading(false)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    setIsFocused(true)
    setShowDropdown(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div className={cn("relative", fullWidth ? "w-full" : "w-full max-w-md", className)} ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative w-full group">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || "Търсене на продукти..."}
          aria-label="Search products"
          className={cn(
            "w-full h-9 px-4 pl-9 pr-20 rounded-full text-sm",
            "bg-white/[0.08] text-white placeholder:text-neutral-500",
            "border border-white/[0.08]",
            "focus:outline-none focus:bg-white/[0.12] focus:border-white/20",
            "hover:bg-white/[0.10]",
            "transition-all duration-200",
            isFocused && "bg-white/[0.12] border-white/20",
          )}
          autoComplete="off"
        />

        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
            isFocused ? "text-neutral-300" : "text-neutral-500",
          )}
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-0.5 text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="submit"
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center",
            "rounded-full bg-white/[0.12] hover:bg-white/[0.18] transition-colors",
          )}
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5 text-neutral-300" />
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className={cn(
            "absolute z-50 w-full mt-2",
            "bg-neutral-800/95 backdrop-blur-xl",
            "border border-white/10 rounded-2xl shadow-2xl",
            "max-h-[70vh] overflow-y-auto overflow-x-hidden",
            "animate-in fade-in-0 zoom-in-[0.98] duration-150",
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-5">
              <Loader2 className="h-4 w-4 text-neutral-400 animate-spin" />
              <span className="ml-2 text-sm text-neutral-400">{"Търсене..."}</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-4 pt-3 pb-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  {"Резултати"}
                </p>
              </div>
              <ul>
                {results.map((result, index) => (
                  <li key={result.objectid}>
                    <Link
                      href={`/product/${result.objectid}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        index === selectedIndex ? "bg-white/[0.08]" : "hover:bg-white/[0.05]",
                      )}
                      onClick={() => {
                        saveToRecentSearches(query)
                        setShowDropdown(false)
                      }}
                    >
                      {result.photourl && (
                        <div className="flex-shrink-0 w-10 h-10 bg-white/[0.06] rounded-lg overflow-hidden">
                          <Image
                            src={result.photourl || "/placeholder.svg"}
                            alt={result.title}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{result.title}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {result.description?.substring(0, 60) || ""}
                        </p>
                      </div>
                      <div className="ml-2 text-sm font-semibold text-amber-400 tabular-nums">
                        {result.price} лв.
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-white/[0.06]">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="flex items-center justify-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  onClick={() => {
                    saveToRecentSearches(query)
                    setShowDropdown(false)
                  }}
                >
                  <span>{"Вижте всички резултати"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {recentSearches.length > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-3.5 w-3.5 text-neutral-500" />
                    <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      {"Последни търсения"}
                    </p>
                  </div>
                  <ul className="space-y-0.5">
                    {recentSearches.map((term, index) => (
                      <li key={`recent-${index}`}>
                        <button
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-300 transition-colors",
                            index === selectedIndex ? "bg-white/[0.08]" : "hover:bg-white/[0.05]",
                          )}
                          onClick={() => handleSuggestionClick(term)}
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {query.trim() && (
                <div className="px-4 py-5 text-center border-t border-white/[0.06]">
                  <p className="text-sm text-neutral-300">
                    {'Няма намерени резултати за "'}{query}{'"'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {"Опитайте с друга дума или фраза"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
