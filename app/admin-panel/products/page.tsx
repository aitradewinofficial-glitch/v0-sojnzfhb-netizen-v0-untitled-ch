"use client"

import type React from "react" // Keep type import
import { useState, useEffect, useCallback } from "react" // Added useCallback
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { EditProductModal } from "@/components/edit-product-modal"

interface Product {
  objectid: string
  title: string
  price: number | null
  photourl: string
  cateid: string
  category_title?: string
  subcateid?: string
  subcategory_title?: string
  createdat?: string
  europe_price?: number | string | null
  description?: string
  retailerprice?: number | string | null
  wholesalerprice?: number | string | null
  sku?: string
  barcode?: string
  stock?: number | null
  weight?: number | string | null
  dimensions?: string
  active?: boolean | null
}

interface Category {
  id: string
  title: string
}

interface EditProductForm {
  objectid: string
  title: string
  description: string
  price: number | string | null
  wholesalerprice?: number | string | null
  retailerprice?: number | string | null
  europe_price?: number | string | null
  price_eur?: number | string | null
  retailerprice_eur?: number | string | null
  wholesalerprice_eur?: number | string | null
  europe_price_eur?: number | string | null
  cateid: string
  subcateid?: string
  photourl: string
  sku?: string
  barcode?: string
  stock?: number | null
  weight?: number | string | null
  dimensions?: string
  active?: boolean
  // SEO fields
  seo_meta_title?: string
  seo_meta_description?: string
  seo_meta_keywords?: string
  seo_og_title?: string
  seo_og_description?: string
  seo_og_image?: string
  seo_twitter_title?: string
  seo_twitter_description?: string
  seo_twitter_image?: string
  seo_canonical_url?: string
  seo_robots?: string
  seo_schema_brand?: string
  seo_schema_sku?: string
  seo_schema_availability?: string
  seo_focus_keyword?: string
  seo_secondary_keywords?: string
  seo_alt_text?: string
  seo_meta_title_bg?: string
  seo_meta_description_bg?: string
  seo_meta_keywords_bg?: string
  seo_og_title_bg?: string
  seo_og_description_bg?: string
  [key: string]: any
}

