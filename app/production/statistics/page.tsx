"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getCurrentEmployee } from "@/lib/production-auth"
import { checkAdminCredentials, setAdminSession, clearAdminSession, isAdminAuthenticated } from "@/lib/statistics-auth"
import {
  ChevronLeft,
  ArrowLeft,
  TrendingUp,
  Users,
  Target,
  Banknote,
  Lock,
  LogOut,
  CalendarIcon,
  DollarSign,
  ChevronRight,
  Package,
} from "lucide-react"
import { toast } from "sonner"

interface WeeklyStats {
  weekStart: string
  weekEnd: string
  employees: {
    id: number
    name: string
    baseSalary: number
    dailyCoefficients: { [date: string]: number }
    dailySalaries: { [date: string]: number }
    weeklyAverage: number
    weeklySalary: number
  }[]
  workingDays: string[]
  productSales: {
    productName: string
    productId: number
    productionLineId: number
    dailySales: { [date: string]: { quantity: number; value: number; price: number } }
    totalQuantity: number
    totalValue: number
    salesValue: number
    dailyTarget: number
    dailyPrices: { [date: string]: number }
  }[]
}

const BGN_TO_EUR = 1.95583

function toEur(bgn: number): number {
  return bgn / BGN_TO_EUR
}

export default function ProductionStatistics() {
  const [currentEmployee, setCurrentEmployee] = useState<any>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [currentStartDate, setCurrentStartDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<{
    productId: number
    productionLineId: number
    date: string
  } | null>(null)
  const [tempPrice, setTempPrice] = useState("")
  const router = useRouter()

  useEffect(() => {
    const employee = getCurrentEmployee()
    if (!employee) {
      router.push("/production")
      return
    }
    setCurrentEmployee(employee)
    setIsAdmin(isAdminAuthenticated())
  }, [router])

  useEffect(() => {
    if (currentEmployee) {
      fetchWeeklyStats()
    }
  }, [currentEmployee, currentStartDate])

  const fetchWeeklyStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentStartDate) {
        const dateString = currentStartDate.toISOString().split("T")[0]
        params.append("startDate", dateString)
        console.log("[v0] Fetching stats with startDate:", dateString)
      }

      const response = await fetch(`/api/production/statistics?${params.toString()}`, {
        headers: {
          "x-employee-id": currentEmployee?.id?.toString() || "",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Received stats:", {
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          workingDays: data.workingDays,
        })
        setWeeklyStats(data)
      } else {
        toast.error("Грешка при зареждане на статистиките")
      }
    } catch (error) {
      console.error("Error fetching weekly stats:", error)
      toast.error("Грешка при зареждане на статистиките")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  const getDayName = (dateString: string) => {
    const date = new Date(dateString)
    const dayNames = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    return dayNames[date.getDay()]
  }

  const getCoefficientColor = (coefficient: number) => {
    if (coefficient >= 1.0) return "text-green-600 font-bold"
    if (coefficient >= 0.8) return "text-yellow-600 font-semibold"
    return "text-red-600"
  }

  const getCoefficientBgColor = (coefficient: number) => {
    if (coefficient >= 1.0) return "bg-green-50"
    if (coefficient >= 0.8) return "bg-yellow-50"
    return "bg-red-50"
  }

  const getRowBgColor = (weeklyAverage: number) => {
    if (weeklyAverage >= 1.15) return "bg-green-800/10" // Dark green for ≥115%
    if (weeklyAverage >= 1.0) return "bg-green-500/10" // Light green for 100-115%
    if (weeklyAverage >= 0.85) return "bg-red-400/10" // Light red for 85-100%
    return "bg-red-700/10" // Dark red for <85%
  }

  const getRowBorderColor = (weeklyAverage: number) => {
    if (weeklyAverage >= 1.15) return "border-l-4 border-green-800"
    if (weeklyAverage >= 1.0) return "border-l-4 border-green-500"
    if (weeklyAverage >= 0.85) return "border-l-4 border-red-400"
    return "border-l-4 border-red-700"
  }

  const getSalaryColor = (salary: number, baseSalary: number) => {
    if (salary >= baseSalary) return "text-green-600 font-bold"
    if (salary >= baseSalary * 0.8) return "text-yellow-600 font-semibold"
    return "text-red-600"
  }

  const getSalaryBgColor = (salary: number, baseSalary: number) => {
    if (salary >= baseSalary) return "bg-green-50"
    if (salary >= baseSalary * 0.8) return "bg-yellow-50"
    return "bg-red-50"
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkAdminCredentials(adminUsername, adminPassword)) {
      setAdminSession()
      setIsAdmin(true)
      setShowAdminLogin(false)
      setAdminUsername("")
      setAdminPassword("")
      toast.success("Успешно влизане като администратор")
    } else {
      toast.error("Грешно потребителско име или парола")
    }
  }

  const handleAdminLogout = () => {
    clearAdminSession()
    setIsAdmin(false)
    toast.success("Успешно излизане")
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const selected = new Date(date)
    selected.setHours(0, 0, 0, 0)

    const year = selected.getFullYear()
    const month = String(selected.getMonth() + 1).padStart(2, "0")
    const day = String(selected.getDate()).padStart(2, "0")
    const dateString = `${year}-${month}-${day}`

    console.log("[v0] Selected date from calendar:", date)
    console.log("[v0] Selected date after setHours:", selected)
    console.log("[v0] Formatted date string (local):", dateString)

    setCurrentStartDate(selected)
    setSelectedDate(date)
    setIsCalendarOpen(false)
    toast.success(`Избрана седмица: ${formatDate(dateString)}`)
  }

  const handleJumpToCurrentWeek = () => {
    setCurrentStartDate(null)
    setSelectedDate(undefined)
    toast.success("Показване на текущата седмица")
  }

  const handlePreviousWeek = () => {
    const newStartDate = new Date(currentStartDate || new Date())
    newStartDate.setDate(newStartDate.getDate() - 7)
    setCurrentStartDate(newStartDate)
    setSelectedDate(newStartDate)
  }

  const handleNextWeek = () => {
    if (!currentStartDate) {
      const newStartDate = new Date()
      newStartDate.setDate(newStartDate.getDate() + 7)
      setCurrentStartDate(newStartDate)
      setSelectedDate(newStartDate)
    } else {
      const newStartDate = new Date(currentStartDate)
      newStartDate.setDate(newStartDate.getDate() + 7)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (newStartDate <= today) {
        setCurrentStartDate(newStartDate)
        setSelectedDate(newStartDate)
      }
    }
  }

  const canGoToNextWeek = () => {
    if (!currentStartDate) return false
    const nextWeekStart = new Date(currentStartDate)
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return nextWeekStart <= today
  }

  const getWeeksAgoText = () => {
    if (!currentStartDate) return "Текуща седмица"

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(currentStartDate)
    start.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weeksAgo = Math.floor(diffDays / 7)

    if (weeksAgo === 0) return "Текуща седмица"
    if (weeksAgo === 1) return "1 седмица назад"
    return `${weeksAgo} седмици назад`
  }

  const updateDailyPrice = async (productId: number, productionLineId: number, date: string, price: number) => {
    try {
      const response = await fetch("/api/production/statistics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          productionLineId,
          date,
          price,
        }),
      })

      if (response.ok) {
        toast.success("Цената е актуализирана успешно")
        fetchWeeklyStats()
      } else {
        toast.error("Грешка при актуализиране на цената")
      }
    } catch (error) {
      console.error("Error updating price:", error)
      toast.error("Грешка при актуализиране на цената")
    }
  }

  const handlePriceEdit = (productId: number, productionLineId: number, date: string, currentPrice: number) => {
    setEditingPrice({ productId, productionLineId, date })
    setTempPrice(currentPrice.toFixed(2))
  }

  const handlePriceSave = () => {
    if (editingPrice && tempPrice) {
      const price = Number.parseFloat(tempPrice)
      if (!isNaN(price) && price > 0) {
        updateDailyPrice(editingPrice.productId, editingPrice.productionLineId, editingPrice.date, price)
        setEditingPrice(null)
        setTempPrice("")
      } else {
        toast.error("Невалидна цена")
      }
    }
  }

  const handlePriceCancel = () => {
    setEditingPrice(null)
    setTempPrice("")
  }

  if (!currentEmployee) {
    return <div className="text-gray-500">Зареждане...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-4 lg:py-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <Button variant="outline" onClick={() => router.push("/production/dashboard")} className="shadow-sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/images/design-mode/new-madiks.png" alt="Madiks Logo" className="h-10 sm:h-12 w-auto" />
                <div className="border-l border-gray-300 pl-3 sm:pl-4">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Седмична статистика</h1>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    Коефициенти и заплащане спрямо таргетите
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isAdmin ? (
                <>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200 px-2 sm:px-3 py-1 text-xs sm:text-sm"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Администратор</span>
                    <span className="sm:hidden">Админ</span>
                  </Badge>
                  <Button variant="outline" onClick={handleAdminLogout} className="shadow-sm bg-transparent text-sm">
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Изход</span>
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setShowAdminLogin(true)} className="shadow-sm text-sm">
                  <Lock className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Админ вход</span>
                  <span className="sm:hidden">Вход</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Администраторски вход</DialogTitle>
            <DialogDescription>Въведете администраторски данни за достъп до секцията "Заплащане"</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Потребителско име</Label>
              <Input
                id="username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Въведете потребителско име"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Въведете парола"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAdminLogin(false)}>
                Отказ
              </Button>
              <Button type="submit">Вход</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-base sm:text-lg text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              Зареждане на данни...
            </div>
          </div>
        ) : weeklyStats ? (
          <>
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={handlePreviousWeek}
                className="shadow-sm hover:shadow-md transition-shadow bg-transparent w-full lg:w-auto text-sm sm:text-base"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Предишна седмица
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="text-center bg-white rounded-lg shadow-sm px-4 sm:px-6 py-3 sm:py-4 border">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                    {formatDate(weeklyStats.weekStart)} - {formatDate(weeklyStats.weekEnd)}
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">{getWeeksAgoText()}</p>
                </div>

                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="shadow-sm hover:shadow-md transition-shadow bg-transparent w-full sm:w-auto text-sm sm:text-base"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Избери седмица
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <div className="p-3 border-b bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">Изберете начална дата</p>
                      <p className="text-xs text-gray-500 mt-1">Ще се покаже 7-дневен период от тази дата</p>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                    {currentStartDate && (
                      <div className="p-3 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleJumpToCurrentWeek}
                          className="w-full bg-transparent"
                        >
                          Към текущата седмица
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                onClick={handleNextWeek}
                disabled={!canGoToNextWeek()}
                className="shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 bg-transparent w-full lg:w-auto text-sm sm:text-base"
              >
                Следваща седмица
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6 sm:mb-8">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Коефициенти по дни
                </CardTitle>
                <p className="text-blue-100 text-xs sm:text-sm mt-2">
                  Коефициент = Произведено количество / Дневен таргет. Седмичният % се изчислява само от дните с работа
                  (коефициент {">"} 0).
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left p-2 sm:p-4 font-bold text-gray-700 text-xs sm:text-sm sticky left-0 bg-gray-50 z-10">
                          Служител
                        </th>
                        {weeklyStats.workingDays.map((date) => (
                          <th
                            key={date}
                            className="text-center p-2 sm:p-4 font-bold text-gray-700 min-w-[70px] sm:min-w-[90px] text-xs sm:text-sm"
                          >
                            <div>{getDayName(date)}</div>
                            <div className="text-[10px] sm:text-xs font-normal">{formatDate(date)}</div>
                          </th>
                        ))}
                        <th className="text-center p-2 sm:p-4 font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 text-xs sm:text-sm sticky right-0 z-10">
                          Средно %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyStats.employees.map((employee, index) => (
                        <tr
                          key={employee.id}
                          className={`border-b hover:opacity-90 transition-all ${getRowBgColor(employee.weeklyAverage)} ${getRowBorderColor(employee.weeklyAverage)}`}
                        >
                          <td className="p-2 sm:p-4 font-semibold text-gray-800 text-xs sm:text-sm sticky left-0 bg-inherit z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="truncate max-w-[100px] sm:max-w-none">{employee.name}</span>
                              {employee.id === currentEmployee.id && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] sm:text-xs w-fit"
                                >
                                  Вие
                                </Badge>
                              )}
                            </div>
                          </td>
                          {weeklyStats.workingDays.map((date) => {
                            const coefficient = employee.dailyCoefficients[date] || 0
                            return (
                              <td
                                key={date}
                                className={`text-center p-2 sm:p-4 ${getCoefficientBgColor(coefficient)} border-l border-gray-100`}
                              >
                                <span className={`${getCoefficientColor(coefficient)} font-bold text-xs sm:text-sm`}>
                                  {(coefficient * 100).toFixed(0)}%
                                </span>
                              </td>
                            )
                          })}
                          <td
                            className={`text-center p-2 sm:p-4 font-bold bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-200 sticky right-0 z-10`}
                          >
                            <span
                              className={`${getCoefficientColor(employee.weeklyAverage)} text-sm sm:text-base lg:text-lg`}
                            >
                              {(employee.weeklyAverage * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6 sm:mb-8">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />
                    Заплащане по дни
                  </CardTitle>
                  <p className="text-green-100 text-xs sm:text-sm mt-2">
                    Дневна заплата = Базова заплата × Коефициент. Всеки служител има индивидуална базова заплата според
                    нивото си.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left p-2 sm:p-4 font-bold text-gray-700 text-xs sm:text-sm sticky left-0 bg-gray-50 z-10">
                            Служител
                          </th>
                          <th className="text-center p-2 sm:p-4 font-bold text-gray-700 text-xs sm:text-sm">
                            <span className="hidden sm:inline">Базова заплата/ден</span>
                            <span className="sm:hidden">База/ден</span>
                          </th>
                          {weeklyStats.workingDays.map((date) => (
                            <th
                              key={date}
                              className="text-center p-2 sm:p-4 font-bold text-gray-700 min-w-[70px] sm:min-w-[90px] text-xs sm:text-sm"
                            >
                              <div>{getDayName(date)}</div>
                              <div className="text-[10px] sm:text-xs font-normal">{formatDate(date)}</div>
                            </th>
                          ))}
                          <th className="text-center p-2 sm:p-4 font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm sticky right-0 z-10">
                            <span className="hidden sm:inline">Общо за седмицата</span>
                            <span className="sm:hidden">Общо</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyStats.employees.map((employee, index) => (
                          <tr
                            key={employee.id}
                            className={`border-b hover:opacity-90 transition-all ${getRowBgColor(employee.weeklyAverage)} ${getRowBorderColor(employee.weeklyAverage)}`}
                          >
                            <td className="p-2 sm:p-4 font-semibold text-gray-800 text-xs sm:text-sm sticky left-0 bg-inherit z-10">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="truncate max-w-[100px] sm:max-w-none">{employee.name}</span>
                                {employee.id === currentEmployee.id && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] sm:text-xs w-fit"
                                  >
                                    Вие
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="text-center p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                              {toEur(employee.baseSalary).toFixed(2)} €
                            </td>
                            {weeklyStats.workingDays.map((date) => {
                              const salary = employee.dailySalaries[date] || 0
                              return (
                                <td
                                  key={date}
                                  className={`text-center p-2 sm:p-4 ${getSalaryBgColor(salary, employee.baseSalary)} border-l border-gray-100`}
                                >
                                  <span
                                    className={`${getSalaryColor(salary, employee.baseSalary)} font-bold text-xs sm:text-sm`}
                                  >
                                    {toEur(salary).toFixed(2)} €
                                  </span>
                                </td>
                              )
                            })}
                            <td
                              className={`text-center p-2 sm:p-4 font-bold bg-gradient-to-r from-green-50 to-emerald-50 border-l-2 border-green-200 sticky right-0 z-10`}
                            >
                              <span
                                className={`${getSalaryColor(employee.weeklySalary, employee.baseSalary * 7)} text-sm sm:text-base lg:text-lg`}
                              >
                                {toEur(employee.weeklySalary).toFixed(2)} €
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 sm:p-6 bg-gray-50 border-t">
                    <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-100 border-2 border-green-300 rounded-md"></div>
                        <span className="text-green-700 font-bold">≥ База</span>
                        <span className="text-gray-600 hidden sm:inline">Пълна или по-висока заплата</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-100 border-2 border-yellow-300 rounded-md"></div>
                        <span className="text-yellow-700 font-bold">80-99%</span>
                        <span className="text-gray-600 hidden sm:inline">Близо до пълна заплата</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-100 border-2 border-red-300 rounded-md"></div>
                        <span className="text-red-700 font-bold">&lt; 80%</span>
                        <span className="text-gray-600 hidden sm:inline">Под очакваната заплата</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAdmin && weeklyStats.productSales && weeklyStats.productSales.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6 sm:mb-8">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    Продажна стойност по продукти
                  </CardTitle>
                  <p className="text-amber-100 text-xs sm:text-sm mt-2">
                    Продажна стойност = Произведено количество × Цена на продукта. Показва реалната стойност на
                    произведените продукти.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left p-2 sm:p-4 font-bold text-gray-700 text-xs sm:text-sm sticky left-0 bg-gray-50 z-10">
                            Продукт
                          </th>
                          {weeklyStats.workingDays.map((date) => (
                            <th
                              key={date}
                              className="text-center p-2 sm:p-4 font-bold text-gray-700 min-w-[90px] sm:min-w-[120px] text-xs sm:text-sm"
                            >
                              <div>{getDayName(date)}</div>
                              <div className="text-[10px] sm:text-xs font-normal">{formatDate(date)}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyStats.productSales.map((product, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-2 sm:p-4 font-semibold text-gray-800 text-xs sm:text-sm sticky left-0 bg-white z-10 truncate max-w-[120px] sm:max-w-none">
                              {product.productName}
                            </td>
                            {weeklyStats.workingDays.map((date) => {
                              const daySale = product.dailySales[date]
                              const dayPrice = product.dailyPrices[date] || product.salesValue
                              const isEditing =
                                editingPrice?.productId === product.productId &&
                                editingPrice?.productionLineId === product.productionLineId &&
                                editingPrice?.date === date

                              return (
                                <td key={date} className="text-center p-2 sm:p-4 border-l border-gray-100">
                                  <div className="space-y-1">
                                    {/* Price input */}
                                    <div className="flex items-center justify-center gap-1">
                                      {isEditing ? (
                                        <>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={tempPrice}
                                            onChange={(e) => setTempPrice(e.target.value)}
                                            className="w-16 h-6 text-xs p-1"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handlePriceSave()
                                              if (e.key === "Escape") handlePriceCancel()
                                            }}
                                          />
                                          <button
                                            onClick={handlePriceSave}
                                            className="text-green-600 hover:text-green-700"
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={handlePriceCancel}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            ✕
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handlePriceEdit(product.productId, product.productionLineId, date, dayPrice)
                                          }
                                          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                          {toEur(dayPrice).toFixed(2)} €
                                        </button>
                                      )}
                                    </div>
                                    {/* Quantity and value */}
                                    {daySale ? (
                                      <>
                                        <div className="text-xs sm:text-sm font-medium text-gray-700">
                                          {daySale.quantity} бр
                                        </div>
                                        <div className="text-xs sm:text-sm font-bold text-amber-600">
                                          {toEur(daySale.value).toFixed(2)} €
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs sm:text-sm text-gray-400">-</div>
                                    )}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                        <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-400 font-bold">
                          <td className="p-2 sm:p-4 text-gray-800 text-xs sm:text-sm sticky left-0 bg-gradient-to-r from-amber-50 to-orange-50 z-10">
                            Общо за деня
                          </td>
                          {weeklyStats.workingDays.map((date) => {
                            const dailyTotal = weeklyStats.productSales.reduce((sum, product) => {
                              const daySale = product.dailySales[date]
                              return sum + (daySale ? daySale.value : 0)
                            }, 0)

                            return (
                              <td key={date} className="text-center p-2 sm:p-4 border-l border-gray-100">
                                <div className="text-sm sm:text-base font-bold text-amber-700">
                                  {dailyTotal > 0 ? `${toEur(dailyTotal).toFixed(2)} €` : "-"}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 sm:p-6 bg-amber-50 border-t">
                    <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-amber-800">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium text-center">
                        Продажната стойност показва реалната парична стойност на произведените продукти за проследяване
                        на рентабилността
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {weeklyStats.employees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
                        <p className="text-xs sm:text-sm font-bold text-green-700 uppercase tracking-wide">
                          <span className="hidden sm:inline">Най-висок коефициент</span>
                          <span className="sm:hidden">Най-висок</span>
                        </p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">
                        {Math.max(...weeklyStats.employees.map((e) => e.weeklyAverage)).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2" />
                        <p className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wide">
                          <span className="hidden sm:inline">Среден коефициент</span>
                          <span className="sm:hidden">Среден</span>
                        </p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                        {(
                          weeklyStats.employees.reduce((sum, e) => sum + e.weeklyAverage, 0) /
                          weeklyStats.employees.length
                        ).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {isAdmin && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 mr-2" />
                          <p className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wide">
                            <span className="hidden sm:inline">Най-висока заплата</span>
                            <span className="sm:hidden">Най-висока</span>
                          </p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                          {toEur(Math.max(...weeklyStats.employees.map((e) => e.weeklySalary))).toFixed(0)} €
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2" />
                        <p className="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wide">
                          <span className="hidden sm:inline">Служители над таргет</span>
                          <span className="sm:hidden">Над таргет</span>
                        </p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                        {weeklyStats.employees.filter((e) => e.weeklyAverage >= 1.0).length} /{" "}
                        {weeklyStats.employees.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {isAdmin && weeklyStats.productSales && weeklyStats.productSales.length > 0 && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 mr-2" />
                          <p className="text-xs sm:text-sm font-bold text-teal-700 uppercase tracking-wide">
                            <span className="hidden sm:inline">Седмично производство</span>
                            <span className="sm:hidden">Седмично</span>
                          </p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-teal-600">
                          {weeklyStats.productSales.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString("bg-BG")} бр
                        </p>
                        <p className="text-xs sm:text-sm text-teal-600 font-medium mt-1">
                          {toEur(weeklyStats.productSales.reduce((sum, p) => sum + p.totalValue, 0)).toFixed(2)} €
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 sm:mb-4">
                      Няма данни за показване
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 max-w-md">
                      Все още няма служители с настроени таргети или производствени данни за тази седмица.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="text-center font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">
                Легенда за цветово кодиране на редове
              </h3>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-800/20 border-l-4 border-green-800 rounded-sm"></div>
                  <span className="text-green-800 font-bold">≥ 115%</span>
                  <span className="text-gray-600 hidden sm:inline">Над таргет</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500/20 border-l-4 border-green-500 rounded-sm"></div>
                  <span className="text-green-600 font-bold">100-115%</span>
                  <span className="text-gray-600 hidden sm:inline">Изпълнен таргет</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-400/20 border-l-4 border-red-400 rounded-sm"></div>
                  <span className="text-red-500 font-bold">85-100%</span>
                  <span className="text-gray-600 hidden sm:inline">Под таргет</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-700/20 border-l-4 border-red-700 rounded-sm"></div>
                  <span className="text-red-700 font-bold">&lt; 85%</span>
                  <span className="text-gray-600 hidden sm:inline">Значително под таргет</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">Грешка при зареждане на данните</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
