"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Upload } from "lucide-react"
import { SeoFields } from "@/components/seo-fields"

interface Category {
  "Document ID": string
  title: string
}

interface AddSubcategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  onSuccess: () => void
}

export function AddSubcategoryModal({ isOpen, onClose, categories, onSuccess }: AddSubcategoryModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({
    cateid: "",
    title: "",
    title_en: "",
    description: "",
    description_en: "",
    photourl: "",
    deleted: false,
    // SEO fields
    seo_meta_title: "",
    seo_meta_title_bg: "",
    seo_meta_description: "",
    seo_meta_description_bg: "",
    seo_meta_keywords: "",
    seo_meta_keywords_bg: "",
    seo_og_title: "",
    seo_og_title_bg: "",
    seo_og_description: "",
    seo_og_description_bg: "",
    seo_og_image: "",
    seo_twitter_card: "summary_large_image",
    seo_twitter_title: "",
    seo_twitter_description: "",
    seo_twitter_image: "",
    seo_canonical_url: "",
    seo_robots: "index, follow",
    seo_schema_type: "CollectionPage",
    seo_focus_keyword: "",
    seo_secondary_keywords: "",
  })
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | boolean = value

    if (type === "checkbox") {
      if (name === "deleted") {
        processedValue = !(e.target as HTMLInputElement).checked
      } else {
        processedValue = (e.target as HTMLInputElement).checked
      }
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSeoFieldChange = (name: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      setError(null)

      // Проверяваме размера на файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Файлът е твърде голям. Максимален размер: 5MB")
      }

      // Проверяваме типа на файла
      if (!file.type.startsWith("image/")) {
        throw new Error("Моля, изберете валиден файл с изображение")
      }

      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/admin/subcategories/upload-image", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, photourl: data.url }))
      } else {
        throw new Error(data.error || "Грешка при качване на снимката")
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      setError(err instanceof Error ? err.message : "Грешка при качване на снимката")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.cateid || !formData.title || !formData.title_en) {
      setError("Моля, попълнете всички задължителни полета")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/subcategories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }))
        throw new Error(errorData.error || "Грешка при добавяне на подкатегорията")
      }

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
// Reset form
  setFormData({
    cateid: "",
    title: "",
    title_en: "",
    description: "",
    description_en: "",
    photourl: "",
    deleted: false,
    seo_meta_title: "",
    seo_meta_title_bg: "",
    seo_meta_description: "",
    seo_meta_description_bg: "",
    seo_meta_keywords: "",
    seo_meta_keywords_bg: "",
    seo_og_title: "",
    seo_og_title_bg: "",
    seo_og_description: "",
    seo_og_description_bg: "",
    seo_og_image: "",
    seo_twitter_card: "summary_large_image",
    seo_twitter_title: "",
    seo_twitter_description: "",
    seo_twitter_image: "",
    seo_canonical_url: "",
    seo_robots: "index, follow",
    seo_schema_type: "CollectionPage",
    seo_focus_keyword: "",
    seo_secondary_keywords: "",
  })
      } else {
        throw new Error(data.error || "Грешка при добавяне на подкатегорията")
      }
    } catch (err) {
      console.error("Error adding subcategory:", err)
      setError(err instanceof Error ? err.message : "Грешка при добавяне на подкатегорията")
    } finally {
      setLoading(false)
    }
  }

const handleClose = () => {
    if (!loading) {
      onClose()
      setError(null)
      setFormData({
        cateid: "",
        title: "",
        title_en: "",
        description: "",
        description_en: "",
        photourl: "",
        deleted: false,
        seo_meta_title: "",
        seo_meta_title_bg: "",
        seo_meta_description: "",
        seo_meta_description_bg: "",
        seo_meta_keywords: "",
        seo_meta_keywords_bg: "",
        seo_og_title: "",
        seo_og_title_bg: "",
        seo_og_description: "",
        seo_og_description_bg: "",
        seo_og_image: "",
        seo_twitter_card: "summary_large_image",
        seo_twitter_title: "",
        seo_twitter_description: "",
        seo_twitter_image: "",
        seo_canonical_url: "",
        seo_robots: "index, follow",
        seo_schema_type: "CollectionPage",
        seo_focus_keyword: "",
        seo_secondary_keywords: "",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-gray-200 text-black max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-white pb-4 border-b border-gray-100">
          <DialogTitle>Добавяне на нова подкатегория</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow py-4 pr-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <Label htmlFor="subcategory-cateid" className="text-sm font-medium text-gray-700">
                Категория <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.cateid} onValueChange={(value) => handleSelectChange("cateid", value)}>
                <SelectTrigger className="w-full mt-1 bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Изберете категория" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category["Document ID"]} value={category["Document ID"]}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subcategory-title" className="text-sm font-medium text-gray-700">
                  Име на подкатегорията <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subcategory-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1 bg-white border-gray-300 text-black"
                />
              </div>
              <div>
                <Label htmlFor="subcategory-title-en" className="text-sm font-medium text-gray-700">
                  Име на подкатегорията - EU <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subcategory-title-en"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1 bg-white border-gray-300 text-black"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label htmlFor="subcategory-photourl" className="text-sm font-medium text-gray-700">
                Снимка
              </Label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="subcategory-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-white border-gray-300 text-black"
                    disabled={uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    {uploadingImage ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingImage ? "Качване..." : "Качи"}
                  </Button>
                </div>
                {formData.photourl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Преглед:</p>
                    <img
                      src={formData.photourl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?width=128&height=128&text=Error"
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subcategory-description" className="text-sm font-medium text-gray-700">
                  Описание
                </Label>
                <Textarea
                  id="subcategory-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-white border-gray-300 text-black min-h-[80px]"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="subcategory-description-en" className="text-sm font-medium text-gray-700">
                  Описание - EU
                </Label>
                <Textarea
                  id="subcategory-description-en"
                  name="description_en"
                  value={formData.description_en}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-white border-gray-300 text-black min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="subcategory-status"
                name="deleted"
                checked={formData.deleted === false}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <Label htmlFor="subcategory-status" className="text-sm font-medium text-gray-700">
                Активна
              </Label>
            </div>

            {/* SEO Fields */}
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <SeoFields
                formData={formData}
                onChange={handleSeoFieldChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 z-10 bg-white pt-4 border-t border-gray-100 mt-auto">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Отказ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.cateid || !formData.title || !formData.title_en}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Обработка...
              </>
            ) : (
              "Добави подкатегория"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
