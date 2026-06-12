"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2, RefreshCw, ToggleLeft, ToggleRight, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditSubcategoryModal } from "@/components/edit-subcategory-modal"
import { AddSubcategoryModal } from "@/components/add-subcategory-modal"

interface Category {
  "Document ID": string // Primary identifier
  title: string
  description: string
  photourl: string
  // status: string // This might not be directly from API, review if needed - consider removing if not used
  deleted: boolean
  productCount?: number
  // id?: string; // Optional alias if needed for other components, but "Document ID" is canonical
}

interface Subcategory {
  id: string
  cateid: string
  title: string
  description?: string | null
  photourl?: string | null
  deleted: boolean
  productCount?: number
  categoryTitle?: string
  [key: string]: any
}

interface ColumnSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default?: string | null
}

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState("categories")
  const [allCategories, setAllCategories] = useState<Category[]>([]) // Renamed for clarity
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const router = useRouter()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")

  const [isEditSubcategoryModalOpen, setIsEditSubcategoryModalOpen] = useState(false)
  const [subcategoryToEdit, setSubcategoryToEdit] = useState<Subcategory | null>(null)

  const initialNewCategoryState = {
    title: "",
    title_en: "",
    description: "",
    description_en: "",
    photourl: "",
    deleted: false,
  }
  const [newCategory, setNewCategory] = useState<{ [key: string]: any }>(initialNewCategoryState)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [categoryTableSchema, setCategoryTableSchema] = useState<ColumnSchema[]>([])
  // const [subcategoryTableSchema, setSubcategoryTableSchema] = useState<ColumnSchema[]>([]) // Not used in this simplified version
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)

  const [isNewAddSubcategoryModalOpen, setIsNewAddSubcategoryModalOpen] = useState(false)

  const fetchCategories = async () => {
    // console.log("Fetching categories...");
    try {
      setError(null)
      const response = await fetch(`/api/admin/categories?limit=1000&search=${searchTerm}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      // console.log("Fetched categories data:", data);
      if (data.success && Array.isArray(data.categories)) {
        // Ensure the data from API (which has 'id') is mapped correctly if other parts expect 'Document ID'
        // For the new modal, we just need 'id' and 'title'.
        const mappedCategories = data.categories.map((cat: any) => ({
          ...cat,
          "Document ID": cat.id, // Ensure "Document ID" is populated with the correct UUID
        }))
        setAllCategories(mappedCategories)
      } else {
        setAllCategories([])
        setError(data.error || "Неуспешно зареждане на категориите.")
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
      setAllCategories([])
      setError("Грешка при зареждане на категориите. Моля, опитайте отново.")
    }
  }

  const fetchSubcategories = async () => {
    try {
      setLoading(true)
      setError(null)
      let url = `/api/admin/subcategories?limit=1000&search=${searchTerm}`
      if (selectedCategoryFilter !== "all") {
        url += `&categoryId=${selectedCategoryFilter}`
      }
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      const mappedSubcategories = (data.subcategories || []).map((sub: any) => ({
        ...sub,
        id: sub["Document ID"] || sub.id,
      }))
      setSubcategories(mappedSubcategories)
    } catch (err) {
      console.error("Error fetching subcategories:", err)
      setError("Грешка при зареждане на подкатегориите. Моля, опитайте отново.")
    } finally {
      setLoading(false)
    }
  }

  const fetchTableSchema = async (table: "categories" /*| "subcategories"*/) => {
    // Subcategories schema not needed for simplified modal
    try {
      setIsLoadingSchema(true)
      setModalError(null)
      const response = await fetch(`/api/admin/schema?table=${table}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success && data.columns) {
        if (table === "categories") setCategoryTableSchema(data.columns)
        // else setSubcategoryTableSchema(data.columns)
      } else {
        console.error("Failed to fetch table schema:", data.error)
        setModalError(data.error || `Неуспешно зареждане на схема за таблица ${table}.`)
        if (table === "categories") setCategoryTableSchema([])
        // else setSubcategoryTableSchema([])
      }
    } catch (err) {
      console.error("Error fetching table schema:", err)
      setModalError(`Грешка при зареждане на схема за ${table}: ${err instanceof Error ? err.message : String(err)}`)
      if (table === "categories") setCategoryTableSchema([])
      // else setSubcategoryTableSchema([])
    } finally {
      setIsLoadingSchema(false)
    }
  }

  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories()
    } else {
      fetchSubcategories()
      if (allCategories.length === 0) {
        fetchCategories()
      }
    }
  }, [searchTerm, activeTab, selectedCategoryFilter])

  useEffect(() => {
    // Fetch categories if modal is opened and categories are not loaded
    if ((isNewAddSubcategoryModalOpen || isEditSubcategoryModalOpen) && allCategories.length === 0) {
      fetchCategories()
    }
  }, [isNewAddSubcategoryModalOpen, isEditSubcategoryModalOpen, allCategories.length])

  useEffect(() => {
    if (isAddModalOpen) {
      fetchTableSchema("categories")
      setNewCategory(initialNewCategoryState)
      setModalError(null)
    }
  }, [isAddModalOpen])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>,
  ) => {
    const { name, value, type } = e.target
    let processedValue: string | number | boolean | null = value

    if (type === "checkbox") {
      if (name === "deleted") {
        processedValue = !(e.target as HTMLInputElement).checked
      } else {
        processedValue = (e.target as HTMLInputElement).checked
      }
    } else if (type === "number") {
      processedValue = value === "" ? null : Number.parseFloat(value)
      if (isNaN(processedValue as number)) processedValue = null
    }
    setState((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleSelectChange = (
    name: string,
    val: string,
    setState: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>,
    isBoolean = false,
  ) => {
    if (val === "null") {
      setState((prev) => ({ ...prev, [name]: null }))
    } else {
      setState((prev) => ({ ...prev, [name]: isBoolean ? val === "true" : val }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      setModalError(null)

      // Проверяваме размера на файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Файлът е твърде голям. Максимален размер: 5MB")
      }

      // Проверяваме типа на файла
      if (!file.type.startsWith("image/")) {
        throw new Error("Моля, изберете валиден файл с изображение")
      }

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/categories/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.url) {
        setNewCategory((prev) => ({ ...prev, photourl: data.url }))
      } else {
        throw new Error(data.error || "Грешка при качване на снимката")
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      setModalError(err instanceof Error ? err.message : "Грешка при качване на снимката")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      setModalLoading(true)
      setModalError(null)
      const response = await fetch("/api/admin/categories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }))
        throw new Error(errData.error)
      }
      const data = await response.json()
      if (data.success) {
        setIsAddModalOpen(false)
        fetchCategories()
      } else {
        setModalError(data.error || "Грешка при добавяне на категорията.")
      }
    } catch (err) {
      console.error("Error adding category:", err)
      setModalError(err instanceof Error ? err.message : "Грешка при добавяне на категорията.")
    } finally {
      setModalLoading(false)
    }
  }

  const renderInputField = (
    col: ColumnSchema,
    state: { [key: string]: any },
    setState: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>,
    modalPrefix: string,
  ) => {
    const commonProps = {
      id: `${modalPrefix}-${col.column_name}`,
      name: col.column_name,
      className: "w-full mt-1 bg-white border-gray-300 text-black",
      required: col.is_nullable === "NO" && !col.column_default,
    }
    const value = state[col.column_name]

    if (col.data_type.toLowerCase().includes("bool")) {
      return (
        <Select
          name={col.column_name}
          value={typeof value === "boolean" ? String(value) : value === null || value === undefined ? "" : "null"}
          onValueChange={(val) => handleSelectChange(col.column_name, val, setState, true)}
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
          onChange={(e) => handleInputChange(e, setState)}
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
          onChange={(e) => handleInputChange(e, setState)}
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
      return (
        <Input
          {...commonProps}
          type={inputType}
          value={formattedValue}
          onChange={(e) => handleInputChange(e, setState)}
        />
      )
    }
    return (
      <Input
        {...commonProps}
        type="text"
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => handleInputChange(e, setState)}
      />
    )
  }

  const openDeleteModal = (category: Category | null, subcategory: Subcategory | null) => {
    if (category) {
      setCategoryToDelete(category)
      setSubcategoryToDelete(null)
    } else if (subcategory) {
      setSubcategoryToDelete(subcategory)
      setCategoryToDelete(null)
    }
    setIsDeleteModalOpen(true)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    if (categoryToDelete) await handleDeleteCategory()
    else if (subcategoryToDelete) await handleDeleteSubcategory()
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    try {
      setDeleteLoading(true)
      setDeleteError(null)
      const documentId = categoryToDelete["Document ID"] // Use .id
      if (!documentId) {
        setDeleteError("ID на категорията липсва")
        setDeleteLoading(false)
        return
      }
      const response = await fetch("/api/admin/categories/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setIsDeleteModalOpen(false)
        setCategoryToDelete(null)
        setAllCategories((prev) => prev.filter((cat) => cat["Document ID"] !== documentId))
      } else {
        setDeleteError(data.error || "Грешка при изтриване на категорията.")
      }
    } catch (err) {
      setDeleteError(`Грешка: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteSubcategory = async () => {
    if (!subcategoryToDelete) return
    try {
      setDeleteLoading(true)
      setDeleteError(null)
      const documentId = subcategoryToDelete.id
      if (!documentId) {
        setDeleteError("ID на подкатегорията липсва")
        setDeleteLoading(false)
        return
      }
      const response = await fetch("/api/admin/subcategories/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setIsDeleteModalOpen(false)
        setSubcategoryToDelete(null)
        setSubcategories((prev) => prev.filter((sub) => sub.id !== documentId))
      } else {
        setDeleteError(data.error || "Грешка при изтриване на подкатегорията.")
      }
    } catch (err) {
      setDeleteError(`Грешка: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleCategoryStatus = async (category: Category, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/categories/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category["Document ID"], currentStatus }), // Use .id
      })
      const data = await response.json()
      if (data.success) fetchCategories()
      else setError(data.error || "Грешка при промяна на статуса.")
    } catch (err) {
      setError("Грешка при промяна на статуса.")
    }
  }

  const handleToggleSubcategoryStatus = async (subcategory: Subcategory, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/subcategories/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subcategory.id, currentStatus }),
      })
      const data = await response.json()
      if (data.success) fetchSubcategories()
      else setError(data.error || "Грешка при промяна на статуса.")
    } catch (err) {
      setError("Грешка при промяна на статуса.")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    if (activeTab === "categories") fetchCategories()
    else fetchSubcategories()
  }

  const openEditSubcategoryModal = (subcategory: Subcategory) => {
    const subcategoryWithId = { ...subcategory, id: subcategory["Document ID"] || subcategory.id }
    setSubcategoryToEdit(subcategoryWithId)
    setIsEditSubcategoryModalOpen(true)
    setModalError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Управление на категории</h1>
        <div className="flex gap-2">
          {activeTab === "categories" && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Добави категория
            </Button>
          )}
          {activeTab === "subcategories" && (
            <Button onClick={() => setIsNewAddSubcategoryModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Добави подкатегория
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="subcategories">Подкатегории</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <Card className="bg-white border-gray-200 text-black">
            <CardHeader>
              <CardTitle>Категории</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Търсене по име..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border-gray-300 text-black"
                  />
                  <Button type="submit" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      fetchCategories()
                    }}
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
              {loading && activeTab === "categories" ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : allCategories.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">Име</th>
                          <th className="text-left py-3 px-4">Статус</th>
                          <th className="text-left py-3 px-4">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCategories.map((category) => (
                          <tr key={category["Document ID"]} className="border-b border-gray-200 hover:bg-gray-50">
                            {" "}
                            {/* Use .id for key */}
                            <td className="py-3 px-4 font-medium">{category.title}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${category.deleted ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                              >
                                {category.deleted ? "Неактивна" : "Активна"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/admin-panel/categories/edit/${category["Document ID"]}`)} // Use .id
                                  title="Редактирай"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleCategoryStatus(category, category.deleted)}
                                  title={category.deleted ? "Активирай" : "Деактивирай"}
                                >
                                  {category.deleted ? (
                                    <ToggleRight className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:border-red-400 bg-transparent"
                                  onClick={() => openDeleteModal(category, null)}
                                  title="Изтрий"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end items-center mt-4">
                    <span className="text-sm text-gray-500">Показани са всички {allCategories.length} категории</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Няма намерени категории.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subcategories">
          <Card className="bg-white border-gray-200 text-black">
            <CardHeader>
              <CardTitle>Подкатегории</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Търсене по име..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white border-gray-300 text-black"
                    />
                    <Button type="submit" variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        fetchSubcategories()
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value={selectedCategoryFilter}
                    onValueChange={(value) => {
                      setSelectedCategoryFilter(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-black">
                      <SelectValue placeholder="Филтрирай по категория" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всички категории</SelectItem>
                      {allCategories.map(
                        (
                          category, // Use allCategories
                        ) => (
                          <SelectItem key={category["Document ID"]} value={category["Document ID"]}>
                            {" "}
                            {/* Use .id */}
                            {category.title}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
              {loading && activeTab === "subcategories" ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : subcategories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Снимка</th>
                        <th className="text-left py-3 px-4">Име</th>
                        <th className="text-left py-3 px-4">Категория</th>
                        <th className="text-left py-3 px-4">Описание</th>
                        <th className="text-left py-3 px-4">Продукти</th>
                        <th className="text-left py-3 px-4">Статус</th>
                        <th className="text-left py-3 px-4">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((subcategory) => (
                        <tr key={subcategory.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                              {subcategory.photourl ? (
                                <img
                                  src={subcategory.photourl || "/placeholder.svg"}
                                  alt={subcategory.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) =>
                                    (e.currentTarget.src = "/placeholder.svg?width=48&height=48&text=Img")
                                  }
                                />
                              ) : (
                                <span className="text-xs text-gray-500">Няма</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{subcategory.title}</td>
                          <td className="py-3 px-4 text-sm">{subcategory.categoryTitle || "Неизвестна"}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {subcategory.description ? (
                              subcategory.description.length > 50 ? (
                                `${subcategory.description.substring(0, 50)}...`
                              ) : (
                                subcategory.description
                              )
                            ) : (
                              <span className="text-gray-400 italic">Няма</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">{subcategory.productCount || 0}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${subcategory.deleted ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                            >
                              {subcategory.deleted ? "Неактивна" : "Активна"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditSubcategoryModal(subcategory)}
                                title="Редактирай"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleSubcategoryStatus(subcategory, subcategory.deleted)}
                                title={subcategory.deleted ? "Активирай" : "Деактивирай"}
                              >
                                {subcategory.deleted ? (
                                  <ToggleRight className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:border-red-400 bg-transparent"
                                onClick={() => openDeleteModal(null, subcategory)}
                                title="Изтрий"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Няма намерени подкатегории.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-black max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="sticky top-0 z-10 bg-white pb-4 border-b border-gray-100">
            <DialogTitle>Добавяне на нова категория</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-grow py-4 pr-2 space-y-6">
            {modalError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                <p className="text-sm text-red-600">{modalError}</p>
              </div>
            )}
            {isLoadingSchema && activeTab === "categories" ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-red-500" />
                <span className="ml-2 text-gray-600">Зареждане...</span>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-category-title" className="text-sm font-medium text-gray-700">
                        Име на категорията <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-category-title"
                        name="title"
                        value={newCategory.title || ""}
                        onChange={(e) => handleInputChange(e, setNewCategory)}
                        required
                        className="w-full mt-1 bg-white border-gray-300 text-black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-category-title-en" className="text-sm font-medium text-gray-700">
                        Име на категорията - EU <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-category-title-en"
                        name="title_en"
                        value={newCategory.title_en || ""}
                        onChange={(e) => handleInputChange(e, setNewCategory)}
                        required
                        className="w-full mt-1 bg-white border-gray-300 text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-category-photourl" className="text-sm font-medium text-gray-700">
                      Снимка
                    </Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="new-category-image-upload"
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
                          {uploadingImage ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploadingImage ? "Качване..." : "Качи"}
                        </Button>
                      </div>
                      {newCategory.photourl && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-2">Преглед:</p>
                          <img
                            src={newCategory.photourl || "/placeholder.svg"}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-category-description" className="text-sm font-medium text-gray-700">
                        Описание
                      </Label>
                      <Textarea
                        id="new-category-description"
                        name="description"
                        value={newCategory.description || ""}
                        onChange={(e) => handleInputChange(e, setNewCategory)}
                        className="w-full mt-1 bg-white border-gray-300 text-black min-h-[80px]"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-category-description-en" className="text-sm font-medium text-gray-700">
                        Описание - EU
                      </Label>
                      <Textarea
                        id="new-category-description-en"
                        name="description_en"
                        value={newCategory.description_en || ""}
                        onChange={(e) => handleInputChange(e, setNewCategory)}
                        className="w-full mt-1 bg-white border-gray-300 text-black min-h-[80px]"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="new-category-status"
                      name="deleted"
                      checked={newCategory.deleted === false}
                      onChange={(e) => handleInputChange(e, setNewCategory)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <Label htmlFor="new-category-status" className="text-sm font-medium text-gray-700">
                      Активна
                    </Label>
                  </div>
                </div>
                {categoryTableSchema.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-base font-semibold mb-3 text-gray-800">Допълнителни полета</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                      {categoryTableSchema
                        .filter(
                          (col) =>
                            ![
                              "Document ID",
                              "id",
                              "createdat",
                              "updatedat",
                              "title",
                              "title_en",
                              "description",
                              "description_en",
                              "photourl",
                              "deleted",
                            ].includes(col.column_name),
                        )
                        .map((col) => (
                          <div key={`new-category-dyn-${col.column_name}`} className="space-y-1">
                            <Label
                              htmlFor={`new-category-modal-${col.column_name}`}
                              className="text-sm font-medium capitalize text-gray-700"
                            >
                              {col.column_name.replace(/_/g, " ")}
                              {col.is_nullable === "NO" && !col.column_default && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            {renderInputField(col, newCategory, setNewCategory, "new-category")}
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
              </>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 z-10 bg-white pt-4 border-t border-gray-100 mt-auto">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Отказ
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={
                modalLoading ||
                (isLoadingSchema && activeTab === "categories") ||
                !newCategory.title ||
                !newCategory.title_en
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {modalLoading || (isLoadingSchema && activeTab === "categories") ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Обработка...
                </>
              ) : (
                "Добави категория"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-black">
          <DialogHeader>
            <DialogTitle>Потвърждение за изтриване</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Сигурни ли сте, че искате да изтриете "{categoryToDelete?.title || subcategoryToDelete?.title}"?</p>
            <p className="text-sm text-red-600 mt-2">Това действие не може да бъде отменено.</p>
            {deleteError && <p className="text-red-600 mt-2">{deleteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading}>
              Отказ
            </Button>
            <Button onClick={handleDelete} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700">
              {deleteLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Изтриване...
                </>
              ) : (
                "Изтрий"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Modal */}
      {subcategoryToEdit && (
        <EditSubcategoryModal
          isOpen={isEditSubcategoryModalOpen}
          onClose={() => {
            setIsEditSubcategoryModalOpen(false)
            setSubcategoryToEdit(null)
          }}
          subcategoryInitial={subcategoryToEdit}
          // Pass categories that use 'id' for the Edit modal as well if it expects it
          categories={allCategories.map((cat) => ({ "Document ID": cat["Document ID"], title: cat.title }))}
          onSuccess={() => {
            fetchSubcategories()
            setIsEditSubcategoryModalOpen(false)
            setSubcategoryToEdit(null)
          }}
        />
      )}

      {/* New Add Subcategory Modal */}
      <AddSubcategoryModal
        isOpen={isNewAddSubcategoryModalOpen}
        onClose={() => setIsNewAddSubcategoryModalOpen(false)}
        categories={allCategories} // Ensure allCategories items have "Document ID"
        onSuccess={() => {
          fetchSubcategories()
          setIsNewAddSubcategoryModalOpen(false)
        }}
      />
    </div>
  )
}
