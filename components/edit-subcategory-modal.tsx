"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, AlertTriangle } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import { SeoFields } from "@/components/seo-fields"
import { useToast } from "@/components/ui/use-toast"

interface SubcategoryForModal {
  id: string
  cateid: string
  title: string
  description?: string | null
  photourl?: string | null
  deleted: boolean
  "Document ID"?: string
  [key: string]: any
}

interface Category {
  "Document ID": string
  id: string
  title: string
}

interface ColumnSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default?: string | null
}

interface EditSubcategoryModalProps {
  isOpen: boolean
  onClose: () => void
  subcategoryInitial: SubcategoryForModal | null
  categories: Category[]
  onSuccess: () => void
}

export function EditSubcategoryModal({
  isOpen,
  onClose,
  subcategoryInitial,
  categories,
  onSuccess,
}: EditSubcategoryModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<SubcategoryForModal>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [tableSchema, setTableSchema] = useState<ColumnSchema[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isLoadingSubcategory, setIsLoadingSubcategory] = useState(false)
  const [imageUploadKey, setImageUploadKey] = useState(0)

  console.log("EditSubcategoryModal rendered:", {
    isOpen,
    subcategoryId: subcategoryInitial?.id,
    categoriesCount: categories.length,
    formDataPhotoUrl: formData.photourl,
  })

  const fetchSubcategoryDetails = useCallback(async (subcategoryIdValue: string) => {
    if (!subcategoryIdValue) return
    setIsLoadingSubcategory(true)
    setError(null)
    try {
      console.log(`Fetching details for subcategory ID: ${subcategoryIdValue}`)
      const response = await fetch(`/api/admin/subcategories?id=${subcategoryIdValue}`)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to fetch subcategory details. Status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Fetched subcategory data from API:", data)
      if (data.subcategories && data.subcategories.length > 0) {
        const fetchedSubcategory = data.subcategories[0]
        console.log("Setting formData with photourl:", fetchedSubcategory.photourl)
        setFormData({
          ...fetchedSubcategory,
          deleted: typeof fetchedSubcategory.deleted === "boolean" ? fetchedSubcategory.deleted : false,
        })
        setImageUploadKey((prev) => prev + 1)
      } else {
        throw new Error("Subcategory not found.")
      }
    } catch (err) {
      console.error("Error fetching subcategory details:", err)
      setError(err instanceof Error ? err.message : "Could not load subcategory data.")
    } finally {
      setIsLoadingSubcategory(false)
    }
  }, [])

  useEffect(() => {
    console.log("EditSubcategoryModal useEffect triggered:", { isOpen, subcategoryInitial })
    if (isOpen && subcategoryInitial) {
      fetchSubcategoryDetails(subcategoryInitial.id)
      fetchTableSchema()
      setSuccessMessage(null)
      setError(null)
    } else {
      setFormData({})
      setImageUploadKey(0)
    }
  }, [isOpen, subcategoryInitial, fetchSubcategoryDetails])

  const fetchTableSchema = async () => {
    setIsLoadingSchema(true)
    try {
      const response = await fetch("/api/admin/schema?table=subcategories")
      if (!response.ok) throw new Error("Failed to fetch table schema")
      const data = await response.json()
      if (data.success && Array.isArray(data.columns)) {
        setTableSchema(data.columns)
      } else {
        setTableSchema([])
        setError(data.error || "Could not load table schema.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading schema.")
      setTableSchema([])
    } finally {
      setIsLoadingSchema(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | number | boolean | null = value

    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked
    } else if (type === "number") {
      processedValue = value === "" ? null : Number.parseFloat(value)
      if (isNaN(processedValue as number)) processedValue = null
    }

    console.log(`Field ${name} changed to:`, processedValue)
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleSelectChange = (name: string, val: string, isBoolean = false) => {
    let processedValue: string | boolean | null = val
    if (isBoolean) {
      processedValue = val === "true"
    } else if (val === "null") {
      processedValue = null
    }

    console.log(`Select field ${name} changed to:`, processedValue)
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleImageUploadSuccess = (url: string) => {
    console.log("Image uploaded successfully, new URL:", url)
    setFormData((prev) => {
      const updated = { ...prev, photourl: url }
      console.log("Updated formData with new photourl:", updated)
      return updated
    })

    toast({
      title: "Снимката е качена успешно",
      description: "Снимката беше качена и обновена в базата данни.",
    })

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000)
  }

  const handleImageUploadError = (error: string) => {
    console.error("Image upload error:", error)
    setError(`Грешка при качване на снимката: ${error}`)

    // Clear error message after 5 seconds
    setTimeout(() => {
      setError(null)
    }, 5000)
  }

  const handleSeoFieldChange = (name: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategoryInitial || !subcategoryInitial.id) {
      setError("Грешка: Липсва ID на подкатегорията за обновяване.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    // Create a clean payload, ensuring we don't include undefined values
    const cleanFormData = Object.fromEntries(Object.entries(formData).filter(([_, value]) => value !== undefined))

    const payload = {
      ...cleanFormData,
      id: subcategoryInitial.id,
    }

    // Remove Document ID from payload
    if (payload["Document ID"]) {
      delete payload["Document ID"]
    }

    console.log("Submitting update with payload:", JSON.stringify(payload, null, 2))

    try {
      const response = await fetch(`/api/admin/subcategories/${subcategoryInitial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log("Update API response:", result)

      if (response.ok && result.success) {
        setSuccessMessage("Подкатегорията е обновена успешно!")

        toast({
          title: "Успешно обновяване",
          description: "Подкатегорията беше обновена успешно.",
        })

        onSuccess()
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || "Възникна грешка при обновяване на подкатегорията.")

        toast({
          title: "Грешка",
          description: result.error || "Възникна грешка при обновяване на подкатегорията.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error updating subcategory:", err)
      const errorMessage = err instanceof Error ? err.message : "Неочаквана грешка при обновяване."
      setError(errorMessage)

      toast({
        title: "Грешка",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderInputField = (col: ColumnSchema) => {
    const commonProps = {
      id: `edit-subcategory-${col.column_name}`,
      name: col.column_name,
      className: "bg-white border-gray-300 text-black",
      required: col.is_nullable === "NO" && !col.column_default,
    }

    const value = formData[col.column_name]

    // Special handling for photourl field - use ImageUpload component
    if (col.column_name === "photourl") {
      return (
        <ImageUpload
          key={imageUploadKey}
          currentImageUrl={value || null}
          onImageUploaded={handleImageUploadSuccess}
          onError={handleImageUploadError}
          uploadUrl="/api/admin/subcategories/upload-image"
          aspectRatio="square"
          className="w-full"
          subcategoryId={subcategoryInitial?.id}
        />
      )
    }

    if (col.data_type.toLowerCase().includes("bool")) {
      return (
        <Select
          name={col.column_name}
          value={typeof value === "boolean" ? String(value) : value === null ? "null" : ""}
          onValueChange={(val) => handleSelectChange(col.column_name, val, true)}
        >
          <SelectTrigger className={commonProps.className}>
            <SelectValue placeholder="Избери стойност" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Да / Активен / Вярно</SelectItem>
            <SelectItem value="false">Не / Неактивен / Грешно</SelectItem>
            {col.is_nullable === "YES" && <SelectItem value="null">(празно)</SelectItem>}
          </SelectContent>
        </Select>
      )
    } else if (col.data_type.toLowerCase().includes("text")) {
      return (
        <Textarea
          {...commonProps}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={handleInputChange}
          rows={3}
        />
      )
    } else if (
      col.data_type.toLowerCase().includes("int") ||
      col.data_type.toLowerCase().includes("numeric") ||
      col.data_type.toLowerCase().includes("decimal") ||
      col.data_type.toLowerCase().includes("float") ||
      col.data_type.toLowerCase().includes("double")
    ) {
      return (
        <Input
          {...commonProps}
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={handleInputChange}
          step={col.data_type.includes("int") ? "1" : "any"}
        />
      )
    } else if (col.data_type.toLowerCase().includes("date") || col.data_type.toLowerCase().includes("time")) {
      const inputType = col.data_type.toLowerCase().includes("timestamp") ? "datetime-local" : "date"
      let formattedValue = ""
      if (value) {
        try {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            if (inputType === "date") {
              formattedValue = date.toISOString().split("T")[0]
            } else {
              const year = date.getFullYear()
              const month = (date.getMonth() + 1).toString().padStart(2, "0")
              const day = date.getDate().toString().padStart(2, "0")
              const hours = date.getHours().toString().padStart(2, "0")
              const minutes = date.getMinutes().toString().padStart(2, "0")
              formattedValue = `${year}-${month}-${day}T${hours}:${minutes}`
            }
          }
        } catch (e) {
          /* ignore */
        }
      }
      return (
        <Input
          {...commonProps}
          type={inputType}
          value={formattedValue}
          onChange={handleInputChange}
          disabled={col.column_name === "createdat" || col.column_name === "updatedat"}
        />
      )
    }
    return (
      <Input
        {...commonProps}
        type="text"
        value={value === null || value === undefined ? "" : String(value)}
        onChange={handleInputChange}
        disabled={col.column_name === "Document ID"}
      />
    )
  }

  console.log("Rendering modal with isOpen:", isOpen)

  if (!isOpen) {
    console.log("Modal not open, returning null")
    return null
  }

  const currentTitle = subcategoryInitial?.title || (formData.title as string) || ""

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange called with:", open)
        if (!open) onClose()
      }}
    >
      <DialogContent className="bg-white border-gray-200 text-black max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-white pb-4 border-b border-gray-100">
          <DialogTitle>Редактиране на подкатегория: {currentTitle}</DialogTitle>
          {subcategoryInitial && <DialogDescription>ID: {subcategoryInitial.id}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow py-4 pr-2 space-y-6">
          {isLoadingSchema || isLoadingSubcategory ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="ml-2">Зареждане на данни...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Core Fields Section */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Основна информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-subcategory-cateid" className="text-sm font-medium">
                        Категория *
                      </Label>
                      <Select
                        name="cateid"
                        value={formData.cateid || ""}
                        onValueChange={(val) => handleSelectChange("cateid", val)}
                        required
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-black">
                          <SelectValue placeholder="Избери категория" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(categories) && categories.length > 0 ? (
                            categories.map((cat) => (
                              <SelectItem key={cat["Document ID"]} value={cat["Document ID"]}>
                                {cat.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              Няма налични категории
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-subcategory-title" className="text-sm font-medium">
                        Име на подкатегорията *
                      </Label>
                      <Input
                        id="edit-subcategory-title"
                        name="title"
                        value={formData.title || ""}
                        onChange={handleInputChange}
                        required
                        className="bg-white border-gray-300 text-black"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="edit-subcategory-description" className="text-sm font-medium">
                      Описание
                    </Label>
                    <Textarea
                      id="edit-subcategory-description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      className="bg-white border-gray-300 text-black min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Image Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Изображение</h3>
                  <div>
                    <Label className="text-sm font-medium">Снимка на подкатегорията</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Поддържани формати: JPG, PNG, GIF. Максимален размер: 5MB
                    </p>
                    <ImageUpload
                      key={imageUploadKey}
                      currentImageUrl={formData.photourl || null}
                      onImageUploaded={handleImageUploadSuccess}
                      onError={handleImageUploadError}
                      uploadUrl="/api/admin/subcategories/upload-image"
                      aspectRatio="square"
                      className="w-full"
                      subcategoryId={subcategoryInitial?.id}
                    />
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Статус</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-subcategory-deleted-checkbox"
                      name="deleted"
                      checked={formData.deleted === false}
                      onChange={(e) => setFormData((prev) => ({ ...prev, deleted: !e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <Label htmlFor="edit-subcategory-deleted-checkbox" className="text-sm font-normal text-gray-700">
                      Активна (маркирай, ако подкатегорията е активна)
                    </Label>
                  </div>
                </div>
              </div>

              {/* SEO Fields Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <SeoFields
                  formData={formData}
                  onChange={handleSeoFieldChange}
                />
              </div>

              {/* Dynamic Fields from Database Schema - excludes SEO fields */}
              {Array.isArray(tableSchema) && tableSchema.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Допълнителни полета от базата данни</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {tableSchema
                      .filter(
                        (col) =>
                          ![
                            "Document ID",
                            "cateid",
                            "title",
                            "description",
                            "photourl",
                            "deleted",
                            "createdat",
                            "updatedat",
                          ].includes(col.column_name) && !col.column_name.startsWith("seo_"),
                      )
                      .map((col) => (
                        <div key={col.column_name} className="space-y-1">
                          <Label
                            htmlFor={`edit-subcategory-${col.column_name}`}
                            className="text-sm font-medium capitalize"
                          >
                            {col.column_name.replace(/_/g, " ")}
                            {col.is_nullable === "NO" && !col.column_default && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          {renderInputField(col)}
                          <p className="text-xs text-gray-500">
                            Тип: <span className="font-mono">{col.data_type}</span>
                            {col.column_default && (
                              <span className="font-mono">, По подразбиране: {col.column_default}</span>
                            )}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* System Information Section */}
              {Array.isArray(tableSchema) && tableSchema.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Системна информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {tableSchema
                      .filter((col) => ["Document ID", "createdat", "updatedat"].includes(col.column_name))
                      .map((col) => (
                        <div key={col.column_name} className="space-y-1">
                          <Label
                            htmlFor={`edit-subcategory-${col.column_name}`}
                            className="text-sm font-medium capitalize"
                          >
                            {col.column_name === "Document ID"
                              ? "ID"
                              : col.column_name === "createdat"
                                ? "Създадена на"
                                : "Обновена на"}
                          </Label>
                          {renderInputField(col)}
                          <p className="text-xs text-gray-500">
                            Тип: <span className="font-mono">{col.data_type}</span> (само за четене)
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mt-4">
              {successMessage}
            </div>
          )}
        </form>

        <DialogFooter className="sticky bottom-0 z-10 bg-white pt-4 border-t border-gray-100 mt-auto">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Отказ
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingSchema || isLoadingSubcategory || !formData.title || !formData.cateid}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Запазване...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Запази промените
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
