"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductionForm } from "@/components/production-form"
import { EditProductionForm } from "@/components/edit-production-form"
import { getCurrentEmployee, logout } from "@/lib/production-auth"
import { toast } from "sonner"
import { Plus, LogOut, Edit, Trash2, Factory, Calendar, User, Package, ClipboardList, CalendarIcon, X, Shield, Eye, EyeOff, Menu, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { bg } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

interface Production {
  id: number
  employee_id: number
  product_name: string
  product_key?: string
  quantity: number
  production_date: string
  notes: string
  employee_name: string
  production_line_name: string
  partner_name: string
  created_at: string
  partner_employee_id?: number | null // Added for partner employee ID
  processed: boolean // Added for processed status
}

interface ProductionLine {
  id: number
  name: string
}

interface Partner {
  id: number
  name: string
}

interface DailyTask {
  id: number
  target_date: string
  daily_target: number
  product_id: string
  product_name: string
  production_line_id: number
  production_line_name: string
}

interface ProductionDashboardProps {
  initialProductions: Production[]
  productionLines: ProductionLine[]
  partners: Partner[]
}

export function ProductionDashboard({ initialProductions, productionLines, partners }: ProductionDashboardProps) {
  const [currentEmployee, setCurrentEmployee] = useState<any>(null)
  const [productions, setProductions] = useState<Production[]>(initialProductions)
  const [showForm, setShowForm] = useState(false)
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAllProductions, setShowAllProductions] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const employee = getCurrentEmployee()
    if (!employee) {
      router.push("/production")
      return
    }
    setCurrentEmployee(employee)

    console.log("[v0] Current employee:", employee)
    console.log("[v0] Production lines data:", productionLines)
    console.log("[v0] Partners data:", partners)
  }, [router, productionLines, partners])

  useEffect(() => {
    if (currentEmployee) {
      refreshProductions()
      fetchDailyTasks()
    }
  }, [currentEmployee])

  const fetchDailyTasks = async () => {
    if (!currentEmployee?.id) return

    setTasksLoading(true)
    try {
      const response = await fetch("/api/production/tasks", {
        headers: {
          "x-employee-id": currentEmployee.id.toString(),
        },
      })

      if (response.ok) {
        const tasks = await response.json()
        console.log("[v0] Fetched daily tasks:", tasks)
        setDailyTasks(tasks)
      } else {
        console.error("[v0] Failed to fetch tasks")
        setDailyTasks([])
      }
    } catch (error) {
      console.error("[v0] Error fetching tasks:", error)
      setDailyTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  const refreshProductions = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Refreshing productions for employee:", currentEmployee?.id)
      const url = showAllProductions ? `/api/productions` : `/api/productions?employeeId=${currentEmployee.id}`

      console.log("[v0] Fetching from URL:", url)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Received productions:", data.length)
        setProductions(data)
      }
    } catch (error) {
      console.log("[v0] Error refreshing productions:", error)
      toast.error("Грешка при зареждане на данните")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentEmployee) {
      refreshProductions()
    }
  }, [showAllProductions])

  const handleLogout = () => {
    logout()
    router.push("/production")
  }

  const handleEdit = (production: Production) => {
    setEditingProduction(production)
  }

  const handleDelete = async (productionId: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете това производство?")) {
      return
    }

    try {
      const response = await fetch(`/api/productions/${productionId}`, {
        method: "DELETE",
        headers: {
          "x-employee-id": currentEmployee?.id?.toString() || "",
        },
      })

      if (response.ok) {
        toast.success("Производството е изтрито успешно!")
        refreshProductions()
      } else {
        toast.error("Грешка при изтриване на производството")
      }
    } catch (error) {
      toast.error("Грешка при изтриване на производството")
    }
  }

  const canEdit = (production: Production) => {
    return currentEmployee && (production.employee_id === currentEmployee.id || production.partner_employee_id === currentEmployee.id)
  }

  const toggleProcessed = async (productionId: number, currentProcessed: boolean) => {
    const newProcessed = !currentProcessed
    
    // Optimistic update
    setProductions(prev => 
      prev.map(p => p.id === productionId ? { ...p, processed: newProcessed } : p)
    )
    
    try {
      const response = await fetch(`/api/productions/${productionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ processed: newProcessed }),
      })

      if (!response.ok) {
        // Revert on error
        setProductions(prev => 
          prev.map(p => p.id === productionId ? { ...p, processed: currentProcessed } : p)
        )
        toast.error("Грешка при запазване на статуса")
      }
    } catch (error) {
      // Revert on error
      setProductions(prev => 
        prev.map(p => p.id === productionId ? { ...p, processed: currentProcessed } : p)
      )
      toast.error("Грешка при запазване на статуса")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bg-BG")
  }

  const displayedProductions = showAllProductions
    ? productions
    : productions.filter((p) => p.employee_id === currentEmployee?.id || p.partner_employee_id === currentEmployee?.id) // Filter to show productions where user is employee or partner

  const filteredProductions = selectedDate
    ? displayedProductions.filter((p) => {
        const productionDate = new Date(p.production_date)
        return (
          productionDate.getFullYear() === selectedDate.getFullYear() &&
          productionDate.getMonth() === selectedDate.getMonth() &&
          productionDate.getDate() === selectedDate.getDate()
        )
      })
    : displayedProductions

  // Group productions by date
  const groupProductionsByDate = (productions: Production[]) => {
    const groups: { [key: string]: Production[] } = {}
    productions.forEach((p) => {
      const dateKey = new Date(p.production_date).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(p)
    })
    // Sort dates descending (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    return sortedKeys.map(key => ({
      date: key,
      productions: groups[key]
    }))
  }

  const groupedProductions = groupProductionsByDate(filteredProductions)

  const handleAdminLogin = () => {
    if (adminUsername === "ilian" && adminPassword === "ilian123") {
      setIsAdmin(true)
      setShowAdminDialog(false)
      setAdminUsername("")
      setAdminPassword("")
      toast.success("Влязохте като администратор")
    } else {
      toast.error("Грешно потребителско име или парола")
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    setShowAllProductions(false)
    toast.success("Излязохте от администраторски режим")
  }

  if (!currentEmployee) {
    return <div>Зареждане...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 gap-2">
            {/* Logo and Title - Responsive sizing */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <img
                src="/images/design-mode/new-madiks.png"
                alt="Madiks Logo"
                className="h-8 sm:h-12 w-auto flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                  Система за производство
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Добре дошли, {currentEmployee.name}</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {!isAdmin ? (
                <Button
                  variant="outline"
                  onClick={() => setShowAdminDialog(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Админ
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant={showAllProductions ? "default" : "outline"}
                    onClick={() => setShowAllProductions(!showAllProductions)}
                    className={showAllProductions ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {showAllProductions ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Всички производства
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Моите производства
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAdminLogout}
                    className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Изход от админ
                  </Button>
                </div>
              )}
              <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Ново производство
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Изход
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ново производство
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isAdmin ? (
                    <DropdownMenuItem onClick={() => setShowAdminDialog(true)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Админ
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => setShowAllProductions(!showAllProductions)}>
                        {showAllProductions ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Всички производства
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Моите производства
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAdminLogout} className="text-red-600">
                        <Shield className="h-4 w-4 mr-2" />
                        Изход от админ
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Изход
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tasks Section */}
        <Card className="mb-6 sm:mb-8 border-amber-200 bg-amber-50">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              Задачи за днес
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-center py-4 text-gray-600 text-sm">Зареждане на задачи...</div>
            ) : dailyTasks.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <ClipboardList className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-base sm:text-lg font-medium text-gray-600">Няма задачи за днес</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Не са зададени дневни таргети</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-3 sm:p-4 rounded-lg border border-amber-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base truncate">
                          {task.product_name}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Factory className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              <span className="font-medium">Линия:</span> {task.production_line_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600">
                              <span className="font-medium">Таргет:</span> {task.daily_target} кг
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600">
                              <span className="font-medium">Дата:</span> {formatDate(task.target_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-amber-600 text-white ml-2 text-xs whitespace-nowrap">Активна</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {showAllProductions ? "Всички производства" : "Мои производства"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {showAllProductions
                      ? productions.length
                      : productions.filter((p) => p.employee_id === currentEmployee.id || p.partner_employee_id === currentEmployee.id).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Общо количество</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {(showAllProductions
                      ? productions
                      : productions.filter((p) => p.employee_id === currentEmployee.id || p.partner_employee_id === currentEmployee.id)
                    )
                      .reduce((sum, p) => sum + Number(p.quantity), 0)
                      .toFixed(2)}{" "}
                    брой
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Днес</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      (showAllProductions
                        ? productions
                        : productions.filter((p) => p.employee_id === currentEmployee.id || p.partner_employee_id === currentEmployee.id)
                      ).filter((p) => new Date(p.production_date).toDateString() === new Date().toDateString()).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Тази седмица</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      (showAllProductions
                        ? productions
                        : productions.filter((p) => p.employee_id === currentEmployee.id || p.partner_employee_id === currentEmployee.id)
                      ).filter((p) => {
                        const productionDate = new Date(p.production_date)
                        const today = new Date()
                        const weekStart = new Date(today)
                        weekStart.setDate(today.getDate() - today.getDay() + 1)
                        return productionDate >= weekStart && productionDate <= today
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 sm:mb-6">
          <Button
            onClick={() => router.push("/production/statistics")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Седмична статистика
          </Button>
        </div>

        {/* Productions List */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">
                {showAllProductions ? "Всички производства" : "Моите производства"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Изчисти филтър
                  </Button>
                )}
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">
                        {selectedDate ? format(selectedDate, "dd.MM.yyyy", { locale: bg }) : "Избери дата"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        setDatePickerOpen(false)
                      }}
                      locale={bg}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-sm">Зареждане...</div>
            ) : filteredProductions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {selectedDate
                  ? `Няма производства за ${format(selectedDate, "dd.MM.yyyy", { locale: bg })}`
                  : showAllProductions
                    ? "Няма производства"
                    : "Няма ваши производства"}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedProductions.map((group) => (
                  <div key={group.date} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 py-2 border-b border-amber-300">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold text-amber-800 text-sm sm:text-base">
                        {format(new Date(group.date), "EEEE, dd MMMM yyyy", { locale: bg })}
                      </h3>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                        {group.productions.length} {group.productions.length === 1 ? "запис" : "записа"}
                      </Badge>
                    </div>
                    
                    {/* Productions for this date */}
                    <div className="space-y-3 sm:space-y-4">
                      {group.productions.map((production) => {
                        const isProcessed = production.processed
                        return (
                          <div 
                            key={production.id} 
                            className={`p-3 sm:p-4 border rounded-lg transition-all ${
                              isProcessed 
                                ? "bg-green-50 border-green-300 opacity-75" 
                                : "bg-amber-50 border-amber-200"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className={`font-semibold text-sm sm:text-base lg:text-lg ${isProcessed ? "line-through text-gray-500" : ""}`}>
                                    {production.product_name}
                                  </h3>
                                  {isProcessed && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      <Check className="h-3 w-3 mr-1" />
                                      Обработено
                                    </Badge>
                                  )}
                                  {production.employee_id === currentEmployee.id ? (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                                      Мое
                                    </Badge>
                                  ) : production.partner_employee_id === currentEmployee.id ? (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                      Партньор
                                    </Badge>
                                  ) : (
                                    showAllProductions && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                        {production.employee_name}
                                      </Badge>
                                    )
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                  <div className="truncate">
                                    <span className="font-medium">Служител:</span> {production.employee_name}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-medium">Линия:</span> {production.production_line_name}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-medium">Партньор:</span> {production.partner_name}
                                  </div>
                                  <div>
                                    <span className="font-medium">Количество:</span> {production.quantity} брой
                                  </div>
                                  {production.notes && (
                                    <div className="sm:col-span-2">
                                      <span className="font-medium">Бележки:</span> {production.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:ml-4 justify-end sm:justify-start">
                                {/* Processed Checkbox */}
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`processed-${production.id}`}
                                    checked={isProcessed}
                                    onCheckedChange={() => toggleProcessed(production.id, production.processed)}
                                    className={isProcessed ? "border-green-500 data-[state=checked]:bg-green-500" : ""}
                                  />
                                  <label 
                                    htmlFor={`processed-${production.id}`}
                                    className="text-xs sm:text-sm cursor-pointer select-none text-gray-600"
                                  >
                                    Обработено
                                  </label>
                                </div>
                                
                                {canEdit(production) && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(production)}
                                      className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(production.id)}
                                      className="text-red-600 hover:text-red-700 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forms */}
      {showForm && (
        <ProductionForm
          productionLines={productionLines}
          partners={partners}
          onClose={() => setShowForm(false)}
          onSuccess={refreshProductions}
        />
      )}

      {editingProduction && (
        <EditProductionForm
          production={editingProduction}
          productionLines={productionLines}
          partners={partners}
          onClose={() => setEditingProduction(null)}
          onSuccess={refreshProductions}
        />
      )}

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Администраторски вход</DialogTitle>
            <DialogDescription>
              Въведете администраторски потребителско име и парола за достъп до всички производства.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Потребителско име</Label>
              <Input
                id="admin-username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Въведете потребителско име"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Парола</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Въведете парола"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleAdminLogin} className="bg-blue-600 hover:bg-blue-700">
              Вход
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