const DEBOUNCE_DELAY = 500 // 500ms debounce delay

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("") // For debounced API calls
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<EditProductForm | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, DEBOUNCE_DELAY)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  const fetchProducts = useCallback(
    async (currentSearchTerm: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/admin/products?page=${page}&limit=10&search=${currentSearchTerm}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        if (data.products) {
          const typedProducts = data.products.map((p: any) => ({
            ...p,
            price: p.price !== null && p.price !== undefined && p.price !== "" ? Number(p.price) : null,
            retailerprice:
              p.retailerprice !== null && p.retailerprice !== undefined && p.retailerprice !== ""
                ? Number(p.retailerprice)
                : null,
            wholesalerprice:
              p.wholesalerprice !== null && p.wholesalerprice !== undefined && p.wholesalerprice !== ""
                ? Number(p.wholesalerprice)
                : null,
            europe_price:
              p.europe_price !== null && p.europe_price !== undefined && p.europe_price !== ""
                ? Number(p.europe_price)
                : null,
          }))
          setProducts(typedProducts)
          setTotalPages(data.pagination?.pages || 1)
        } else {
          setProducts([])
          setTotalPages(1)
        }
      } catch (err: any) {
        console.error("Error fetching products:", err)
        setError(err.message || "Грешка при зареждане на продуктите. Моля, опитайте отново.")
        toast.error(err.message || "Грешка при зареждане на продуктите.")
      } finally {
        setLoading(false)
      }
    },
    [page],
  ) // page is a dependency for fetchProducts

  const fetchPageCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories")
      if (!response.ok) {
        setCategories([])
        toast.error(`Грешка при мрежова заявка за категории: Статус ${response.status}`)
        return
      }
      const data = await response.json()
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories)
        if (data.categories.length === 0) {
          toast.info("Няма налични категории за зареждане.")
        }
      } else {
        setCategories([])
        toast.error(data.error || "API отговорът за категории не беше успешен или не съдържа данни.")
      }
    } catch (error: any) {
      setCategories([])
      toast.error(error.message || "Неуспешно извличане на категории.")
      console.error("Error fetching page categories:", error)
    }
  }

  // Fetch products when page or debouncedSearchTerm changes
  useEffect(() => {
    fetchProducts(debouncedSearchTerm)
  }, [page, debouncedSearchTerm, fetchProducts])

  // Fetch categories once on mount
  useEffect(() => {
    fetchPageCategories()
  }, [])

  const handleDelete = async (id: string) => {
    if (window.confirm("Сигурни ли сте, че искате да изтриете този продукт?")) {
      setDeletingProductId(id)
      try {
        const response = await fetch(`/api/admin/products/delete/${id}`, {
          method: "DELETE",
        })
        const data = await response.json()
        if (data.success) {
          toast.success("Продуктът беше изтрит успешно")
          fetchProducts(debouncedSearchTerm) // Refetch with current debounced search term
        } else {
          toast.error(data.error || "Грешка при изтриване на продукта.")
        }
      } catch (err) {
        console.error("Error deleting product:", err)
        toast.error("Грешка при изтриване на продукта. Моля, опитайте отново.")
      } finally {
        setDeletingProductId(null)
      }
    }
  }

  const handleOpenEditModal = async (productToList: Product) => {
    try {
      const response = await fetch(`/api/admin/products?id=${productToList.objectid}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.products && data.products.length > 0) {
        const fullProduct: any = data.products[0]
        // Pass the full product object including all SEO fields
        setEditingProduct({
          objectid: fullProduct.objectid,
          title: fullProduct.title || "",
          description: fullProduct.description || "",
          price: fullProduct.price !== null && fullProduct.price !== undefined ? String(fullProduct.price) : null,
          wholesalerprice:
            fullProduct.wholesalerprice !== null && fullProduct.wholesalerprice !== undefined
              ? String(fullProduct.wholesalerprice)
              : null,
          retailerprice:
            fullProduct.retailerprice !== null && fullProduct.retailerprice !== undefined
              ? String(fullProduct.retailerprice)
              : null,
          europe_price:
            fullProduct.europe_price !== null && fullProduct.europe_price !== undefined
              ? String(fullProduct.europe_price)
              : null,
          price_eur:
            fullProduct.price_eur !== null && fullProduct.price_eur !== undefined
              ? String(fullProduct.price_eur)
              : null,
          retailerprice_eur:
            fullProduct.retailerprice_eur !== null && fullProduct.retailerprice_eur !== undefined
              ? String(fullProduct.retailerprice_eur)
              : null,
          wholesalerprice_eur:
            fullProduct.wholesalerprice_eur !== null && fullProduct.wholesalerprice_eur !== undefined
              ? String(fullProduct.wholesalerprice_eur)
              : null,
          europe_price_eur:
            fullProduct.europe_price_eur !== null && fullProduct.europe_price_eur !== undefined
              ? String(fullProduct.europe_price_eur)
              : null,
          cateid: String(fullProduct.cateid || ""),
          subcateid: String(fullProduct.subcateid || ""),
          photourl: fullProduct.photourl || "",
          sku: fullProduct.sku || "",
          barcode: fullProduct.barcode || "",
          stock: fullProduct.stock !== null && fullProduct.stock !== undefined ? Number(fullProduct.stock) : null,
          weight: fullProduct.weight !== null && fullProduct.weight !== undefined ? String(fullProduct.weight) : null,
          dimensions: fullProduct.dimensions || "",
          active: typeof fullProduct.active === "boolean" ? fullProduct.active : true,
          // SEO fields - pass all from database
          seo_meta_title: fullProduct.seo_meta_title || "",
          seo_meta_description: fullProduct.seo_meta_description || "",
          seo_meta_keywords: fullProduct.seo_meta_keywords || "",
          seo_og_title: fullProduct.seo_og_title || "",
          seo_og_description: fullProduct.seo_og_description || "",
          seo_og_image: fullProduct.seo_og_image || "",
          seo_twitter_title: fullProduct.seo_twitter_title || "",
          seo_twitter_description: fullProduct.seo_twitter_description || "",
          seo_twitter_image: fullProduct.seo_twitter_image || "",
          seo_canonical_url: fullProduct.seo_canonical_url || "",
          seo_robots: fullProduct.seo_robots || "",
          seo_schema_brand: fullProduct.seo_schema_brand || "",
          seo_schema_sku: fullProduct.seo_schema_sku || "",
          seo_schema_availability: fullProduct.seo_schema_availability || "",
          seo_focus_keyword: fullProduct.seo_focus_keyword || "",
          seo_secondary_keywords: fullProduct.seo_secondary_keywords || "",
          seo_alt_text: fullProduct.seo_alt_text || "",
          seo_meta_title_bg: fullProduct.seo_meta_title_bg || "",
          seo_meta_description_bg: fullProduct.seo_meta_description_bg || "",
          seo_meta_keywords_bg: fullProduct.seo_meta_keywords_bg || "",
          seo_og_title_bg: fullProduct.seo_og_title_bg || "",
          seo_og_description_bg: fullProduct.seo_og_description_bg || "",
        })
        setEditModalOpen(true)
      } else {
        toast.error(data.error || "Не може да се заредят пълните детайли за продукта.")
      }
    } catch (err: any) {
      console.error("Error fetching product details for edit:", err)
      toast.error(err.message || "Грешка при зареждане на детайлите за продукта.")
    }
  }

  // Handle explicit search (form submission)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDebouncedSearchTerm(searchTerm) // Trigger search immediately with current input value
    if (page !== 1) {
      setPage(1) // Reset to page 1 for new search, fetchProducts will be called by useEffect
    } else {
      // If already on page 1, and debouncedSearchTerm might not change if searchTerm was already debounced
      // force a fetch if the searchTerm is different from the current debounced one
      // or if it's the same, it means user clicked search on the same term again.
      fetchProducts(searchTerm) // Explicitly fetch with the current non-debounced term
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm("")
    setDebouncedSearchTerm("") // Clear debounced term immediately
    if (page !== 1) {
      setPage(1)
    } else {
      // If already on page 1, and debouncedSearchTerm is now "", useEffect will trigger fetch
      // but if it was already "", we might need to force it.
      // The useEffect for [page, debouncedSearchTerm] should handle this.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Управление на продукти</h1>
        <Link href="/admin-panel/products/add" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Добави продукт
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Продукти</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                placeholder="Търсене по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border-gray-300"
              />
              <Button type="submit" variant="outline" className="bg-background text-foreground">
                <Search className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSearch}
                className="bg-background text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Снимка</th>
                      <th className="text-left py-3 px-4">Име</th>
                      <th className="text-left py-3 px-4">Цена (лв)</th>
                      <th className="text-left py-3 px-4">Цена (€)</th>
                      <th className="text-left py-3 px-4">Категория</th>
                      <th className="text-left py-3 px-4">Подкатегория</th>
                      <th className="text-left py-3 px-4">Статус</th>
                      <th className="text-left py-3 px-4">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.objectid} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            {product.photourl ? (
                              <img
                                src={product.photourl || "/placeholder.svg"}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "/placeholder.svg?width=128&height=128")}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                Няма
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-700">{product.title}</td>
                        <td className="py-3 px-4">
                          {typeof product.price === "number" ? `${product.price.toFixed(2)} лв.` : "Н/А"}
                        </td>
                        <td className="py-3 px-4">
                          {typeof product.europe_price === "number" ? `${product.europe_price.toFixed(2)} €` : "Н/А"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{product.category_title || "Н/А"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{product.subcategory_title || "Н/А"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              product.active === true ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.active === true ? "Активен" : "Неактивен"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(product)}
                              className="bg-background text-foreground"
                            >
                              <Edit className="h-4 w-4 mr-1" /> Редактирай
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 bg-background"
                              onClick={() => handleDelete(product.objectid)}
                              disabled={deletingProductId === product.objectid}
                            >
                              {deletingProductId === product.objectid ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || loading}
                  className="bg-background text-foreground"
                >
                  Предишна
                </Button>
                <span className="text-sm text-gray-700">
                  Страница {page} от {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                  disabled={page >= totalPages || loading}
                  className="bg-background text-foreground"
                >
                  Следваща
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Няма намерени продукти.</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Опитайте с друг термин за търсене.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {editingProduct && editModalOpen && (
        <EditProductModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingProduct(null)
          }}
          product={editingProduct}
          categories={categories}
          onProductUpdate={() => {
            fetchProducts(debouncedSearchTerm) // Refetch with current debounced search term
          }}
        />
      )}
    </div>
  )
}
