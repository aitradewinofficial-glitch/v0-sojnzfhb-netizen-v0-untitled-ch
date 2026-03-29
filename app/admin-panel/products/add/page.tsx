"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { RefreshCw, Search, Globe, Twitter, ChevronDown, ChevronUp } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Category {
  id: string
  title: string
  objectid?: string
}

interface Subcategory {
  id: string
  title: string
  cateid?: string
  objectid?: string
}

export default function AddProductPage() {
  const [showSeoSection, setShowSeoSection] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    title_en: "",
    description: "",
    description_en: "",
    price: "",
    wholesalerprice: "",
    retailerprice: "",
    europe_price: "",
    cateid: "",
    subcateid: "",
    photourl: "",
    // SEO fields
    seo_meta_title: "",
    seo_meta_description: "",
    seo_meta_keywords: "",
    seo_og_title: "",
    seo_og_description: "",
    seo_og_image: "",
    seo_twitter_title: "",
    seo_twitter_description: "",
    seo_twitter_image: "",
    seo_canonical_url: "",
    seo_robots: "index, follow",
    seo_schema_brand: "Мадикс Граундбейтс",
    seo_schema_sku: "",
    seo_schema_availability: "InStock",
    seo_focus_keyword: "",
    seo_secondary_keywords: "",
    seo_alt_text: "",
    seo_meta_title_bg: "",
    seo_meta_description_bg: "",
    seo_meta_keywords_bg: "",
    seo_og_title_bg: "",
    seo_og_description_bg: "",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Зареждане на ВСИЧКИ категории без кеширане
  const fetchAllCategories = async () => {
    try {
      console.log("Fetching categories without cache...")
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/categories?limit=1000&page=1&nocache=${timestamp}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fresh categories fetched:", data)

      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories)
        console.log("Total categories loaded:", data.categories.length)
      } else {
        console.warn("No categories found in response")
        setCategories([])
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Грешка при зареждане на категориите.")
    }
  }

  // Зареждане на подкатегории за конкретна категория БЕЗ КЕШИРАНЕ
  const fetchSubcategoriesForCategory = async (categoryId: string) => {
    if (!categoryId || categoryId === "none") {
      setFilteredSubcategories([])
      return
    }

    try {
      setLoadingSubcategories(true)
      console.log(`Fetching subcategories for category: ${categoryId} without cache...`)

      const timestamp = Date.now()
      const response = await fetch(
        `/api/admin/subcategories?categoryId=${categoryId}&limit=1000&page=1&nocache=${timestamp}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fresh subcategories fetched for category:", data)

      if (data.subcategories && Array.isArray(data.subcategories)) {
        setFilteredSubcategories(data.subcategories)
        console.log(`Total subcategories loaded for category ${categoryId}:`, data.subcategories.length)
      } else {
        console.warn("No subcategories found in response")
        setFilteredSubcategories([])
      }
    } catch (err) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, err)
      setError("Грешка при зареждане на подкатегориите.")
      setFilteredSubcategories([])
    } finally {
      setLoadingSubcategories(false)
    }
  }

  // Зареждане на категориите при монтиране на компонента
  useEffect(() => {
    fetchAllCategories()
  }, [])

  // Зареждане на подкатегории при промяна на избраната категория
  useEffect(() => {
    if (formData.cateid && formData.cateid !== "none") {
      fetchSubcategoriesForCategory(formData.cateid)
    } else {
      setFilteredSubcategories([])
    }
  }, [formData.cateid])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Ако променяме категорията, нулираме избраната подкатегория
    if (name === "cateid") {
      setFormData((prev) => ({ ...prev, subcateid: "" }))
    }
  }

  const handleRefreshSubcategories = () => {
    console.log("Manual refresh of subcategories triggered")
    if (formData.cateid && formData.cateid !== "none") {
      fetchSubcategoriesForCategory(formData.cateid)
    }
  }

  const handleRefreshCategories = () => {
    console.log("Manual refresh of categories triggered")
    fetchAllCategories()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/products/add?nocache=${timestamp}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        setSuccess("Продуктът беше добавен успешно!")
        // Изчистваме формата след успешно добавяне
        setFormData({
          title: "",
          title_en: "",
          description: "",
          description_en: "",
          price: "",
          wholesalerprice: "",
          retailerprice: "",
          europe_price: "",
          cateid: "",
          subcateid: "",
          photourl: "",
          seo_meta_title: "",
          seo_meta_description: "",
          seo_meta_keywords: "",
          seo_og_title: "",
          seo_og_description: "",
          seo_og_image: "",
          seo_twitter_title: "",
          seo_twitter_description: "",
          seo_twitter_image: "",
          seo_canonical_url: "",
          seo_robots: "index, follow",
          seo_schema_brand: "Мадикс Граундбейтс",
          seo_schema_sku: "",
          seo_schema_availability: "InStock",
          seo_focus_keyword: "",
          seo_secondary_keywords: "",
          seo_alt_text: "",
          seo_meta_title_bg: "",
          seo_meta_description_bg: "",
          seo_meta_keywords_bg: "",
          seo_og_title_bg: "",
          seo_og_description_bg: "",
        })

        // Пренасочваме към списъка с продукти след кратко забавяне
        setTimeout(() => {
          router.push("/admin-panel/products")
        }, 2000)
      } else {
        setError(data.error || "Грешка при добавяне на продукта.")
      }
    } catch (err) {
      console.error("Error adding product:", err)
      const errorMessage =
        err instanceof Error ? err.message : "Грешка при добавяне на продукта. Моля, опитайте отново."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Добавяне на продукт</h1>
        <Button variant="outline" onClick={() => router.push("/admin-panel/products")}>
          Назад към продукти
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Информация за продукта</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Име на продукта *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="title_en" className="text-sm font-medium">
                  Име на продукта - EU *
                </label>
                <Input
                  id="title_en"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Описание
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-white border-gray-300 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description_en" className="text-sm font-medium">
                  Описание - EU
                </label>
                <Textarea
                  id="description_en"
                  name="description_en"
                  value={formData.description_en}
                  onChange={handleChange}
                  className="bg-white border-gray-300 min-h-[100px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Цена *
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="europe_price" className="text-sm font-medium flex items-center">
                  <span className="mr-1">€</span> Цена за европейци
                </label>
                <Input
                  id="europe_price"
                  name="europe_price"
                  type="number"
                  step="0.01"
                  value={formData.europe_price}
                  onChange={handleChange}
                  className="bg-white border-gray-300"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="wholesalerprice" className="text-sm font-medium">
                  Цена на едро
                </label>
                <Input
                  id="wholesalerprice"
                  name="wholesalerprice"
                  type="number"
                  step="0.01"
                  value={formData.wholesalerprice}
                  onChange={handleChange}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="retailerprice" className="text-sm font-medium">
                  Цена на дребно
                </label>
                <Input
                  id="retailerprice"
                  name="retailerprice"
                  type="number"
                  step="0.01"
                  value={formData.retailerprice}
                  onChange={handleChange}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="cateid" className="text-sm font-medium">
                    Категория ({categories.length} налични)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshCategories}
                    className="h-6 px-2 text-xs bg-transparent"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className="ml-1">Обнови</span>
                  </Button>
                </div>
                <Select value={formData.cateid} onValueChange={(value) => handleSelectChange("cateid", value)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Изберете категория" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="none">Без категория</SelectItem>
                    {categories.map((category) => {
                      const categoryId = category.id || category.objectid
                      if (!categoryId) return null

                      return (
                        <SelectItem key={categoryId} value={categoryId}>
                          {category.title || "Категория без име"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="subcateid" className="text-sm font-medium">
                    Подкатегория ({filteredSubcategories.length} налични)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshSubcategories}
                    disabled={!formData.cateid || formData.cateid === "none" || loadingSubcategories}
                    className="h-6 px-2 text-xs bg-transparent"
                  >
                    {loadingSubcategories ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="ml-1">Обнови</span>
                  </Button>
                </div>
                <Select value={formData.subcateid} onValueChange={(value) => handleSelectChange("subcateid", value)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Изберете подкатегория" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="none">Без подкатегория</SelectItem>
                    {loadingSubcategories ? (
                      <div className="flex items-center justify-center py-2">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Зареждане...</span>
                      </div>
                    ) : filteredSubcategories.length > 0 ? (
                      filteredSubcategories.map((subcategory) => {
                        const subcategoryId = subcategory.id || subcategory.objectid
                        if (!subcategoryId) return null

                        return (
                          <SelectItem key={subcategoryId} value={subcategoryId}>
                            {subcategory.title || "Подкатегория без име"}
                          </SelectItem>
                        )
                      })
                    ) : formData.cateid && formData.cateid !== "none" ? (
                      <SelectItem value="no-subcategories">Няма подкатегории за тази категория</SelectItem>
                    ) : (
                      <SelectItem value="select-category-first">Първо изберете категория</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="photourl" className="text-sm font-medium">
                Снимка на продукта
              </label>
              <ImageUpload
                currentImageUrl={formData.photourl}
                onImageUploaded={(url) => setFormData((prev) => ({ ...prev, photourl: url }))}
                onError={(error) => setError(error)}
                uploadUrl="/api/products/upload-image"
              />
            </div>

            {/* SEO Section - Collapsible */}
            <div className="space-y-4 border-t pt-6 mt-6">
              <button
                type="button"
                onClick={() => setShowSeoSection(!showSeoSection)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5 text-cyan-600" />
                  SEO Настройки
                </h3>
                {showSeoSection ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {showSeoSection && (
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-white">Основни</TabsTrigger>
                    <TabsTrigger value="og" className="data-[state=active]:bg-white">Open Graph</TabsTrigger>
                    <TabsTrigger value="twitter" className="data-[state=active]:bg-white">Twitter</TabsTrigger>
                    <TabsTrigger value="schema" className="data-[state=active]:bg-white">Schema.org</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="seo_meta_title" className="text-sm font-medium">
                          Meta Title (EN)
                        </label>
                        <Input
                          id="seo_meta_title"
                          name="seo_meta_title"
                          value={formData.seo_meta_title}
                          onChange={handleChange}
                          placeholder="Product title for search engines"
                          className="bg-white border-gray-300"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500">{formData.seo_meta_title.length}/60</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_meta_title_bg" className="text-sm font-medium">
                          Meta Title (BG)
                        </label>
                        <Input
                          id="seo_meta_title_bg"
                          name="seo_meta_title_bg"
                          value={formData.seo_meta_title_bg}
                          onChange={handleChange}
                          placeholder="Заглавие за търсачки"
                          className="bg-white border-gray-300"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500">{formData.seo_meta_title_bg.length}/60</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_meta_description" className="text-sm font-medium">
                          Meta Description (EN)
                        </label>
                        <Textarea
                          id="seo_meta_description"
                          name="seo_meta_description"
                          value={formData.seo_meta_description}
                          onChange={handleChange}
                          placeholder="Product description for search engines"
                          className="bg-white border-gray-300 min-h-[80px]"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500">{formData.seo_meta_description.length}/160</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_meta_description_bg" className="text-sm font-medium">
                          Meta Description (BG)
                        </label>
                        <Textarea
                          id="seo_meta_description_bg"
                          name="seo_meta_description_bg"
                          value={formData.seo_meta_description_bg}
                          onChange={handleChange}
                          placeholder="Описание за търсачки"
                          className="bg-white border-gray-300 min-h-[80px]"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500">{formData.seo_meta_description_bg.length}/160</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_meta_keywords" className="text-sm font-medium">
                          Keywords (EN)
                        </label>
                        <Input
                          id="seo_meta_keywords"
                          name="seo_meta_keywords"
                          value={formData.seo_meta_keywords}
                          onChange={handleChange}
                          placeholder="keyword1, keyword2, keyword3"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_meta_keywords_bg" className="text-sm font-medium">
                          Keywords (BG)
                        </label>
                        <Input
                          id="seo_meta_keywords_bg"
                          name="seo_meta_keywords_bg"
                          value={formData.seo_meta_keywords_bg}
                          onChange={handleChange}
                          placeholder="ключова1, ключова2"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_focus_keyword" className="text-sm font-medium">
                          Focus Keyword
                        </label>
                        <Input
                          id="seo_focus_keyword"
                          name="seo_focus_keyword"
                          value={formData.seo_focus_keyword}
                          onChange={handleChange}
                          placeholder="Primary keyword"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_robots" className="text-sm font-medium">
                          Robots Directive
                        </label>
                        <Select value={formData.seo_robots} onValueChange={(value) => setFormData(prev => ({ ...prev, seo_robots: value }))}>
                          <SelectTrigger className="bg-white border-gray-300">
                            <SelectValue placeholder="Select robots directive" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="index, follow">index, follow (default)</SelectItem>
                            <SelectItem value="noindex, follow">noindex, follow</SelectItem>
                            <SelectItem value="index, nofollow">index, nofollow</SelectItem>
                            <SelectItem value="noindex, nofollow">noindex, nofollow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="og" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="seo_og_title" className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          OG Title (EN)
                        </label>
                        <Input
                          id="seo_og_title"
                          name="seo_og_title"
                          value={formData.seo_og_title}
                          onChange={handleChange}
                          placeholder="Title for Facebook/LinkedIn"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_og_title_bg" className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          OG Title (BG)
                        </label>
                        <Input
                          id="seo_og_title_bg"
                          name="seo_og_title_bg"
                          value={formData.seo_og_title_bg}
                          onChange={handleChange}
                          placeholder="Заглавие за Facebook/LinkedIn"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_og_description" className="text-sm font-medium">
                          OG Description (EN)
                        </label>
                        <Textarea
                          id="seo_og_description"
                          name="seo_og_description"
                          value={formData.seo_og_description}
                          onChange={handleChange}
                          placeholder="Description for social sharing"
                          className="bg-white border-gray-300 min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_og_description_bg" className="text-sm font-medium">
                          OG Description (BG)
                        </label>
                        <Textarea
                          id="seo_og_description_bg"
                          name="seo_og_description_bg"
                          value={formData.seo_og_description_bg}
                          onChange={handleChange}
                          placeholder="Описание за социални мрежи"
                          className="bg-white border-gray-300 min-h-[80px]"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="seo_og_image" className="text-sm font-medium">
                          OG Image URL
                        </label>
                        <Input
                          id="seo_og_image"
                          name="seo_og_image"
                          value={formData.seo_og_image}
                          onChange={handleChange}
                          placeholder="https://example.com/image.jpg (1200x630 recommended)"
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="twitter" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="seo_twitter_title" className="text-sm font-medium flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          Twitter Title
                        </label>
                        <Input
                          id="seo_twitter_title"
                          name="seo_twitter_title"
                          value={formData.seo_twitter_title}
                          onChange={handleChange}
                          placeholder="Title for Twitter cards"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_twitter_description" className="text-sm font-medium">
                          Twitter Description
                        </label>
                        <Textarea
                          id="seo_twitter_description"
                          name="seo_twitter_description"
                          value={formData.seo_twitter_description}
                          onChange={handleChange}
                          placeholder="Description for Twitter"
                          className="bg-white border-gray-300 min-h-[80px]"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="seo_twitter_image" className="text-sm font-medium">
                          Twitter Image URL
                        </label>
                        <Input
                          id="seo_twitter_image"
                          name="seo_twitter_image"
                          value={formData.seo_twitter_image}
                          onChange={handleChange}
                          placeholder="https://example.com/twitter-image.jpg"
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="schema" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="seo_schema_brand" className="text-sm font-medium">
                          Brand
                        </label>
                        <Input
                          id="seo_schema_brand"
                          name="seo_schema_brand"
                          value={formData.seo_schema_brand}
                          onChange={handleChange}
                          placeholder="Мадикс Граундбейтс"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_schema_sku" className="text-sm font-medium">
                          SKU
                        </label>
                        <Input
                          id="seo_schema_sku"
                          name="seo_schema_sku"
                          value={formData.seo_schema_sku}
                          onChange={handleChange}
                          placeholder="Product SKU"
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_schema_availability" className="text-sm font-medium">
                          Availability
                        </label>
                        <Select value={formData.seo_schema_availability} onValueChange={(value) => setFormData(prev => ({ ...prev, seo_schema_availability: value }))}>
                          <SelectTrigger className="bg-white border-gray-300">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="InStock">В наличност (InStock)</SelectItem>
                            <SelectItem value="OutOfStock">Изчерпан (OutOfStock)</SelectItem>
                            <SelectItem value="PreOrder">Предварителна поръчка</SelectItem>
                            <SelectItem value="LimitedAvailability">Ограничена наличност</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seo_alt_text" className="text-sm font-medium">
                          Image Alt Text
                        </label>
                        <Input
                          id="seo_alt_text"
                          name="seo_alt_text"
                          value={formData.seo_alt_text}
                          onChange={handleChange}
                          placeholder="Описание на изображението"
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Добавяне...
                  </>
                ) : (
                  "Добави продукт"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
