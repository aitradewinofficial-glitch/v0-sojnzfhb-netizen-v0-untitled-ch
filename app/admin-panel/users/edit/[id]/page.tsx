"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

interface CustomerData {
  [key: string]: any
}

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [loading, setLoading] = useState(false)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [loadingSchema, setLoadingSchema] = useState(true)
  const [formData, setFormData] = useState<CustomerData>({})
  const [originalData, setOriginalData] = useState<CustomerData>({})
  const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([])

  // Fetch table schema
  useEffect(() => {
    const fetchSchema = async () => {
      setLoadingSchema(true)
      try {
        const response = await fetch("/api/admin/customers/schema", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch table schema")
        }
        const data = await response.json()
        const schema: ColumnInfo[] = data.schema || data
        console.log("Customers table schema:", schema)
        setTableSchema(schema)
      } catch (error) {
        console.error("Error fetching schema:", error)
        toast({
          title: "Грешка",
          description: "Не можах да заредя структурата на таблицата",
          variant: "destructive",
        })
      } finally {
        setLoadingSchema(false)
      }
    }
    fetchSchema()
  }, [])

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return
      setLoadingCustomer(true)
      try {
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/admin/customers/${id}?t=${timestamp}`, { cache: "no-store" })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Грешка при зареждане на клиента")
        }
        const customerData: CustomerData = await response.json()
        console.log("Customer data:", customerData)
        setFormData(customerData)
        setOriginalData(customerData)
      } catch (error) {
        console.error("Грешка при зареждане на клиента:", error)
        toast({
          title: "Грешка",
          description: error instanceof Error ? error.message : "Възникна проблем",
          variant: "destructive",
        })
      } finally {
        setLoadingCustomer(false)
      }
    }
    fetchCustomer()
  }, [id])

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const formatDate = (dateString: string | object | null | undefined) => {
    if (!dateString) return "Няма данни"
    try {
      const date = new Date(dateString as string)
      if (isNaN(date.getTime())) return "Невалидна дата"
      return new Intl.DateTimeFormat("bg-BG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (e) {
      return "Невалидна дата"
    }
  }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toISOString().slice(0, 16) // Format for datetime-local input
    } catch (e) {
      return ""
    }
  }

  const getFieldLabel = (fieldName: string): string => {
    const labels: { [key: string]: string } = {
      objectid: "Имейл / Object ID",
      storename: "Име на магазин",
      companyname: "Име на компания",
      phone: "Телефон",
      marshrut: "Маршрут",
      type: "Тип клиент",
      discountpercent: "Процент отстъпка",
      password: "Парола",
      pending: "Изчакващ одобрение",
      deleted: "Деактивиран",
      createdbyadmin: "Създаден от админ",
      createdat: "Създаден на",
      updatedat: "Обновен на",
      "Document ID": "Document ID",
    }
    return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }

  const renderInputField = (col: ColumnInfo) => {
    const fieldName = col.column_name
    const value = formData[fieldName] || ""
    const dataType = col.data_type.toLowerCase()
    const isRequired = col.is_nullable === "NO" && !col.column_default

    // Skip system fields that shouldn't be edited
    if (fieldName === "id" || fieldName === "Document ID") {
      return null
    }

    // Handle different data types
    if (dataType.includes("boolean") || dataType === "bool") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={value?.toString() || "false"}
            onValueChange={(newValue) => handleChange(fieldName, newValue === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Да</SelectItem>
              <SelectItem value="false">Не</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (dataType.includes("text") && fieldName.toLowerCase().includes("description")) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id={fieldName}
            value={value?.toString() || ""}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            rows={3}
            required={isRequired}
          />
        </div>
      )
    }

    if (dataType.includes("int") || dataType.includes("numeric") || dataType.includes("decimal")) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldName}
            type="number"
            value={value?.toString() || ""}
            onChange={(e) => handleChange(fieldName, e.target.value ? Number(e.target.value) : null)}
            step={dataType.includes("decimal") ? "0.01" : "1"}
            required={isRequired}
          />
        </div>
      )
    }

    if (dataType.includes("timestamp") || dataType.includes("datetime")) {
      // Read-only for system timestamps
      if (fieldName.toLowerCase().includes("createdat") || fieldName.toLowerCase().includes("updatedat")) {
        return (
          <div key={fieldName} className="space-y-2">
            <Label>{getFieldLabel(fieldName)}</Label>
            <div className="p-2 bg-gray-50 rounded border text-sm text-gray-600">{formatDate(value)}</div>
          </div>
        )
      }

      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldName}
            type="datetime-local"
            value={formatDateForInput(value)}
            onChange={(e) => handleChange(fieldName, e.target.value ? new Date(e.target.value).toISOString() : null)}
            required={isRequired}
          />
        </div>
      )
    }

    if (fieldName === "type") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={value?.toString() || "standard"}
            onValueChange={(newValue) => handleChange(fieldName, newValue)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Стандартен клиент</SelectItem>
              <SelectItem value="retailer">Търговец на дребно</SelectItem>
              <SelectItem value="wholesaler">Търговец на едро</SelectItem>
              <SelectItem value="european">Европейски клиент</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Special handling for password field - show actual password for admin
    if (fieldName.toLowerCase().includes("password")) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldName}
            type="text" // Changed from "password" to "text" to show the password
            value={value?.toString() || ""}
            onChange={(e) => handleChange(fieldName, e.target.value || null)}
            maxLength={col.character_maximum_length || undefined}
            required={isRequired}
            placeholder="Въведете нова парола или оставете текущата"
            className="font-mono" // Monospace font for better readability
          />
          {value && (
            <p className="text-xs text-gray-500">
              Текуща парола:{" "}
              {value.toString().length > 20 ? value.toString().substring(0, 20) + "..." : value.toString()}
            </p>
          )}
        </div>
      )
    }

    // Default text input
    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName}>
          {getFieldLabel(fieldName)} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={fieldName}
          type="text" // Removed the password check since it's handled above
          value={value?.toString() || ""}
          onChange={(e) => handleChange(fieldName, e.target.value || null)}
          maxLength={col.character_maximum_length || undefined}
          required={isRequired}
        />
      </div>
    )
  }

  const organizeFields = () => {
    const basicInfo = ["objectid", "storename", "companyname", "phone", "marshrut"]
    const businessInfo = ["type", "discountpercent"]
    const authInfo = ["password"]
    const statusInfo = ["pending", "deleted", "createdbyadmin"]
    const systemInfo = ["id", "Document ID", "createdat", "updatedat"]

    const basicFields = tableSchema.filter((col) => basicInfo.includes(col.column_name))
    const businessFields = tableSchema.filter((col) => businessInfo.includes(col.column_name))
    const authFields = tableSchema.filter((col) => authInfo.includes(col.column_name))
    const statusFields = tableSchema.filter((col) => statusInfo.includes(col.column_name))
    const systemFields = tableSchema.filter((col) => systemInfo.includes(col.column_name))
    const otherFields = tableSchema.filter(
      (col) =>
        !basicInfo.includes(col.column_name) &&
        !businessInfo.includes(col.column_name) &&
        !authInfo.includes(col.column_name) &&
        !statusInfo.includes(col.column_name) &&
        !systemInfo.includes(col.column_name),
    )

    return { basicFields, businessFields, authFields, statusFields, systemFields, otherFields }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validate required fields
      const requiredFields = tableSchema.filter((col) => col.is_nullable === "NO" && !col.column_default)
      for (const field of requiredFields) {
        if (!formData[field.column_name] && field.column_name !== "id" && field.column_name !== "Document ID") {
          toast({
            title: "Грешка",
            description: `Полето "${getFieldLabel(field.column_name)}" е задължително`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      console.log("Submitting form data:", formData)

      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Грешка при обновяване на клиента")
      }

      const result = await response.json()
      console.log("Update result:", result)

      toast({ title: "Успешно", description: "Клиентът беше обновен успешно" })
      router.push("/admin-panel/users")
    } catch (error) {
      console.error("Грешка при обновяване на клиента:", error)
      toast({
        title: "Грешка",
        description: error instanceof Error ? error.message : "Възникна проблем",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingCustomer || loadingSchema) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-2" />
          <p className="text-gray-600">{loadingSchema ? "Зареждане на структурата..." : "Зареждане на данните..."}</p>
        </div>
      </div>
    )
  }

  if (tableSchema.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Не можах да заредя структурата на таблицата. Моля, опитайте отново.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Презареди страницата
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { basicFields, businessFields, authFields, statusFields, systemFields, otherFields } = organizeFields()

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Редактиране на клиент</CardTitle>
              <CardDescription className="text-gray-600">
                Редактирайте информацията за клиента (Общо {tableSchema.length} полета)
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push("/admin-panel/users")} className="bg-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Назад
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* System Information */}
            {systemFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Системна информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  {systemFields.map((col) => (
                    <div key={col.column_name}>
                      <span className="text-sm text-gray-500">{getFieldLabel(col.column_name)}:</span>
                      <p className="font-medium">
                        {col.column_name.toLowerCase().includes("at")
                          ? formatDate(formData[col.column_name])
                          : formData[col.column_name] || "Няма данни"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            {basicFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Основна информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {basicFields.map((col) => renderInputField(col))}
                </div>
              </div>
            )}

            {/* Business Information */}
            {businessFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Бизнес информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {businessFields.map((col) => renderInputField(col))}
                </div>
              </div>
            )}

            {/* Authentication */}
            {authFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Удостоверяване</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {authFields.map((col) => renderInputField(col))}
                </div>
              </div>
            )}

            {/* Status Information */}
            {statusFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Статус</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {statusFields.map((col) => renderInputField(col))}
                </div>
              </div>
            )}

            {/* Other Fields */}
            {otherFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Допълнителни полета</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherFields.map((col) => renderInputField(col))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/admin-panel/users")}>
                Отказ
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
