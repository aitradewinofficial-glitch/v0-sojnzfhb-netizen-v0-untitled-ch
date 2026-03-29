"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { useRouter } from "next/navigation"
import { RefreshCw, Save, ArrowLeft, AlertTriangle } from "lucide-react"
import { SeoFields } from "@/components/seo-fields"

interface ColumnSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default?: string | null
}

interface CategoryData {
  [key: string]: any
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<CategoryData>({})
  const [tableSchema, setTableSchema] = useState<ColumnSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const router = useRouter()
  const { id } = params

  // Fetch table schema
  const fetchTableSchema = async () => {
    try {
      setIsLoadingSchema(true)
      setError(null)
      const response = await fetch("/api/admin/schema?table=categories")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success && data.columns) {
        setTableSchema(data.columns)
        console.log("Loaded table schema:", data.columns)
      } else {
        console.error("Failed to fetch table schema:", data.error)
        setError(data.error || "Неуспешно зареждане на схема за таблица categories.")
        setTableSchema([])
      }
    } catch (err) {
      console.error("Error fetching table schema:", err)
      setError(`Грешка при зареждане на схема: ${err instanceof Error ? err.message : String(err)}`)
      setTableSchema([])
    } finally {
      setIsLoadingSchema(false)
    }
  }

  // Fetch category data
  const fetchCategory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/categories?id=${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data.categories && data.categories.length > 0) {
        const category = data.categories[0]
        setFormData(category)
        console.log("Loaded category data:", category)
      } else {
        setError("Категорията не беше намерена.")
      }
    } catch (err) {
      console.error("Error fetching category:", err)
      setError("Грешка при зареждане на данните. Моля, опитайте отново.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTableSchema()
    fetchCategory()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | number | boolean | null = value

    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked
    } else if (type === "number") {
      processedValue = value === "" ? null : Number.parseFloat(value)
      if (isNaN(processedValue as number)) processedValue = null
    }

    console.log(`Updating field ${name} to:`, processedValue)
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleSelectChange = (name: string, val: string, isBoolean = false) => {
    let processedValue: any = val
    if (val === "null") {
      processedValue = null
    } else if (isBoolean) {
      processedValue = val === "true"
    }
    console.log(`Updating select field ${name} to:`, processedValue)
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleImageUploaded = (url: string) => {
    console.log("Image uploaded, URL:", url)
    setFormData((prev) => ({ ...prev, photourl: url }))
    setSuccess("Снимката беше качена успешно!")
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSeoFieldChange = (name: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUploadError = (errorMessage: string) => {
    console.error("Image upload error:", errorMessage)
    setError(`Грешка при качване на снимка: ${errorMessage}`)
    // Clear error message after 5 seconds
    setTimeout(() => setError(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("=== Submitting Category Update ===")
      console.log("Category ID:", id)
      console.log("Form data to submit:", formData)

      const response = await fetch("/api/admin/categories/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          ...formData,
        }),
      })

      console.log("Update response status:", response.status)

      const data = await response.json()
      console.log("Update response data:", data)

      if (response.ok && data.success) {
        setSuccess("Категорията беше обновена успешно!")
        setTimeout(() => {
          router.push("/admin-panel/categories")
        }, 2000)
      } else {
        setError(data.error || "Грешка при обновяване на категорията.")
      }
    } catch (err) {
      console.error("Error updating category:", err)
      const errorMessage = err instanceof Error ? err.message : "Грешка при обновяване на категорията."
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const renderInputField = (col: ColumnSchema) => {
    const commonProps = {
      id: `edit-category-${col.column_name}`,
      name: col.column_name,
      className: "w-full mt-1 bg-white border-gray-300 text-black",
      required: col.is_nullable === "NO" && !col.column_default,
    }
    const value = formData[col.column_name]

    // Special handling for photourl field - use ImageUpload component
    if (col.column_name === "photourl") {
      return (
        <ImageUpload
          currentImageUrl={value}
          onImageUploaded={handleImageUploaded}
          onError={handleImageUploadError}
          uploadUrl="/api/admin/categories/upload-image"
          aspectRatio="landscape"
          className="w-full"
        />
      )
    }

    if (col.data_type.toLowerCase().includes("bool")) {
      return (
        <Select
          name={col.column_name}
          value={typeof value === "boolean" ? String(value) : value === null || value === undefined ? "" : "null"}
          onValueChange={(val) => handleSelectChange(col.column_name, val, true)}
        >
          <SelectTrigger className={commonProps.className}>
            <SelectValue placeholder="Избери стойност" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Да / Активен / Вярно</SelectItem>
            <SelectItem value="false">Не / Неактивен / Грешно</SelectItem>
            {col.is_nullable === "YES" && <SelectItem value="null">(празно/NULL)</SelectItem>}
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
              formattedValue = date.toISOString().slice(0, 16)
            }
          }
        } catch (e) {
          console.warn("Could not parse date for input:", value)
        }
      }
      return <Input {...commonProps} type={inputType} value={formattedValue} onChange={handleInputChange} />
    }
    return (
      <Input
        {...commonProps}
        type="text"
        value={value === null || value === undefined ? "" : String(value)}
        onChange={handleInputChange}
      />
    )
  }

  if (loading || isLoadingSchema) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
        <span className="ml-2 text-gray-600">Зареждане...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Редактиране на категория</h1>
        <Button variant="outline" onClick={() => router.push("/admin-panel/categories")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад към категории
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Информация за категорията: {formData.title || "Неизвестна"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Fields Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b border-gray-200 pb-2">Основна информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableSchema
                  .filter((col) =>
                    ["Document ID", "title", "title_en", "description", "description_en"].includes(col.column_name),
                  )
                  .map((col) => (
                    <div key={`main-${col.column_name}`} className="space-y-1">
                      <Label
                        htmlFor={`edit-category-${col.column_name}`}
                        className="text-sm font-medium capitalize text-gray-700"
                      >
                        {col.column_name === "Document ID"
                          ? "ID"
                          : col.column_name === "title"
                            ? "Загла��ие"
                            : col.column_name === "title_en"
                              ? "Заглавие (EN)"
                              : col.column_name === "description"
                                ? "Описание"
                                : col.column_name === "description_en"
                                  ? "Описание (EN)"
                                  : col.column_name.replace(/_/g, " ")}
                        {col.is_nullable === "NO" && !col.column_default && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {col.column_name === "Document ID" ? (
                        <Input
                          {...{
                            id: `edit-category-${col.column_name}`,
                            name: col.column_name,
                            className: "w-full mt-1 bg-gray-100 border-gray-300 text-gray-500",
                            value: formData[col.column_name] || "",
                            readOnly: true,
                            disabled: true,
                          }}
                        />
                      ) : (
                        renderInputField(col)
                      )}
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

            {/* Price Fields Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b border-gray-200 pb-2">Ценова информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tableSchema
                  .filter((col) => ["pricefrom", "wholesalerpricefrom", "retailerpricefrom"].includes(col.column_name))
                  .map((col) => (
                    <div key={`price-${col.column_name}`} className="space-y-1">
                      <Label
                        htmlFor={`edit-category-${col.column_name}`}
                        className="text-sm font-medium capitalize text-gray-700"
                      >
                        {col.column_name === "pricefrom"
                          ? "Цена от"
                          : col.column_name === "wholesalerpricefrom"
                            ? "Цена на едро от"
                            : col.column_name === "retailerpricefrom"
                              ? "Цена на дrebno от"
                              : col.column_name.replace(/_/g, " ")}
                        {col.is_nullable === "NO" && !col.column_default && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {renderInputField(col)}
                      <p className="text-xs text-gray-500">
                        Тип: <span className="font-mono">{col.data_type}</span>
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Image Field */}
            {tableSchema.find((col) => col.column_name === "photourl") && (
              <div>
                <h3 className="text-lg font-medium mb-4 border-b border-gray-200 pb-2">Изображение</h3>
                <div className="space-y-1">
                  <Label htmlFor="edit-category-photourl" className="text-sm font-medium text-gray-700">
                    Снимка на категорията
                    {tableSchema.find((col) => col.column_name === "photourl")?.is_nullable === "NO" && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  {renderInputField(tableSchema.find((col) => col.column_name === "photourl")!)}
                  <p className="text-xs text-gray-500 mt-2">
                    Поддържани формати: JPG, PNG, GIF. Максимален размер: 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Status Field */}
            {tableSchema.find((col) => col.column_name === "deleted") && (
              <div>
                <h3 className="text-lg font-medium mb-4 border-b border-gray-200 pb-2">Статус</h3>
                <div className="space-y-1">
                  <Label htmlFor="edit-category-deleted" className="text-sm font-medium text-gray-700">
                    Статус на категорията
                  </Label>
                  {renderInputField(tableSchema.find((col) => col.column_name === "deleted")!)}
                  <p className="text-xs text-gray-500">
                    Тип:{" "}
                    <span className="font-mono">
                      {tableSchema.find((col) => col.column_name === "deleted")?.data_type}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Additional Fields Section - excludes SEO fields which have their own section */}
            {tableSchema.filter(
              (col) =>
                ![
                  "Document ID",
                  "title",
                  "title_en",
                  "description",
                  "description_en",
                  "pricefrom",
                  "wholesalerpricefrom",
                  "retailerpricefrom",
                  "photourl",
                  "deleted",
                  "createdat",
                  "updatedat",
                ].includes(col.column_name) && !col.column_name.startsWith("seo_"),
            ).length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 border-b border-gray-200 pb-2">Допълнителни полета</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tableSchema
                    .filter(
                      (col) =>
                        ![
                          "Document ID",
                          "title",
                          "title_en",
                          "description",
                          "description_en",
                          "pricefrom",
                          "wholesalerpricefrom",
                          "retailerpricefrom",
                          "photourl",
                          "deleted",
                          "createdat",
                          "updatedat",
                        ].includes(col.column_name) && !col.column_name.startsWith("seo_"),
                    )
                    .map((col) => (
                      <div key={`additional-${col.column_name}`} className="space-y-1">
                        <Label
                          htmlFor={`edit-category-${col.column_name}`}
                          className="text-sm font-medium capitalize text-gray-700"
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

            {/* SEO Fields Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <SeoFields
                formData={formData}
                onChange={handleSeoFieldChange}
              />
            </div>

            {/* System Fields (Read-only) */}
            {tableSchema.filter((col) => ["createdat", "updatedat"].includes(col.column_name)).length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 border-b border-gray-200 pb-2">Системна информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tableSchema
                    .filter((col) => ["createdat", "updatedat"].includes(col.column_name))
                    .map((col) => (
                      <div key={`system-${col.column_name}`} className="space-y-1">
                        <Label
                          htmlFor={`edit-category-${col.column_name}`}
                          className="text-sm font-medium capitalize text-gray-700"
                        >
                          {col.column_name === "createdat"
                            ? "Създадена на"
                            : col.column_name === "updatedat"
                              ? "Обновена на"
                              : col.column_name.replace(/_/g, " ")}
                        </Label>
                        <Input
                          id={`edit-category-${col.column_name}`}
                          name={col.column_name}
                          className="w-full mt-1 bg-gray-100 border-gray-300 text-gray-500"
                          value={
                            formData[col.column_name] ? new Date(formData[col.column_name]).toLocaleString("bg-BG") : ""
                          }
                          readOnly
                          disabled
                        />
                        <p className="text-xs text-gray-500">
                          Тип: <span className="font-mono">{col.data_type}</span>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin-panel/categories")}
                  className="flex-1"
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.title}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Запазване...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Запази промените
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
