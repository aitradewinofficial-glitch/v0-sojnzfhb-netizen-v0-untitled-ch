"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Euro, Star, Plus, Search, Globe, Twitter, Share2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ProductImageUpload } from "@/components/product-image-upload"
import { StarRating } from "@/components/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductFAQEditor } from "@/components/product-faq-editor"
import { HelpCircle } from "lucide-react"

interface Category {
  id: string
  title: string
}

interface Subcategory {
  id: string
  title: string
}

interface Product {
  objectid: string
  title: string
  description?: string
  price?: number | string
  retailerprice?: number | string
  wholesalerprice?: number | string
  europe_price?: number | string
  price_eur?: number | string
  retailerprice_eur?: number | string
  wholesalerprice_eur?: number | string
  europe_price_eur?: number | string
  cateid?: string
  subcateid?: string
  photourl?: string
  sku?: string
  barcode?: string
  stock?: number
  active?: boolean
  createdat?: string
  updated_at?: string
  deleted?: boolean
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

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  categories: Category[]
  onProductUpdate: () => void
}

export function EditProductModal({ isOpen, onClose, product, categories, onProductUpdate }: EditProductModalProps) {
  const [formData, setFormData] = useState<Product | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddReview, setShowAddReview] = useState(false)
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [newReviewName, setNewReviewName] = useState("")
  const [newReviewText, setNewReviewText] = useState("")
  const [addingReview, setAddingReview] = useState(false)

  useEffect(() => {
    if (product) {
      const initialFormData = JSON.parse(JSON.stringify(product))
      setFormData(initialFormData)
      if (initialFormData.cateid) {
        fetchSubcategories(initialFormData.cateid)
      } else {
        setSubcategories([])
      }
    } else {
      setFormData(null)
      setSubcategories([])
    }
  }, [product, isOpen])

  const fetchSubcategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    setLoadingSubcategories(true)
    try {
      const response = await fetch(`/api/admin/subcategories?cateid=${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.subcategories) {
          setSubcategories(data.subcategories)
        } else {
          setSubcategories([])
          toast({
            title: "Грешка при зареждане на подкатегории",
            description: data.error || "API отговорът не беше успешен.",
            variant: "destructive",
          })
        }
      } else {
        setSubcategories([])
        toast({
          title: "Грешка при мрежова заявка за подкатегории",
          description: `Статус: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setSubcategories([])
      toast({
        title: "Грешка при извличане на подкатегории",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    if (!formData) return

    const updatedData = { ...formData, [fieldName]: value }
    setFormData(updatedData)

    if (fieldName === "cateid") {
      updatedData.subcateid = ""
      fetchSubcategories(value)
      setFormData(updatedData)
    }
  }

  const handleAddReview = async () => {
    if (!formData || newReviewRating === 0) return
    setAddingReview(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: formData.objectid,
          rating: newReviewRating,
          reviewerName: newReviewName.trim() || null,
          reviewText: newReviewText.trim() || null,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Успех",
          description: "Отзивът е добавен успешно.",
        })
        setShowAddReview(false)
        setNewReviewRating(5)
        setNewReviewName("")
        setNewReviewText("")
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно добавяне на отзив.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding review:", error)
      toast({
        title: "Грешка",
        description: "Възникна грешка при добавяне на отзива.",
        variant: "destructive",
      })
    } finally {
      setAddingReview(false)
    }
  }

  const handleFullSave = async () => {
    if (!formData) return
    setSaving(true)
    try {
      const payload: any = {
        id: formData.objectid,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        retailerprice: formData.retailerprice,
        wholesalerprice: formData.wholesalerprice,
        europe_price: formData.europe_price,
        price_eur: formData.price_eur,
        retailerprice_eur: formData.retailerprice_eur,
        wholesalerprice_eur: formData.wholesalerprice_eur,
        europe_price_eur: formData.europe_price_eur,
        cateid: formData.cateid,
        subcateid: formData.subcateid,
        photourl: formData.photourl,
        active: formData.active,
        // SEO fields
        seo_meta_title: formData.seo_meta_title,
        seo_meta_description: formData.seo_meta_description,
        seo_meta_keywords: formData.seo_meta_keywords,
        seo_og_title: formData.seo_og_title,
        seo_og_description: formData.seo_og_description,
        seo_og_image: formData.seo_og_image,
        seo_twitter_title: formData.seo_twitter_title,
        seo_twitter_description: formData.seo_twitter_description,
        seo_twitter_image: formData.seo_twitter_image,
        seo_canonical_url: formData.seo_canonical_url,
        seo_robots: formData.seo_robots,
        seo_schema_brand: formData.seo_schema_brand,
        seo_schema_sku: formData.seo_schema_sku,
        seo_schema_availability: formData.seo_schema_availability,
        seo_focus_keyword: formData.seo_focus_keyword,
        seo_secondary_keywords: formData.seo_secondary_keywords,
        seo_alt_text: formData.seo_alt_text,
        seo_meta_title_bg: formData.seo_meta_title_bg,
        seo_meta_description_bg: formData.seo_meta_description_bg,
        seo_meta_keywords_bg: formData.seo_meta_keywords_bg,
        seo_og_title_bg: formData.seo_og_title_bg,
        seo_og_description_bg: formData.seo_og_description_bg,
      }

      const response = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Успех",
          description: result.message || "Продуктът е обновен успешно.",
        })
        onProductUpdate()
        onClose() // Close the modal after successful save
      } else {
        toast({
          title: "Грешка при запазване",
          description: result.error || "Неуспешно обновяване на продукта.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during full product save:", error)
      toast({
        title: "Грешка",
        description: "Възникна грешка при запазване на всички промени по продукта.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !formData) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            Редактиране на продукт
            {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Направете желаните промени и натиснете 'Запази всички промени'.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-grow py-4 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400">Основна информация</h3>
              <div>
                <Label htmlFor="objectid">Object ID (readonly)</Label>
                <Input
                  id="objectid"
                  value={formData.objectid || ""}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || ""}
                  onChange={(e) => handleFieldChange("sku", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode || ""}
                  onChange={(e) => handleFieldChange("barcode", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-400">Ценообразуване</h3>
              <div>
                <Label htmlFor="price">Price (лв)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price === null || formData.price === undefined ? "" : formData.price}
                  onChange={(e) =>
                    handleFieldChange("price", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="retailerprice">Retailer Price (лв)</Label>
                <Input
                  id="retailerprice"
                  type="number"
                  step="0.01"
                  value={
                    formData.retailerprice === null || formData.retailerprice === undefined
                      ? ""
                      : formData.retailerprice
                  }
                  onChange={(e) =>
                    handleFieldChange("retailerprice", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="wholesalerprice">Wholesaler Price (лв)</Label>
                <Input
                  id="wholesalerprice"
                  type="number"
                  step="0.01"
                  value={
                    formData.wholesalerprice === null || formData.wholesalerprice === undefined
                      ? ""
                      : formData.wholesalerprice
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      "wholesalerprice",
                      e.target.value === "" ? null : Number.parseFloat(e.target.value),
                    )
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="europe_price" className="flex items-center">
                  Europe Price (лв)
                </Label>
                <Input
                  id="europe_price"
                  type="number"
                  step="0.01"
                  value={
                    formData.europe_price === null || formData.europe_price === undefined ? "" : formData.europe_price
                  }
                  onChange={(e) =>
                    handleFieldChange("europe_price", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <h3 className="text-lg font-semibold text-yellow-400 pt-4 flex items-center">
                <Euro className="h-5 w-5 mr-2" />
                Цени в Евро (EUR)
              </h3>
              <div>
                <Label htmlFor="price_eur" className="flex items-center">
                  <Euro className="h-4 w-4 mr-1" />
                  Price (€)
                </Label>
                <Input
                  id="price_eur"
                  type="number"
                  step="0.01"
                  value={
                    formData.price_eur === null || formData.price_eur === undefined ? "" : formData.price_eur
                  }
                  onChange={(e) =>
                    handleFieldChange("price_eur", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="retailerprice_eur" className="flex items-center">
                  <Euro className="h-4 w-4 mr-1" />
                  Retailer Price (€)
                </Label>
                <Input
                  id="retailerprice_eur"
                  type="number"
                  step="0.01"
                  value={
                    formData.retailerprice_eur === null || formData.retailerprice_eur === undefined ? "" : formData.retailerprice_eur
                  }
                  onChange={(e) =>
                    handleFieldChange("retailerprice_eur", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="wholesalerprice_eur" className="flex items-center">
                  <Euro className="h-4 w-4 mr-1" />
                  Wholesaler Price (€)
                </Label>
                <Input
                  id="wholesalerprice_eur"
                  type="number"
                  step="0.01"
                  value={
                    formData.wholesalerprice_eur === null || formData.wholesalerprice_eur === undefined ? "" : formData.wholesalerprice_eur
                  }
                  onChange={(e) =>
                    handleFieldChange("wholesalerprice_eur", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="europe_price_eur" className="flex items-center">
                  <Euro className="h-4 w-4 mr-1" />
                  Europe Price (€)
                </Label>
                <Input
                  id="europe_price_eur"
                  type="number"
                  step="0.01"
                  value={
                    formData.europe_price_eur === null || formData.europe_price_eur === undefined ? "" : formData.europe_price_eur
                  }
                  onChange={(e) =>
                    handleFieldChange("europe_price_eur", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Categories & Inventory */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-400">Категории и наличност</h3>
              <div>
                <Label htmlFor="cateid">Category ID</Label>
                <select
                  id="cateid"
                  value={formData.cateid || ""}
                  onChange={(e) => handleFieldChange("cateid", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Изберете категория</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title} ({category.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subcateid">Subcategory ID</Label>
                <select
                  id="subcateid"
                  value={formData.subcateid || ""}
                  onChange={(e) => handleFieldChange("subcateid", e.target.value)}
                  disabled={!formData.cateid || loadingSubcategories}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <option value="">{loadingSubcategories ? "Зареждане..." : "Изберете подкатегория"}</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.title} ({subcategory.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock === null || formData.stock === undefined ? "" : formData.stock}
                  onChange={(e) =>
                    handleFieldChange("stock", e.target.value === "" ? null : Number.parseInt(e.target.value, 10))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Media & Status */}
            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold text-orange-400">Медия и статус</h3>
              <div>
                <Label>Снимка на продукта</Label>
                <ProductImageUpload
                  productId={formData.objectid}
                  currentImageUrl={formData.photourl}
                  onImageUploaded={(newUrl) => {
                    handleFieldChange("photourl", newUrl)
                    toast({
                      title: "Снимката е обновена",
                      description: "Новият URL на снимката е записан във формата.",
                    })
                  }}
                />
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active || false}
                  onChange={(e) => handleFieldChange("active", e.target.checked)}
                  className="h-4 w-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="deleted"
                  checked={formData.deleted || false}
                  onChange={(e) => handleFieldChange("deleted", e.target.checked)}
                  className="h-4 w-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <Label htmlFor="deleted">Deleted</Label>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-400">Timestamps</h3>
              <div>
                <Label htmlFor="createdat">Created At (readonly)</Label>
                <Input
                  id="createdat"
                  value={formData.createdat ? new Date(formData.createdat).toLocaleString("bg-BG") : ""}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="updated_at">Updated At (readonly)</Label>
                <Input
                  id="updated_at"
                  value={formData.updated_at ? new Date(formData.updated_at).toLocaleString("bg-BG") : ""}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
              </div>
            </div>

            {/* SEO Section - Full Width */}
            <div className="md:col-span-2 lg:col-span-3 space-y-4 border-t border-gray-700 pt-6 mt-4">
              <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Настройки
              </h3>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-600">Основни</TabsTrigger>
                  <TabsTrigger value="og" className="data-[state=active]:bg-cyan-600">Open Graph</TabsTrigger>
                  <TabsTrigger value="twitter" className="data-[state=active]:bg-cyan-600">Twitter</TabsTrigger>
                  <TabsTrigger value="schema" className="data-[state=active]:bg-cyan-600">Schema.org</TabsTrigger>
                  <TabsTrigger value="advanced" className="data-[state=active]:bg-cyan-600">Разширени</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_meta_title">Meta Title (EN)</Label>
                      <Input
                        id="seo_meta_title"
                        value={formData.seo_meta_title || ""}
                        onChange={(e) => handleFieldChange("seo_meta_title", e.target.value)}
                        placeholder="Product title for search engines"
                        className="bg-gray-800 border-gray-700 text-white"
                        maxLength={60}
                      />
                      <p className="text-xs text-gray-500 mt-1">{(formData.seo_meta_title || "").length}/60 символа</p>
                    </div>
                    <div>
                      <Label htmlFor="seo_meta_title_bg">Meta Title (BG)</Label>
                      <Input
                        id="seo_meta_title_bg"
                        value={formData.seo_meta_title_bg || ""}
                        onChange={(e) => handleFieldChange("seo_meta_title_bg", e.target.value)}
                        placeholder="Заглавие за търсачки"
                        className="bg-gray-800 border-gray-700 text-white"
                        maxLength={60}
                      />
                      <p className="text-xs text-gray-500 mt-1">{(formData.seo_meta_title_bg || "").length}/60 символа</p>
                    </div>
                    <div>
                      <Label htmlFor="seo_meta_description">Meta Description (EN)</Label>
                      <Textarea
                        id="seo_meta_description"
                        value={formData.seo_meta_description || ""}
                        onChange={(e) => handleFieldChange("seo_meta_description", e.target.value)}
                        placeholder="Product description for search engines"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-gray-500 mt-1">{(formData.seo_meta_description || "").length}/160 символа</p>
                    </div>
                    <div>
                      <Label htmlFor="seo_meta_description_bg">Meta Description (BG)</Label>
                      <Textarea
                        id="seo_meta_description_bg"
                        value={formData.seo_meta_description_bg || ""}
                        onChange={(e) => handleFieldChange("seo_meta_description_bg", e.target.value)}
                        placeholder="Описание за търсачки"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-gray-500 mt-1">{(formData.seo_meta_description_bg || "").length}/160 символа</p>
                    </div>
                    <div>
                      <Label htmlFor="seo_meta_keywords">Keywords (EN)</Label>
                      <Input
                        id="seo_meta_keywords"
                        value={formData.seo_meta_keywords || ""}
                        onChange={(e) => handleFieldChange("seo_meta_keywords", e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_meta_keywords_bg">Keywords (BG)</Label>
                      <Input
                        id="seo_meta_keywords_bg"
                        value={formData.seo_meta_keywords_bg || ""}
                        onChange={(e) => handleFieldChange("seo_meta_keywords_bg", e.target.value)}
                        placeholder="ключова1, ключова2, ключова3"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_focus_keyword">Focus Keyword</Label>
                      <Input
                        id="seo_focus_keyword"
                        value={formData.seo_focus_keyword || ""}
                        onChange={(e) => handleFieldChange("seo_focus_keyword", e.target.value)}
                        placeholder="Primary keyword to rank for"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_secondary_keywords">Secondary Keywords</Label>
                      <Input
                        id="seo_secondary_keywords"
                        value={formData.seo_secondary_keywords || ""}
                        onChange={(e) => handleFieldChange("seo_secondary_keywords", e.target.value)}
                        placeholder="secondary1, secondary2"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Google Preview */}
                  <div className="bg-gray-800 p-4 rounded-lg mt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Google Preview</h4>
                    <div className="space-y-1">
                      <p className="text-blue-400 text-lg hover:underline cursor-pointer">
                        {formData.seo_meta_title || formData.title || "Заглавие на продукта"}
                      </p>
                      <p className="text-green-500 text-sm">
                        example.com/product/{formData.objectid}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formData.seo_meta_description || formData.description?.slice(0, 160) || "Описание на продукта..."}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="og" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_og_title" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        OG Title (EN)
                      </Label>
                      <Input
                        id="seo_og_title"
                        value={formData.seo_og_title || ""}
                        onChange={(e) => handleFieldChange("seo_og_title", e.target.value)}
                        placeholder="Title for Facebook/LinkedIn"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_og_title_bg" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        OG Title (BG)
                      </Label>
                      <Input
                        id="seo_og_title_bg"
                        value={formData.seo_og_title_bg || ""}
                        onChange={(e) => handleFieldChange("seo_og_title_bg", e.target.value)}
                        placeholder="Заглавие за Facebook/LinkedIn"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_og_description">OG Description (EN)</Label>
                      <Textarea
                        id="seo_og_description"
                        value={formData.seo_og_description || ""}
                        onChange={(e) => handleFieldChange("seo_og_description", e.target.value)}
                        placeholder="Description for social sharing"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_og_description_bg">OG Description (BG)</Label>
                      <Textarea
                        id="seo_og_description_bg"
                        value={formData.seo_og_description_bg || ""}
                        onChange={(e) => handleFieldChange("seo_og_description_bg", e.target.value)}
                        placeholder="Описание за социални мрежи"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="seo_og_image">OG Image URL</Label>
                      <Input
                        id="seo_og_image"
                        value={formData.seo_og_image || ""}
                        onChange={(e) => handleFieldChange("seo_og_image", e.target.value)}
                        placeholder="https://example.com/image.jpg (1200x630 препоръчително)"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Препоръчителен размер: 1200x630 пиксела</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="twitter" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_twitter_title" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter Title
                      </Label>
                      <Input
                        id="seo_twitter_title"
                        value={formData.seo_twitter_title || ""}
                        onChange={(e) => handleFieldChange("seo_twitter_title", e.target.value)}
                        placeholder="Title for Twitter cards"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_twitter_description">Twitter Description</Label>
                      <Textarea
                        id="seo_twitter_description"
                        value={formData.seo_twitter_description || ""}
                        onChange={(e) => handleFieldChange("seo_twitter_description", e.target.value)}
                        placeholder="Description for Twitter"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={2}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="seo_twitter_image">Twitter Image URL</Label>
                      <Input
                        id="seo_twitter_image"
                        value={formData.seo_twitter_image || ""}
                        onChange={(e) => handleFieldChange("seo_twitter_image", e.target.value)}
                        placeholder="https://example.com/twitter-image.jpg"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schema" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_schema_brand" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Brand
                      </Label>
                      <Input
                        id="seo_schema_brand"
                        value={formData.seo_schema_brand || ""}
                        onChange={(e) => handleFieldChange("seo_schema_brand", e.target.value)}
                        placeholder="Мадикс Граундбейтс"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_schema_sku">SKU</Label>
                      <Input
                        id="seo_schema_sku"
                        value={formData.seo_schema_sku || ""}
                        onChange={(e) => handleFieldChange("seo_schema_sku", e.target.value)}
                        placeholder="Product SKU"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_schema_availability">Availability</Label>
                      <select
                        id="seo_schema_availability"
                        value={formData.seo_schema_availability || "InStock"}
                        onChange={(e) => handleFieldChange("seo_schema_availability", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="InStock">В наличност (InStock)</option>
                        <option value="OutOfStock">Изчерпан (OutOfStock)</option>
                        <option value="PreOrder">Предварителна поръчка (PreOrder)</option>
                        <option value="LimitedAvailability">Ограничена наличност</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="seo_alt_text">Image Alt Text</Label>
                      <Input
                        id="seo_alt_text"
                        value={formData.seo_alt_text || ""}
                        onChange={(e) => handleFieldChange("seo_alt_text", e.target.value)}
                        placeholder="Описание на изображението"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_canonical_url">Canonical URL</Label>
                      <Input
                        id="seo_canonical_url"
                        value={formData.seo_canonical_url || ""}
                        onChange={(e) => handleFieldChange("seo_canonical_url", e.target.value)}
                        placeholder="https://example.com/product/..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_robots">Robots Directive</Label>
                      <select
                        id="seo_robots"
                        value={formData.seo_robots || "index, follow"}
                        onChange={(e) => handleFieldChange("seo_robots", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="index, follow">index, follow (default)</option>
                        <option value="noindex, follow">noindex, follow</option>
                        <option value="index, nofollow">index, nofollow</option>
                        <option value="noindex, nofollow">noindex, nofollow</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Add Review Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Отзиви
              </h3>
              {!showAddReview ? (
                <Button
                  type="button"
                  onClick={() => setShowAddReview(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добави отзив
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
                  <div>
                    <Label>Оценка</Label>
                    <StarRating
                      rating={newReviewRating}
                      interactive
                      onRatingChange={setNewReviewRating}
                      size="lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewerName">Име на рецензента</Label>
                    <Input
                      id="reviewerName"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      placeholder="Въведете име"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewText">Текст на отзива</Label>
                    <Textarea
                      id="reviewText"
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Въведете текст на отзива"
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddReview}
                      disabled={addingReview || newReviewRating === 0}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {addingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Запази отзива
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddReview(false)
                        setNewReviewRating(5)
                        setNewReviewName("")
                        setNewReviewText("")
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Отказ
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Section */}
          <div className="md:col-span-2 lg:col-span-3 space-y-4 border-t border-gray-700 pt-6 mt-4">
            <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Често задавани въпроси (FAQ)
            </h3>
            <ProductFAQEditor productId={formData.objectid} />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-800 flex justify-end space-x-2">
          <Button
            type="button"
            onClick={handleFullSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Запази всички промени
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
