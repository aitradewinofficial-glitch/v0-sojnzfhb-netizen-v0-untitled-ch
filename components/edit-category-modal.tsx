"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateCategory } from "@/lib/actions"
import { Save, Loader2, AlertTriangle, Info, RefreshCw } from "lucide-react"

interface Column {
  column_name: string
  data_type: string
  is_nullable: string
}

interface Category {
  id: string
  title: string
  description?: string
  photourl?: string
  pricefrom?: string | number
  wholesalerpricefrom?: string | number
  retailerpricefrom?: string | number
  [key: string]: any // Това позволява всякакви допълнителни полета
}

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSuccess: () => void
}

export function EditCategoryModal({ isOpen, onClose, category, onSuccess }: EditCategoryModalProps) {
  const [formData, setFormData] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)

  // Зареждане на схемата на таблицата
  useEffect(() => {
    if (isOpen) {
      fetchTableSchema()
    }
  }, [isOpen])

  // Извличане на схемата на таблицата
  const fetchTableSchema = async () => {
    setIsLoadingSchema(true)
    try {
      const response = await fetch("/api/admin/schema?table=categories")
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data = await response.json()
      if (data.columns && Array.isArray(data.columns)) {
        setColumns(data.columns)
        console.log("Заредени колони от базата данни:", data.columns)
      }
    } catch (error) {
      console.error("Error fetching schema:", error)
      setError(
        `Грешка при зареждане на схемата на таблицата: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
      )
    } finally {
      setIsLoadingSchema(false)
    }
  }

  // Инициализиране на формата при отваряне на модалния прозорец
  useEffect(() => {
    if (category) {
      setFormData({
        ...category,
      })
    }
  }, [category])

  // Обработка на промените във формата
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  // Тестване на връзката с базата данни
  const testDbConnection = async () => {
    try {
      setDebugInfo("Тестване на връзката с базата данни...")
      const response = await fetch("/api/admin/test-db")

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        setDebugInfo(`Грешка от сървъра (${response.status}): ${errorText}`)
        return
      }

      try {
        const result = await response.json()

        if (result.success) {
          setDebugInfo(`Връзката с базата данни е успешна: ${result.message}`)
        } else {
          setDebugInfo(`Грешка при тестване на връзката с базата данни: ${result.error}`)
        }
      } catch (jsonError) {
        setDebugInfo(
          `Грешка при обработка на JSON отговора: ${jsonError instanceof Error ? jsonError.message : "Неизвестна грешка"}`,
        )
      }
    } catch (error) {
      setDebugInfo(
        `Грешка при тестване на връзката с базата данни: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
      )
    }
  }

  // Зареждане на пълните данни за категорията
  const loadFullCategoryData = async () => {
    if (!category || !category.id) return

    try {
      setDebugInfo("Зареждане на пълните данни за категорията...")
      const response = await fetch(`/api/admin/categories?id=${category.id}`)

      if (!response.ok) {
        const errorText = await response.text()
        setDebugInfo(`Грешка от сървъра (${response.status}): ${errorText}`)
        return
      }

      try {
        const result = await response.json()

        if (result && result.categories && Array.isArray(result.categories) && result.categories.length > 0) {
          const fullCategory = result.categories[0]
          setFormData(fullCategory)
          setDebugInfo(`Данните за категорията са заредени успешно. ID: ${fullCategory.id}`)
          console.log("Заредени пълни данни за категорията:", fullCategory)
        } else {
          setDebugInfo(`Не са намерени данни за категория с ID: ${category.id}`)
        }
      } catch (jsonError) {
        setDebugInfo(
          `Грешка при обработка на JSON отговора: ${jsonError instanceof Error ? jsonError.message : "Неизвестна грешка"}`,
        )
      }
    } catch (error) {
      console.error("Error loading full category data:", error)
      setDebugInfo(`Грешка при зареждане на данните: ${error instanceof Error ? error.message : "Неизвестна грешка"}`)
    }
  }

  // Изпращане на формата
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    try {
      // Валидация на задължителните полета
      if (!formData.id || !formData.title) {
        setError("ID и заглавие са задължителни полета")
        setIsSubmitting(false)
        return
      }

      const formDataObj = new FormData()

      // Добавяне на всички полета към FormData
      Object.entries(formData).forEach(([key, value]) => {
        // Пропускаме изчислените полета, които не са част от базата данни
        const skipFields = ["productCount", "subcategoryCount", "status", "slug"]

        if (!skipFields.includes(key) && value !== undefined && value !== null) {
          formDataObj.append(key, value.toString())
        }
      })

      // Логване на данните преди изпращане за дебъгване
      console.log("Изпращане на данни за категория:", {
        id: formData.id,
        title: formData.title,
      })

      const result = await updateCategory(formDataObj)

      if (result.success) {
        setSuccess("Категорията е обновена успешно!")

        // Проверяваме дали категорията наистина е обновена
        const checkResponse = await fetch(`/api/admin/categories?id=${formData.id}`)
        const checkResult = await checkResponse.json()

        if (
          checkResult &&
          checkResult.categories &&
          Array.isArray(checkResult.categories) &&
          checkResult.categories.length > 0
        ) {
          const updatedCategory = checkResult.categories[0]
          setDebugInfo(`Категорията е обновена в базата данни. Текуща стойност на заглавието: ${updatedCategory.title}`)
        } else {
          setDebugInfo("Категорията е обновена, но не можахме да потвърдим промените в базата данни.")
        }

        // Затваряне на модалния прозорец след кратко забавяне
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000)
      } else {
        setError(result.error || "Възникна грешка при запазване на категорията")
        setDebugInfo("Опитайте да тествате връзката с базата данни, за да видите дали има проблем с връзката.")
      }
    } catch (err) {
      console.error("Грешка при обновяване на категория:", err)
      setError("Възникна неочаквана грешка")
      setDebugInfo(`Детайли за грешката: ${err instanceof Error ? err.message : "Неизвестна грешка"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Проверка дали колоната е числова
  const isNumericColumn = (columnName: string) => {
    const column = columns.find((col) => col.column_name === columnName)
    const type = column?.data_type || ""
    return type.includes("int") || type.includes("float") || type.includes("numeric") || type.includes("decimal")
  }

  // Проверка дали колоната е дата
  const isDateColumn = (columnName: string) => {
    const column = columns.find((col) => col.column_name === columnName)
    const type = column?.data_type || ""
    return type.includes("date") || type.includes("time") || columnName === "createdat"
  }

  // Проверка дали колоната е булева
  const isBooleanColumn = (columnName: string) => {
    const column = columns.find((col) => col.column_name === columnName)
    const type = column?.data_type || ""
    return type.includes("bool")
  }

  // Получаване на заглавие на колона (с форматиране)
  const getColumnTitle = (columnName: string) => {
    // Специални случаи
    if (columnName === "id") return "ID"
    if (columnName === "createdat") return "Създадена на"
    if (columnName === "photourl") return "Снимка URL"
    if (columnName === "pricefrom") return "Цена от"
    if (columnName === "retailerpricefrom") return "Цена търговец от"
    if (columnName === "wholesalerpricefrom") return "Цена на едро от"
    if (columnName === "deleted") return "Изтрита"

    // Общо форматиране - първа буква главна, премахване на подчертавки
    return columnName.charAt(0).toUpperCase() + columnName.slice(1).replace(/_/g, " ")
  }

  // Филтриране на колоните, които не трябва да се показват във формата
  const getFormColumns = () => {
    // Колони, които не трябва да се показват във формата
    const skipColumns = [
      "Document ID", // Използваме id вместо Document ID
      "productCount",
      "subcategoryCount",
      "status",
      "slug",
    ]

    // Филтрираме колоните
    return columns.filter((col) => !skipColumns.includes(col.column_name))
  }

  // Групиране на колоните по секции
  const getMainColumns = () => {
    const mainColumnNames = ["id", "title", "description", "photourl"]
    return getFormColumns().filter((col) => mainColumnNames.includes(col.column_name))
  }

  const getPriceColumns = () => {
    const priceColumnNames = ["pricefrom", "retailerpricefrom", "wholesalerpricefrom"]
    return getFormColumns().filter((col) => priceColumnNames.includes(col.column_name))
  }

  const getAdditionalColumns = () => {
    const mainAndPriceColumnNames = [
      "id",
      "title",
      "description",
      "photourl",
      "pricefrom",
      "retailerpricefrom",
      "wholesalerpricefrom",
      "createdat",
      "deleted",
    ]
    return getFormColumns().filter((col) => !mainAndPriceColumnNames.includes(col.column_name))
  }

  if (!formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Редактиране на категория</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                <Button
                  variant="link"
                  className="text-red-400 hover:text-red-300 p-0 h-auto text-sm underline"
                  onClick={testDbConnection}
                  type="button"
                >
                  Тествай връзката с базата данни
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-md">{success}</div>
          )}

          {debugInfo && (
            <div className="bg-blue-900/30 border border-blue-800 text-blue-400 px-4 py-3 rounded-md text-sm font-mono">
              {debugInfo}
            </div>
          )}

          {/* Бутон за зареждане на пълните данни */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-blue-700 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
              onClick={loadFullCategoryData}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Зареди всички колони
            </Button>
          </div>

          {isLoadingSchema ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <p className="text-gray-400">Зареждане на схемата на таблицата...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Основни полета */}
              <div>
                <h3 className="text-lg font-medium mb-4 border-b border-gray-800 pb-2">Основна информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {getMainColumns().map((column) => {
                      if (column.column_name === "description") {
                        return (
                          <div key={column.column_name}>
                            <Label htmlFor={column.column_name}>
                              {getColumnTitle(column.column_name)}
                              {column.is_nullable === "NO" && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Textarea
                              id={column.column_name}
                              name={column.column_name}
                              value={formData[column.column_name] || ""}
                              onChange={handleChange}
                              rows={5}
                              className="bg-gray-800 border-gray-700 text-white"
                              required={column.is_nullable === "NO"}
                            />
                          </div>
                        )
                      }

                      return (
                        <div key={column.column_name}>
                          <Label htmlFor={column.column_name}>
                            {getColumnTitle(column.column_name)}
                            {column.is_nullable === "NO" && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Input
                            id={column.column_name}
                            name={column.column_name}
                            type={column.column_name === "id" ? "text" : "text"}
                            value={formData[column.column_name] || ""}
                            onChange={handleChange}
                            className="bg-gray-800 border-gray-700 text-white"
                            required={column.is_nullable === "NO"}
                            readOnly={column.column_name === "id"}
                          />
                        </div>
                      )
                    })}

                    {formData.photourl && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-400 mb-2">Преглед на снимката:</p>
                        <div className="w-32 h-32 bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                          <img
                            src={formData.photourl || "/placeholder.svg"}
                            alt="Category preview"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Ценови полета */}
                    <h4 className="text-md font-medium text-gray-400">Ценова информация</h4>
                    {getPriceColumns().map((column) => (
                      <div key={column.column_name}>
                        <Label htmlFor={column.column_name}>
                          {getColumnTitle(column.column_name)}
                          {column.is_nullable === "NO" && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={column.column_name}
                          name={column.column_name}
                          type={isNumericColumn(column.column_name) ? "number" : "text"}
                          step={
                            column.data_type.includes("numeric") || column.data_type.includes("decimal") ? "0.01" : "1"
                          }
                          value={formData[column.column_name] || ""}
                          onChange={handleChange}
                          className="bg-gray-800 border-gray-700 text-white"
                          required={column.is_nullable === "NO"}
                        />
                      </div>
                    ))}

                    {/* Статус */}
                    <div>
                      <Label htmlFor="deleted">Статус</Label>
                      <select
                        id="deleted"
                        name="deleted"
                        value={formData.deleted ? "true" : "false"}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="false">Активна</option>
                        <option value="true">Деактивирана</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Допълнителни полета */}
              {getAdditionalColumns().length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4 border-b border-gray-800 pb-2">Допълнителна информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAdditionalColumns().map((column) => {
                      // Пропускаме createdat и deleted, тъй като ги обработваме отделно
                      if (column.column_name === "createdat" || column.column_name === "deleted") {
                        return null
                      }

                      if (column.data_type.includes("text") && column.column_name.includes("description")) {
                        return (
                          <div key={column.column_name} className="md:col-span-2">
                            <Label htmlFor={column.column_name}>
                              {getColumnTitle(column.column_name)}
                              {column.is_nullable === "NO" && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Textarea
                              id={column.column_name}
                              name={column.column_name}
                              value={formData[column.column_name] || ""}
                              onChange={handleChange}
                              rows={3}
                              className="bg-gray-800 border-gray-700 text-white"
                              required={column.is_nullable === "NO"}
                            />
                          </div>
                        )
                      }

                      if (isBooleanColumn(column.column_name)) {
                        return (
                          <div key={column.column_name}>
                            <Label htmlFor={column.column_name}>
                              {getColumnTitle(column.column_name)}
                              {column.is_nullable === "NO" && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <select
                              id={column.column_name}
                              name={column.column_name}
                              value={formData[column.column_name] ? "true" : "false"}
                              onChange={handleChange}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              required={column.is_nullable === "NO"}
                            >
                              <option value="false">Не</option>
                              <option value="true">Да</option>
                            </select>
                          </div>
                        )
                      }

                      return (
                        <div key={column.column_name}>
                          <Label htmlFor={column.column_name}>
                            {getColumnTitle(column.column_name)}
                            {column.is_nullable === "NO" && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Input
                            id={column.column_name}
                            name={column.column_name}
                            type={
                              isNumericColumn(column.column_name)
                                ? "number"
                                : isDateColumn(column.column_name)
                                  ? "date"
                                  : "text"
                            }
                            step={
                              column.data_type.includes("numeric") || column.data_type.includes("decimal")
                                ? "0.01"
                                : "1"
                            }
                            value={
                              isDateColumn(column.column_name) && formData[column.column_name]
                                ? new Date(formData.createdat).toISOString().slice(0, 16)
                                : formData[column.column_name] || ""
                            }
                            onChange={handleChange}
                            className="bg-gray-800 border-gray-700 text-white"
                            required={column.is_nullable === "NO"}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Системна информация */}
              <div>
                <h3 className="text-lg font-medium mb-4 border-b border-gray-800 pb-2">Системна информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="createdat">Дата на създаване</Label>
                    <Input
                      id="createdat"
                      name="createdat"
                      type="datetime-local"
                      value={formData.createdat ? new Date(formData.createdat).toISOString().slice(0, 16) : ""}
                      onChange={handleChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCount">Брой продукти</Label>
                    <Input
                      id="productCount"
                      value={formData.productCount || 0}
                      className="bg-gray-800 border-gray-700 text-white"
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="subcategoryCount">Брой подкатегории</Label>
                    <Input
                      id="subcategoryCount"
                      value={formData.subcategoryCount || 0}
                      className="bg-gray-800 border-gray-700 text-white"
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Отказ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={testDbConnection}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 mr-2"
            >
              <Info className="h-4 w-4 mr-2" /> Тествай връзката
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Запази промените
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
