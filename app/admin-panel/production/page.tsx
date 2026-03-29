"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Users, Factory, Package, DollarSign, Trash2 } from "lucide-react"

interface Employee {
  id: number
  name: string
  active: boolean
  created_at: string
  salary_level_id?: number
  salary_level_name?: string
}

interface ProductionLine {
  id: number
  name: string
  description: string
  active: boolean
  created_at: string
}

interface Partner {
  id: number
  name: boolean
  active: boolean
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number
  description: string
  created_at: string
  deleted: boolean
}

interface ProductionProduct {
  id: number
  name: string
  production_line_id: number
  production_line_name?: string
  daily_target: number
  sales_value?: number
  active: boolean
  created_at: string
  updated_at: string
}

interface SalaryLevel {
  id: number
  level_name: string
  salary_per_day: number
  created_at: string
  updated_at: string
  active: boolean
}

interface DailyTarget {
  date: string
  target: number
  employeeId: number
}

interface DailyTargetGroup {
  date: string
  targets: DailyTarget[]
}

export default function ProductionAdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productionProducts, setProductionProducts] = useState<ProductionProduct[]>([])
  const [salaryLevels, setSalaryLevels] = useState<SalaryLevel[]>([])
  const [loading, setLoading] = useState(true)

  const [productionProductSortOrder, setProductionProductSortOrder] = useState<"asc" | "desc">("asc")

  // Initialize salary_level_id for newEmployee
  const [newEmployee, setNewEmployee] = useState({ name: "", salary_level_id: "" })
  const [newProductionLine, setNewProductionLine] = useState({ name: "", description: "" })
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, description: "" })
  const [newProductionProduct, setNewProductionProduct] = useState({
    name: "",
    production_line_id: "",
    daily_target: 0,
    sales_value: 0,
  })
  const [newSalaryLevel, setNewSalaryLevel] = useState({ level_name: "", salary_per_day: 0 })

  const [editingEmployee, setEditingEmployee] = useState<{ id: number; name: string; salary_level_id: string } | null>(
    null,
  )
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false)

  const [editingProductionLine, setEditingProductionLine] = useState<{
    id: number
    name: string
    description: string
  } | null>(null)
  const [editProductionLineDialogOpen, setEditProductionLineDialogOpen] = useState(false)

  const [editingProductionProduct, setEditingProductionProduct] = useState<{
    id: number
    name: string
    production_line_id: string
    daily_target: number
    sales_value: number
  } | null>(null)
  const [editProductionProductDialogOpen, setEditProductionProductDialogOpen] = useState(false)

  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false)
  const [productionLineDialogOpen, setProductionLineDialogOpen] = useState(false)

  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productionProductDialogOpen, setProductionProductDialogOpen] = useState(false)
  const [salaryLevelDialogOpen, setSalaryLevelDialogOpen] = useState(false)

  const [editingTarget, setEditingTarget] = useState<{ employeeId: number; target: number } | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([])
  const [groupedDailyTargets, setGroupedDailyTargets] = useState<DailyTargetGroup[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [editingDailyTarget, setEditingDailyTarget] = useState<{
    date: string
    target: number
    productId?: string
    productionLineId?: string // Added productionLineId
  } | null>(null)
  const [addingProductTarget, setAddingProductTarget] = useState<{
    date: string
    target: number
    productId: string
    productionLineId: string // Added productionLineId
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [employeesRes, productionLinesRes, productsRes, productionProductsRes, salaryLevelsRes] = await Promise.all(
        [
          fetch("/api/admin/production/employees"),
          fetch("/api/admin/production/production-lines"),
          fetch("/api/admin/products"),
          fetch("/api/admin/production/production-products"),
          fetch("/api/admin/salary-levels"),
        ],
      )

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json()
        setEmployees(employeesData)
      }

      if (productionLinesRes.ok) {
        const productionLinesData = await productionLinesRes.json()
        setProductionLines(productionLinesData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(Array.isArray(productsData) ? productsData : [])
      } else {
        console.error("[v0] Failed to fetch products, status:", productsRes.status)
        setProducts([])
      }

      if (productionProductsRes.ok) {
        const productionProductsData = await productionProductsRes.json()
        setProductionProducts(productionProductsData)
      }

      if (salaryLevelsRes.ok) {
        const salaryLevelsData = await salaryLevelsRes.json()
        setSalaryLevels(salaryLevelsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setProducts([])
      toast({
        title: "Грешка",
        description: "Възникна проблем при зареждане на данните",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addEmployee = async () => {
    if (!newEmployee.name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на служителя",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/production/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmployee.name.trim(),
          salary_level_id:
            newEmployee.salary_level_id && newEmployee.salary_level_id !== "none"
              ? Number(newEmployee.salary_level_id)
              : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Служителят е добавен успешно",
        })
        setNewEmployee({ name: "", salary_level_id: "" })
        setEmployeeDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to add employee")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при добавяне на служителя",
        variant: "destructive",
      })
    }
  }

  const updateEmployee = async () => {
    console.log("[v0] updateEmployee called with:", editingEmployee)

    if (!editingEmployee) {
      console.log("[v0] No editing employee set")
      return
    }

    if (!editingEmployee.name.trim()) {
      console.log("[v0] Empty name validation failed")
      toast({
        title: "Грешка",
        description: "Моля въведете име на служителя",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        name: editingEmployee.name.trim(),
        salary_level_id:
          editingEmployee.salary_level_id && editingEmployee.salary_level_id !== "none"
            ? Number(editingEmployee.salary_level_id)
            : null,
      }

      console.log("[v0] Sending PATCH request with payload:", payload)
      console.log("[v0] URL:", `/api/admin/production/employees/${editingEmployee.id}`)

      const response = await fetch(`/api/admin/production/employees/${editingEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      const responseData = await response.json()
      console.log("[v0] Response data:", responseData)

      if (response.ok) {
        console.log("[v0] Update successful, showing toast")
        toast({
          title: "Успех",
          description: "Служителят е обновен успешно",
        })
        setEditingEmployee(null)
        setEditEmployeeDialogOpen(false)
        console.log("[v0] Fetching updated data")
        fetchData()
      } else {
        console.log("[v0] Response not ok, throwing error")
        throw new Error("Failed to update employee")
      }
    } catch (error) {
      console.error("[v0] Error in updateEmployee:", error)
      toast({
        title: "Грешка",
        description: "Възникна проблем при обновяване на служителя",
        variant: "destructive",
      })
    }
  }

  const openEditEmployeeDialog = (employee: Employee) => {
    setEditingEmployee({
      id: employee.id,
      name: employee.name,
      salary_level_id: employee.salary_level_id?.toString() || "none",
    })
    setEditEmployeeDialogOpen(true)
  }

  const openEditProductionLineDialog = (line: ProductionLine) => {
    setEditingProductionLine({
      id: line.id,
      name: line.name,
      description: line.description || "",
    })
    setEditProductionLineDialogOpen(true)
  }

  const openEditProductionProductDialog = (product: ProductionProduct) => {
    setEditingProductionProduct({
      id: product.id,
      name: product.name,
      production_line_id: product.production_line_id.toString(),
      daily_target: product.daily_target,
      sales_value: product.sales_value || 0,
    })
    setEditProductionProductDialogOpen(true)
  }

  const addProductionLine = async () => {
    if (!newProductionLine.name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на производствената линия",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/production/production-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductionLine.name.trim(),
          description: newProductionLine.description.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Производствената линия е добавена успешно",
        })
        setNewProductionLine({ name: "", description: "" })
        setProductionLineDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to add production line")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при добавяне на производствената линия",
        variant: "destructive",
      })
    }
  }

  const updateProductionLine = async () => {
    if (!editingProductionLine) return

    if (!editingProductionLine.name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на производствената линия",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/production/production-lines/${editingProductionLine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProductionLine.name.trim(),
          description: editingProductionLine.description.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Производствената линия е обновена успешно",
        })
        setEditingProductionLine(null)
        setEditProductionLineDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to update production line")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при обновяване на производствената линия",
        variant: "destructive",
      })
    }
  }

  const addProduct = async () => {
    if (!newProduct.name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на продукта",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          price: newProduct.price,
          description: newProduct.description.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Продуктът е добавен успешно",
        })
        setNewProduct({ name: "", price: 0, description: "" })
        setProductDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to add product")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при добавяне на продукта",
        variant: "destructive",
      })
    }
  }

  const addProductionProduct = async () => {
    if (!newProductionProduct.name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на продукта",
        variant: "destructive",
      })
      return
    }

    if (!newProductionProduct.production_line_id) {
      toast({
        title: "Грешка",
        description: "Моля изберете производствена линия",
        variant: "destructive",
      })
      return
    }

    if (newProductionProduct.daily_target <= 0) {
      toast({
        title: "Грешка",
        description: "Дневната цел трябва да бъде положително число",
        variant: "destructive",
      })
      return
    }

    if (newProductionProduct.sales_value < 0) {
      toast({
        title: "Грешка",
        description: "Продажната стойност не може да бъде отрицателна",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/production/production-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductionProduct.name.trim(),
          production_line_id: Number(newProductionProduct.production_line_id),
          daily_target: Number(newProductionProduct.daily_target),
          sales_value: Number(newProductionProduct.sales_value),
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Производственият продукт е добавен успешно",
        })
        setNewProductionProduct({ name: "", production_line_id: "", daily_target: 0, sales_value: 0 })
        setProductionProductDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to add production product")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при добавяне на производствения продукт",
        variant: "destructive",
      })
    }
  }

  const updateProductionProduct = async () => {
    if (!editingProductionProduct) return

    if (!editingProductionProduct.name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на продукта",
        variant: "destructive",
      })
      return
    }

    if (!editingProductionProduct.production_line_id) {
      toast({
        title: "Грешка",
        description: "Моля изберете производствена линия",
        variant: "destructive",
      })
      return
    }

    if (editingProductionProduct.daily_target <= 0) {
      toast({
        title: "Грешка",
        description: "Дневната цел трябва да бъде положително число",
        variant: "destructive",
      })
      return
    }

    if (editingProductionProduct.sales_value < 0) {
      toast({
        title: "Грешка",
        description: "Продажната стойност не може да бъде отрицателна",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/production/production-products/${editingProductionProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProductionProduct.name.trim(),
          production_line_id: Number(editingProductionProduct.production_line_id),
          daily_target: Number(editingProductionProduct.daily_target),
          sales_value: Number(editingProductionProduct.sales_value),
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Производственият продукт е обновен успешно",
        })
        setEditingProductionProduct(null)
        setEditProductionProductDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to update production product")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при обновяване на производствения продукт",
        variant: "destructive",
      })
    }
  }

  const toggleEmployeeStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/production/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Статусът на служителя е променен",
        })
        fetchData()
      } else {
        throw new Error("Failed to update employee status")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при промяна на статуса",
        variant: "destructive",
      })
    }
  }

  const deleteEmployee = async (id: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този служител?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/production/employees/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Служителят е изтрит успешно",
        })
        fetchData()
      } else {
        throw new Error("Failed to delete employee")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при изтриване на служителя",
        variant: "destructive",
      })
    }
  }

  const toggleProductionLineStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/production/production-lines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Статусът на производствената линия е променен",
        })
        fetchData()
      } else {
        throw new Error("Failed to update production line status")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при промяна на статуса",
        variant: "destructive",
      })
    }
  }

  const deleteProductionLine = async (id: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази производствена линия?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/production/production-lines/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Производствената линия е изтрита успешно",
        })
        fetchData()
      } else {
        throw new Error("Failed to delete production line")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при изтриване на производствената линия",
        variant: "destructive",
      })
    }
  }

  const toggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify({ deleted: !currentStatus }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Статусът на продукта е променен",
        })
        fetchData()
      } else {
        throw new Error("Failed to update product status")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при промяна на статуса",
        variant: "destructive",
      })
    }
  }

  const toggleProductionProductStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/production/production-products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Статусът на производствения продукт е променен",
        })
        fetchData()
      } else {
        throw new Error("Failed to update production product status")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при промяна на статуса",
        variant: "destructive",
      })
    }
  }

  const deleteProductionProduct = async (id: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този производствен продукт?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/production/production-products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Производственият продукт е изтрит успешно",
        })
        fetchData()
      } else {
        throw new Error("Failed to delete production product")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при изтриване на производствения продукт",
        variant: "destructive",
      })
    }
  }

  const addSalaryLevel = async () => {
    if (!newSalaryLevel.level_name.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на нивото",
        variant: "destructive",
      })
      return
    }

    if (newSalaryLevel.salary_per_day <= 0) {
      toast({
        title: "Грешка",
        description: "Моля въведете валидна заплата на ден",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/salary-levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_name: newSalaryLevel.level_name.trim(),
          salary_per_day: newSalaryLevel.salary_per_day,
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Нивото на заплата е добавено успешно",
        })
        setNewSalaryLevel({ level_name: "", salary_per_day: 0 })
        setSalaryLevelDialogOpen(false)
        fetchData()
      } else {
        throw new Error("Failed to add salary level")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при добавяне на нивото на заплата",
        variant: "destructive",
      })
    }
  }

  const deleteSalaryLevel = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/salary-levels/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Нивото на заплата е изтрито успешно",
        })
        fetchData()
      } else {
        throw new Error("Failed to delete salary level")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна проблем при изтриване на нивото на заплата",
        variant: "destructive",
      })
    }
  }

  const getSortedProductionProducts = () => {
    return [...productionProducts].sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()

      // Check if names start with Cyrillic
      const isCyrillicA = /^[\u0400-\u04FF]/.test(nameA)
      const isCyrillicB = /^[\u0400-\u04FF]/.test(nameB)

      // Cyrillic comes before Latin
      if (isCyrillicA && !isCyrillicB) return -1
      if (!isCyrillicA && isCyrillicB) return 1

      // Both same alphabet, sort alphabetically
      const comparison = nameA.localeCompare(nameB, "bg")
      return productionProductSortOrder === "asc" ? comparison : -comparison
    })
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Управление на производството</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общо служители</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">{employees.filter((e) => e.active).length} активни</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Производствени линии</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionLines.length}</div>
            <p className="text-xs text-muted-foreground">{productionLines.filter((pl) => pl.active).length} активни</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Служители</CardTitle>
              <CardDescription>Управление на служителите</CardDescription>
            </div>
            <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добави служител
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добави нов служител</DialogTitle>
                  <DialogDescription>Въведете данните за новия служител</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employee-name">Име на служителя</Label>
                    <Input
                      id="employee-name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="Въведете име..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="employee-salary-level">Ниво на заплата</Label>
                    <Select
                      value={newEmployee.salary_level_id}
                      onValueChange={(value) => setNewEmployee({ ...newEmployee, salary_level_id: value })}
                    >
                      <SelectTrigger id="employee-salary-level">
                        <SelectValue placeholder="Изберете ниво на заплата" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без ниво</SelectItem>
                        {salaryLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.level_name} - {(Number(level.salary_per_day) / 1.95583).toFixed(2)} €/ден
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEmployeeDialogOpen(false)}>
                      Отказ
                    </Button>
                    <Button onClick={addEmployee}>Добави</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Име</TableHead>
                  <TableHead>Ниво на заплата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата на създаване</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>
                      {employee.salary_level_name ? (
                        <Badge variant="outline">{employee.salary_level_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Не е зададено</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.active ? "default" : "secondary"}>
                        {employee.active ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(employee.created_at).toLocaleDateString("bg-BG")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditEmployeeDialog(employee)}>
                          Ред��ктирай
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEmployee(employee.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Изтрий
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editEmployeeDialogOpen} onOpenChange={setEditEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирай служител</DialogTitle>
            <DialogDescription>Променете данните на служителя</DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-employee-name">Име на служителя</Label>
                <Input
                  id="edit-employee-name"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  placeholder="Въведете име..."
                />
              </div>
              <div>
                <Label htmlFor="edit-employee-salary-level">Ниво на заплата</Label>
                <Select
                  value={editingEmployee.salary_level_id}
                  onValueChange={(value) => setEditingEmployee({ ...editingEmployee, salary_level_id: value })}
                >
                  <SelectTrigger id="edit-employee-salary-level">
                    <SelectValue placeholder="Изберете ниво на заплата" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без ниво</SelectItem>
                    {salaryLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        {level.level_name} - {(Number(level.salary_per_day) / 1.95583).toFixed(2)} €/ден
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditEmployeeDialogOpen(false)}>
                  Отказ
                </Button>
                <Button onClick={updateEmployee}>Запази</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editProductionLineDialogOpen} onOpenChange={setEditProductionLineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирай производствена линия</DialogTitle>
            <DialogDescription>Променете данните на производствената линия</DialogDescription>
          </DialogHeader>
          {editingProductionLine && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-line-name">Име на линията</Label>
                <Input
                  id="edit-line-name"
                  value={editingProductionLine.name}
                  onChange={(e) => setEditingProductionLine({ ...editingProductionLine, name: e.target.value })}
                  placeholder="Въведете име..."
                />
              </div>
              <div>
                <Label htmlFor="edit-line-description">Описание</Label>
                <Textarea
                  id="edit-line-description"
                  value={editingProductionLine.description}
                  onChange={(e) => setEditingProductionLine({ ...editingProductionLine, description: e.target.value })}
                  placeholder="Въведете описание..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditProductionLineDialogOpen(false)}>
                  Отказ
                </Button>
                <Button onClick={updateProductionLine}>Запази</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editProductionProductDialogOpen} onOpenChange={setEditProductionProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирай производствен продукт</DialogTitle>
            <DialogDescription>Променете данните на производствения продукт</DialogDescription>
          </DialogHeader>
          {editingProductionProduct && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-production-product-name">Име на продукта</Label>
                <Input
                  id="edit-production-product-name"
                  value={editingProductionProduct.name}
                  onChange={(e) => setEditingProductionProduct({ ...editingProductionProduct, name: e.target.value })}
                  placeholder="Въведете име..."
                />
              </div>
              <div>
                <Label htmlFor="edit-production-product-line">Производствена линия</Label>
                <Select
                  value={editingProductionProduct.production_line_id}
                  onValueChange={(value) =>
                    setEditingProductionProduct({ ...editingProductionProduct, production_line_id: value })
                  }
                >
                  <SelectTrigger id="edit-production-product-line">
                    <SelectValue placeholder="Изберете производствена линия" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionLines
                      .filter((line) => line.active)
                      .map((line) => (
                        <SelectItem key={line.id} value={line.id.toString()}>
                          {line.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-production-product-target">Дневна цел (бр)</Label>
                <Input
                  id="edit-production-product-target"
                  type="number"
                  min="1"
                  value={editingProductionProduct.daily_target}
                  onChange={(e) =>
                    setEditingProductionProduct({ ...editingProductionProduct, daily_target: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-production-product-sales-value">Продажна стойност (€)</Label>
                <Input
                  id="edit-production-product-sales-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProductionProduct.sales_value}
                  onChange={(e) =>
                    setEditingProductionProduct({ ...editingProductionProduct, sales_value: Number(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditProductionProductDialogOpen(false)}>
                  Отказ
                </Button>
                <Button onClick={updateProductionProduct}>Запази</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Производствени линии</CardTitle>
              <CardDescription>Управление на производствените линии</CardDescription>
            </div>
            <Dialog open={productionLineDialogOpen} onOpenChange={setProductionLineDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добави линия
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добави нова производствена линия</DialogTitle>
                  <DialogDescription>Въведете данните за новата производствена линия</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="line-name">Име на линията</Label>
                    <Input
                      id="line-name"
                      value={newProductionLine.name}
                      onChange={(e) => setNewProductionLine({ ...newProductionLine, name: e.target.value })}
                      placeholder="Въведете име..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="line-description">Описание</Label>
                    <Textarea
                      id="line-description"
                      value={newProductionLine.description}
                      onChange={(e) => setNewProductionLine({ ...newProductionLine, description: e.target.value })}
                      placeholder="Въведете описание..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setProductionLineDialogOpen(false)}>
                      Отказ
                    </Button>
                    <Button onClick={addProductionLine}>Добави</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Име</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата на създаване</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.name}</TableCell>
                    <TableCell>{line.description || "Няма описание"}</TableCell>
                    <TableCell>
                      <Badge variant={line.active ? "default" : "secondary"}>
                        {line.active ? "Активна" : "Неактивна"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(line.created_at).toLocaleDateString("bg-BG")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditProductionLineDialog(line)}>
                          Редактирай
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProductionLine(line.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Изтрий
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Заплати
              </CardTitle>
              <CardDescription>Управление на нивата на заплати за служителите</CardDescription>
            </div>
            <Dialog open={salaryLevelDialogOpen} onOpenChange={setSalaryLevelDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Level
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добави ново ниво на заплата</DialogTitle>
                  <DialogDescription>Въведете данните за новото ниво на заплата</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="level-name">Име на нивото</Label>
                    <Input
                      id="level-name"
                      value={newSalaryLevel.level_name}
                      onChange={(e) => setNewSalaryLevel({ ...newSalaryLevel, level_name: e.target.value })}
                      placeholder="напр. Начинаещ, Експерт..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-per-day">Заплата на ден (€)</Label>
                    <Input
                      id="salary-per-day"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newSalaryLevel.salary_per_day}
                      onChange={(e) => setNewSalaryLevel({ ...newSalaryLevel, salary_per_day: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSalaryLevelDialogOpen(false)}>
                      Отказ
                    </Button>
                    <Button onClick={addSalaryLevel}>Добави</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : salaryLevels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Няма добавени нива на заплати. Натиснете "New Level" за да добавите.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ниво</TableHead>
                  <TableHead>Заплата на ден</TableHead>
                  <TableHead>Дата на създаване</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryLevels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.level_name}</TableCell>
                    <TableCell className="font-semibold">{(Number(level.salary_per_day) / 1.95583).toFixed(2)} €</TableCell>
                    <TableCell>{new Date(level.created_at).toLocaleDateString("bg-BG")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSalaryLevel(level.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Изтрий
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Производствени продукти
              </CardTitle>
              <CardDescription>Управление на продуктите за производство (отделно от онлайн магазина)</CardDescription>
            </div>
            <Dialog open={productionProductDialogOpen} onOpenChange={setProductionProductDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добави продукт
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добави нов производствен продукт</DialogTitle>
                  <DialogDescription>Въведете данните за новия производствен продукт</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="production-product-name">Име на продукта</Label>
                    <Input
                      id="production-product-name"
                      value={newProductionProduct.name}
                      onChange={(e) => setNewProductionProduct({ ...newProductionProduct, name: e.target.value })}
                      placeholder="Въведете име..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="production-product-line">Производствена линия</Label>
                    <Select
                      value={newProductionProduct.production_line_id}
                      onValueChange={(value) =>
                        setNewProductionProduct({ ...newProductionProduct, production_line_id: value })
                      }
                    >
                      <SelectTrigger id="production-product-line">
                        <SelectValue placeholder="Изберете производствена линия" />
                      </SelectTrigger>
                      <SelectContent>
                        {productionLines
                          .filter((line) => line.active)
                          .map((line) => (
                            <SelectItem key={line.id} value={line.id.toString()}>
                              {line.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="production-product-target">Дневна цел (бр)</Label>
                    <Input
                      id="production-product-target"
                      type="number"
                      min="1"
                      value={newProductionProduct.daily_target}
                      onChange={(e) =>
                        setNewProductionProduct({ ...newProductionProduct, daily_target: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="production-product-sales-value">Продажна стойност (€)</Label>
                    <Input
                      id="production-product-sales-value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProductionProduct.sales_value}
                      onChange={(e) =>
                        setNewProductionProduct({ ...newProductionProduct, sales_value: Number(e.target.value) })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setProductionProductDialogOpen(false)}>
                      Отказ
                    </Button>
                    <Button onClick={addProductionProduct}>Добави</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : productionProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Няма добавени производствени продукти. Натиснете "Добави продукт" за да добавите.
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductionProductSortOrder(productionProductSortOrder === "asc" ? "desc" : "asc")}
                >
                  Сортирай по име: {productionProductSortOrder === "asc" ? "А → Я" : "Я → А"}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Производствена линия</TableHead>
                    <TableHead>Дневна цел</TableHead>
                    <TableHead>Продажна стойност</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата на създаване</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedProductionProducts().map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.production_line_name ? (
                          <Badge variant="outline">{product.production_line_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Не е зададена</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{product.daily_target} бр</TableCell>
                      <TableCell className="font-semibold">
                        {product.sales_value ? `${(Number(product.sales_value) / 1.95583).toFixed(2)} €` : "0.00 €"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? "default" : "secondary"}>
                          {product.active ? "Активен" : "Неактивен"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(product.created_at).toLocaleDateString("bg-BG")}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditProductionProductDialog(product)}>
                            Редактирай
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProductionProduct(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Изтрий
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
