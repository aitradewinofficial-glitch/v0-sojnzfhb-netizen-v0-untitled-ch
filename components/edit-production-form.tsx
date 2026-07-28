"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { X, ArrowUpDown } from 'lucide-react'
import { getCurrentEmployee } from "@/lib/production-auth"

interface Production {
  id: number
  employee_id: number
  product_name: string
  product_key?: string
  production_line_id?: number
  partner_employee_id?: number
  quantity: number
  production_date: string
  notes: string
}

interface ProductionLine {
  id: number
  name: string
}

interface Employee {
  id: number
  name: string
}

interface Product {
  id: string
  name: string
  type: "online" | "production"
  production_line_id?: number
}

interface EditProductionFormProps {
  production: Production
  onClose: () => void
  onSuccess: () => void
}

export function EditProductionForm({ production, onClose, onSuccess }: EditProductionFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [localProductionLines, setLocalProductionLines] = useState<ProductionLine[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sortAscending, setSortAscending] = useState(true)
  const [formData, setFormData] = useState({
    productionLineId: production.production_line_id?.toString() || "",
    // Pre-select the dropdown by the product KEY (production-<id>), never the
    // display name. Falls back to product_name only for legacy rows.
    productName:
      production.product_key &&
      (production.product_key.startsWith("production-") || production.product_key.startsWith("online-"))
        ? production.product_key
        : "",
    partnerEmployeeId: production.partner_employee_id?.toString() || "",
    quantity: production.quantity.toString(),
    productionDate: production.production_date.split("T")[0],
    notes: production.notes || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [linesRes, employeesRes, productionProductsRes] = await Promise.all([
          fetch("/api/admin/production/production-lines"),
          fetch("/api/admin/production/employees"),
          fetch("/api/admin/production/production-products"),
        ])

        if (linesRes.ok) {
          const linesData = await linesRes.json()
          setLocalProductionLines(linesData)
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json()
          setEmployees(employeesData.filter((e: Employee & { active: boolean }) => e.active))
        }

        if (productionProductsRes.ok) {
          const productionProductsData = await productionProductsRes.json()
          const prodProducts = productionProductsData
            .filter((p: any) => p.active)
            .map((p: any) => ({
              id: `production-${p.id}`,
              name: p.name,
              type: "production" as const,
              production_line_id: p.production_line_id,
            }))
          setProducts(prodProducts)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = formData.productionLineId
    ? products
        .filter((p) => p.production_line_id === Number.parseInt(formData.productionLineId))
        .sort((a, b) => {
          const comparison = a.name.localeCompare(b.name, "bg-BG")
          return sortAscending ? comparison : -comparison
        })
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productName || !formData.productionLineId || !formData.partnerEmployeeId || !formData.quantity) {
      toast.error("Моля попълнете всички задължителни полета")
      return
    }

    setIsSubmitting(true)

    try {
      const currentEmployee = getCurrentEmployee()
      const response = await fetch(`/api/productions/${production.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentEmployee?.id?.toString() || "",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Производството е обновено успешно!")
        onSuccess()
        onClose()
      } else {
        toast.error("Грешка при обновяване на производството")
      }
    } catch (error) {
      toast.error("Грешка при обновяване на производството")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Редактиране на производство</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productionLine">Производствена линия *</Label>
              <Select
                value={formData.productionLineId}
                onValueChange={(value) => {
                  setFormData({ ...formData, productionLineId: value, productName: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Изберете линия..." />
                </SelectTrigger>
                <SelectContent>
                  {localProductionLines.map((line) => (
                    <SelectItem key={line.id} value={line.id.toString()}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="productName">Продукт *</Label>
                {formData.productionLineId && filteredProducts.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortAscending(!sortAscending)}
                    className="h-8 gap-1 text-xs"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortAscending ? "А → Я" : "Я → А"}
                  </Button>
                )}
              </div>
              <Select
                value={formData.productName}
                onValueChange={(value) => setFormData({ ...formData, productName: value })}
                disabled={!formData.productionLineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Изберете продукт..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts && filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {formData.productionLineId
                        ? "Няма налични продукти за тази линия"
                        : "Първо изберете производствена линия"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner">Партньор (служител) *</Label>
              <Select
                value={formData.partnerEmployeeId}
                onValueChange={(value) => setFormData({ ...formData, partnerEmployeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Изберете партньор..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Количество (брой) *</Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionDate">Дата на производство</Label>
              <Input
                id="productionDate"
                type="date"
                value={formData.productionDate}
                onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Бележки</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Аромат, модел, цвят и др..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Отказ
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-600 hover:bg-amber-700">
                {isSubmitting ? "Запазване..." : "Запази промените"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
