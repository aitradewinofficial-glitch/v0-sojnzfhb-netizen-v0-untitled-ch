"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Edit, Trash2, Search, RefreshCw, UserPlus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StoreQrButton, ExportQrButton } from "./store-qr"

// Типове за клиенти
interface Customer {
  id: string
  objectid: string
  storename: string
  companyname?: string
  phone?: string
  type: string
  discountpercent: string
  createdat: string
  pending: boolean
  deleted: boolean
  createdbyadmin: boolean
}

// Типове за пагинация
interface Pagination {
  total: number
  pages: number
  page: number
  limit: number
}

export default function UsersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [route, setRoute] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Функция за зареждане на клиенти
  const loadCustomers = async (page = 1) => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    try {
      // Добавяме timestamp за избягване на кеширане
      const timestamp = new Date().getTime()
      const routeParam = route === "all" ? "" : route

      const url = `/api/admin/customers?page=${page}&limit=${pagination.limit}&search=${encodeURIComponent(search)}&route=${encodeURIComponent(routeParam)}&t=${timestamp}`
      console.log("Заявка към:", url)

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error text:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Получени данни:", data)

      // Запазване на debug информация, ако има такава
      if (data.debug) {
        setDebugInfo(data.debug)
        console.log("Debug информация:", data.debug)
      }

      // Проверка дали customers е масив
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers)
      } else {
        console.error("Получените данни не са масив:", data.customers)
        setCustomers([])
        setError("Получените данни не са във валиден формат")
      }

      setPagination(data.pagination || { total: 0, pages: 1, page: 1, limit: 10 })
    } catch (error) {
      console.error("Грешка при зареждане на клиентите:", error)
      setError(`Възникна проблем при зареждане на клиентите: ${error.message}`)
      setCustomers([]) // Задаваме празен масив при грешка
      toast({
        title: "Грешка",
        description: "Възникна проблем при зареждане на клиентите",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Зареждане на клиентите при първоначално зареждане и при промяна на филтрите
  useEffect(() => {
    loadCustomers(1)
  }, [route])

  // Функция за търсене
  const handleSearch = () => {
    loadCustomers(1)
  }

  // Функция за промяна на страницата
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadCustomers(newPage)
    }
  }

  // Функция за изтриване на клиент
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return

    try {
      const response = await fetch(`/api/admin/customers/${customerToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Грешка при изтриване на клиента")
      }

      toast({
        title: "Успешно",
        description: "Клиентът беше изтрит успешно",
      })

      // Презареждане на клиентите
      loadCustomers(pagination.page)
    } catch (error) {
      console.error("Грешка при изтриване на клиента:", error)
      toast({
        title: "Грешка",
        description: "Възникна проблем при изтриване на клиента",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    }
  }

  // Функция за форматиране на дата
  const formatDate = (dateString: string) => {
    if (!dateString) return "Няма данни"

    // Проверка дали dateString е JSON обект
    if (typeof dateString === "object" || (typeof dateString === "string" && dateString.startsWith("{"))) {
      try {
        const dateObj = typeof dateString === "string" ? JSON.parse(dateString) : dateString
        if (dateObj.seconds) {
          // Ако е Firestore timestamp формат
          const date = new Date(dateObj.seconds * 1000)
          return new Intl.DateTimeFormat("bg-BG", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(date)
        }
        return "Невалидна дата"
      } catch (e) {
        return "Невалидна дата"
      }
    }

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("bg-BG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Функция за получаване на цвят на бадж според типа
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "retailer":
        return "bg-green-500"
      case "wholesaler":
        return "bg-blue-500"
      case "admin":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Функция за превод на тип клиент
  const translateType = (type: string) => {
    switch (type) {
      case "retailer":
        return "Търговец на дребно"
      case "wholesaler":
        return "Търговец на едро"
      case "standard":
        return "Стандартен клиен��"
      default:
        return type || "Неопределен"
    }
  }

  // Функция за превод на статус
  const translateStatus = (pending: boolean, deleted: boolean) => {
    if (deleted) return "Деактивиран"
    if (pending) return "Изчакващ одобрение"
    return "Активен"
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Управление на клиенти</CardTitle>
              <CardDescription className="text-gray-600">Управлявайте клиентите и техните акаунти</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ExportQrButton />
              <Button
                onClick={() => router.push("/admin-panel/users/add")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Добави клиент
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Филтри и търсене */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Търсене по име, компания или имейл..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline" className="bg-white">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger className="w-[220px] bg-white">
                  <SelectValue placeholder="Всички маршрути" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички маршрути</SelectItem>
                  <SelectItem value="Русе - Силистра">Русе - Силистра</SelectItem>
                  <SelectItem value="Шумен">Шумен</SelectItem>
                  <SelectItem value="Варна">Варна</SelectItem>
                  <SelectItem value="Централен - Габрово">Централен - Габрово</SelectItem>
                  <SelectItem value="Централен - Плевен">Централен - Плевен</SelectItem>
                  <SelectItem value="Видин">Видин</SelectItem>
                  <SelectItem value="Петрич">Петрич</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => loadCustomers(1)} variant="outline" className="bg-white" title="Обнови">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Съобщение за грешка */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Грешка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Debug информация */}
          {debugInfo && (
            <div className="bg-gray-100 p-4 rounded-md mb-4 text-sm overflow-auto">
              <h3 className="font-semibold mb-2">Debug информация:</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {/* Таблица с клиенти */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : !Array.isArray(customers) ? (
            <div className="text-center py-8 text-red-500">
              Грешка при зареждане на клиентите. Моля, опитайте отново.
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Няма намерени клиенти</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Магазин/Компания</TableHead>
                    <TableHead className="font-semibold">Имейл</TableHead>
                    <TableHead className="font-semibold">Тип</TableHead>
                    <TableHead className="font-semibold">Телефон</TableHead>
                    <TableHead className="font-semibold">Отстъпка</TableHead>
                    <TableHead className="font-semibold">Статус</TableHead>
                    <TableHead className="font-semibold text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {customer.storename || customer.companyname || "Няма име"}
                      </TableCell>
                      <TableCell>{customer.objectid}</TableCell>
                      <TableCell>
                        <Badge className={`${getTypeBadgeColor(customer.type)} text-white`}>
                          {translateType(customer.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.phone || "Няма телефон"}</TableCell>
                      <TableCell>{customer.discountpercent || "0"}%</TableCell>
                      <TableCell>
                        {customer.deleted ? (
                          <Badge className="bg-gray-500 text-white">Деактивиран</Badge>
                        ) : customer.pending ? (
                          <Badge className="bg-yellow-500 text-white">Изчакващ</Badge>
                        ) : (
                          <Badge className="bg-green-500 text-white">Активен</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <StoreQrButton
                            storeId={customer.id}
                            storeName={customer.storename || customer.companyname || "Магазин"}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white"
                            onClick={() => router.push(`/admin-panel/users/edit/${customer.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Редактирай</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white text-red-500 hover:text-red-600"
                            onClick={() => {
                              setCustomerToDelete(customer)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Изтрий</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Пагинация */}
          {!loading && Array.isArray(customers) && pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Показване на {(pagination.page - 1) * pagination.limit + 1} до{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} от {pagination.total} клиенти
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.pages ||
                      (page >= pagination.page - 1 && page <= pagination.page + 1),
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <Button variant="outline" size="sm" disabled className="bg-white">
                          ...
                        </Button>
                      )}
                      <Button
                        variant={pagination.page === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={pagination.page === page ? "bg-blue-600" : "bg-white"}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t p-4">
          <div className="text-sm text-gray-500">
            Общо клиенти: {pagination.total} | Страница {pagination.page} от {pagination.pages}
          </div>
        </CardFooter>
      </Card>

      {/* Диалог за потвърждение на изтриване */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Потвърждение за изтриване</DialogTitle>
            <DialogDescription>
              Сигурни ли сте, че искате да изтриете клиента{" "}
              <span className="font-semibold">{customerToDelete?.storename || customerToDelete?.companyname}</span>?
              <br />
              Това действие ще изтрие клиента завинаги от базата данни и не може да бъде отменено.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="bg-white">
              Отказ
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Изтрий
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
