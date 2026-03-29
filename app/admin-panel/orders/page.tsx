"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  RefreshCw,
  Package,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Store,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  Gift,
  Info,
  FileSpreadsheet,
  Trash2,
  Bell,
  BellRing,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { exportOrdersToExcel } from "@/lib/excel-export"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [customers, setCustomers] = useState({})
  const { toast } = useToast()

  const [selectedOrders, setSelectedOrders] = useState({})
  const [selectAll, setSelectAll] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState(null)
  const [orderToDelete, setOrderToDelete] = useState(null)

  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isPolling, setIsPolling] = useState(false)
  const [audioContext, setAudioContext] = useState(null)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    const setupAndFetch = async () => {
      try {
        await fetch("/api/setup-tables")
        await fetchCustomers()
        fetchOrders()
      } catch (error) {
        console.error("Error setting up tables:", error)
        setError("Грешка при настройка на базата данни")
        setLoading(false)
      }
    }
    setupAndFetch()
  }, [])

  useEffect(() => {
    if (!notificationsEnabled) return

    const pollInterval = setInterval(() => {
      checkForNewOrders()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(pollInterval)
  }, [lastOrderCount, notificationsEnabled])

  const checkForNewOrders = async () => {
    if (isPolling) return

    setIsPolling(true)
    try {
      const response = await fetch("/api/admin/orders")
      if (!response.ok) return

      const data = await response.json()
      const currentOrderCount = data.orders?.length || 0

      // If we have more orders than before, show notification
      if (lastOrderCount > 0 && currentOrderCount > lastOrderCount) {
        const newOrdersDiff = currentOrderCount - lastOrderCount
        setNewOrdersCount((prev) => prev + newOrdersDiff)

        // Get the new orders
        const newOrders = data.orders.slice(0, newOrdersDiff)

        // Show toast notification for each new order
        newOrders.forEach((order) => {
          toast({
            title: "🔔 Нова поръчка!",
            description: `Поръчка #${order.orderId} от ${order.customerName} - ${convertBgnToEur(order.totalAmount).toFixed(2)} €`,
            duration: 10000,
          })
        })

        // Play notification sound
        playNotificationSound()

        // Update orders list
        setOrders(data.orders || [])
      }

      setLastOrderCount(currentOrderCount)
    } catch (error) {
      console.error("Error checking for new orders:", error)
    } finally {
      setIsPolling(false)
    }
  }

  const playNotificationSound = () => {
    try {
      if (!audioContext) {
        console.log("Audio context not initialized yet")
        return
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure sound: 800Hz beep
      oscillator.frequency.value = 800
      oscillator.type = "sine"

      // Fade in and out for smoother sound
      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2)

      // Play the sound
      oscillator.start(now)
      oscillator.stop(now + 0.2)

      console.log("[v0] Notification sound played")
    } catch (error) {
      console.log("Could not play notification sound:", error)
    }
  }

  const clearNewOrdersBadge = () => {
    setNewOrdersCount(0)
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/customers")
      if (response.ok) {
        const data = await response.json()
        const customersMap = {}
        data.customers.forEach((customer) => {
          customersMap[customer.email] = customer
        })
        setCustomers(customersMap)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    if (!initialCheckDone) {
      clearNewOrdersBadge()
    }

    try {
      const response = await fetch("/api/admin/orders")
      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }
      const data = await response.json()

      // --- НАЧАЛО НА КОРЕКЦИЯТА ---
      // Обработваме поръчките, като запазваме оригиналния 'freeCount' на артикулите от базата данни.
      // Добавяме 'categoryPath' за показване, ако липсва.
      const processedOrders = data.orders.map((order) => {
        const itemsFromDb = getOrderItems(order) // Тези артикули трябва да имат 'freeCount' от БД

        const itemsForDisplay = itemsFromDb.map((item) => {
          // Запазваме оригиналния item.freeCount от базата данни.
          // Не го преизчисляваме тук.
          // Осигуряваме categoryPath за показване.
          return {
            ...item,
            categoryPath: item.categoryPath || item.categoryName || item.subcategoryName || "Липсва категория",
          }
        })
        // --- КРАЙ НА КОРЕКЦИЯТА ---

        console.log(
          `Order ${order.orderId} items for display:`,
          itemsForDisplay.map((it) => ({ title: it.title, freeCount: it.freeCount, qty: it.quantity })),
        )

        return {
          ...order,
          items: itemsForDisplay, // Използваме артикулите с оригиналния freeCount
        }
      })

      console.log("Processed orders for display:", processedOrders)
      setOrders(processedOrders || [])

      if (!initialCheckDone) {
        const newStatusOrders = processedOrders.filter((order) => order.status === "new")
        setNewOrdersCount(newStatusOrders.length)
        setLastOrderCount(processedOrders?.length || 0)
        setInitialCheckDone(true)

        // Show notification for existing new orders
        if (newStatusOrders.length > 0 && notificationsEnabled) {
          playNotificationSound()
        }
      } else {
        setLastOrderCount(processedOrders?.length || 0)
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err.message || "Грешка при зареждане на поръчките")
      toast({
        title: "Грешка",
        description: "Възникна проблем при зареждането на поръчките.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const response = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

      if (orders.find((order) => order.id === orderId)?.status === "new" && newStatus !== "new") {
        setNewOrdersCount((prev) => Math.max(0, prev - 1))
      }

      toast({
        title: "Успешно обновен статус",
        description: `Статусът на поръчката беше променен на "${getStatusLabel(newStatus)}"`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Грешка",
        description: "Възникна проблем при обновяването на статуса.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const deleteOrder = async (orderId) => {
    setDeletingOrderId(orderId)
    try {
      const response = await fetch(`/api/admin/orders/delete?id=${orderId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete order")
      }

      setOrders(orders.filter((order) => order.id !== orderId))

      setSelectedOrders((prev) => {
        const newSelectedOrders = { ...prev }
        delete newSelectedOrders[orderId]
        return newSelectedOrders
      })

      toast({
        title: "Поръчката е изтрита",
        description: "Поръчката беше успешно изтрита.",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Грешка",
        description: "Възникна проблем при изтриването на поръчката.",
        variant: "destructive",
      })
    } finally {
      setDeletingOrderId(null)
      setOrderToDelete(null)
    }
  }

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "new":
        return "Нова"
      case "processing":
        return "В обработка"
      case "completed":
        return "Изпълнена"
      case "cancelled":
        return "Отказана"
      default:
        return "Неизвестен"
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Нова
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            В обработка
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Изпълнена
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Отказана
          </Badge>
        )
      default:
        return <Badge variant="outline">Неизвестен</Badge>
    }
  }

  const getCustomerTypeBadge = (customer) => {
    if (!customer) return null
    const type = customer.type || customer.Type || "regular"
    const discount = customer.discount || customer.Discount || 0
    switch (type) {
      case "wholesale":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Building className="h-3 w-3 mr-1" />
            Търговец на едро ({discount}% отстъпка)
          </Badge>
        )
      case "retail":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Store className="h-3 w-3 mr-1" />
            Търговец на дребно ({discount}% отстъпка)
          </Badge>
        )
      case "european":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Building className="h-3 w-3 mr-1" />
            Европейски клиент (€)
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <User className="h-3 w-3 mr-1" />
            Обикновен клиент
          </Badge>
        )
    }
  }

  const getOrderItems = (order) => {
    if (!order.items) return []
    try {
      if (Array.isArray(order.items)) return order.items
      if (typeof order.items === "string") return JSON.parse(order.items)
      return []
    } catch (error) {
      console.error("Error parsing order items:", error)
      return []
    }
  }

  const getProductQuantity = (item) => {
    if (!item) return 0
    const quantity = item.quantity || item.qty || item.count || 1
    const numQuantity = typeof quantity === "string" ? Number.parseInt(quantity, 10) : Number(quantity)
    return isNaN(numQuantity) || numQuantity < 1 ? 1 : numQuantity
  }

  // Convert BGN to EUR (1 EUR = 1.96 BGN, fixed rate for Bulgaria)
  const BGN_TO_EUR_RATE = 1.96
  const convertBgnToEur = (bgnPrice) => {
    const num = typeof bgnPrice === "string" ? Number.parseFloat(bgnPrice) : Number(bgnPrice)
    if (isNaN(num)) return 0
    return num / BGN_TO_EUR_RATE
  }

  const getProductPrice = (item) => {
    if (!item) return 0
    const price = item.price_paid !== undefined ? item.price_paid : item.price || item.unitPrice || 0
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : Number(price)
    return isNaN(numPrice) ? 0 : numPrice
  }

  const getProductName = (item) => {
    if (!item) return "Неизвестен продукт"
    return item.title || item.name || item.productName || "Неизвестен продукт"
  }

  const getFreeItemsCount = (order) => {
    // Това е общият брой безплатни артикули за ЦЯЛАТА поръчка,
    // който се взима от order.free_items_count (записан от submit API)
    if (order.free_items_count !== undefined) return Number(order.free_items_count)
    if (order.freeItemsCount !== undefined) return Number(order.freeItemsCount)
    if (order.free_items !== undefined) return Number(order.free_items)

    // Fallback, ако горните полета липсват (за по-стари поръчки)
    const items = getOrderItems(order)
    if (items.length > 0) {
      return items.reduce((total, item) => {
        const freeCount = getProductFreeCount(item) // Използваме getProductFreeCount за всеки артикул
        return total + Number(freeCount)
      }, 0)
    }
    return 0
  }

  const getProductFreeCount = (item) => {
    if (!item) return 0
    // Тази функция трябва да чете 'freeCount' от самия артикул,
    // който е бил записан в базата данни.
    const freeCount = item.freeCount || item.free_count || 0
    return typeof freeCount === "string" ? Number.parseInt(freeCount, 10) : Number(freeCount)
  }

  const hasProductFreeItems = (item) => {
    return getProductFreeCount(item) > 0
  }

  const getProductsWithFreeItems = (order) => {
    const items = getOrderItems(order)
    return items.filter((item) => hasProductFreeItems(item))
  }

  const handleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    const newSelectedOrders = {}
    if (newSelectAll) {
      orders.forEach((order) => {
        newSelectedOrders[order.id] = true
      })
    }
    setSelectedOrders(newSelectedOrders)
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => {
      const newSelectedOrders = { ...prev }
      if (newSelectedOrders[orderId]) {
        delete newSelectedOrders[orderId]
      } else {
        newSelectedOrders[orderId] = true
      }
      setSelectAll(Object.keys(newSelectedOrders).length === orders.length)
      return newSelectedOrders
    })
  }

  const handleExportToExcel = () => {
    const selectedOrderIds = Object.keys(selectedOrders)
    if (selectedOrderIds.length === 0) {
      toast({
        title: "Няма избрани поръчки",
        description: "Моля, изберете поне една поръчка за експортиране.",
        variant: "destructive",
      })
      return
    }
    try {
      const ordersToExport = orders.filter((order) => selectedOrders[order.id])
      const formattedOrders = ordersToExport.map((order) => {
        const customer = customers[order.customerEmail]
        return {
          orderNumber: order.orderId,
          customerName: order.customerName || customer?.storeName || customer?.companyName || "Неизвестен",
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone || customer?.phone,
          orderDate: formatDate(order.createdAt),
          totalAmount: convertBgnToEur(order.totalAmount),
          items: getOrderItems(order).map((item) => {
            let categoryInfo = item.categoryPath || item.category || "Липсва категория"
            if (typeof categoryInfo === "string") {
              if (categoryInfo.toLowerCase().includes("грешка") || categoryInfo.toLowerCase().includes("липсва")) {
                categoryInfo = "Неизвестна категория"
              }
            }
            return {
              productId: item.id || item.productId || "",
              name: getProductName(item),
              quantity: getProductQuantity(item),
              price: convertBgnToEur(getProductPrice(item)),
              categoryPath: categoryInfo,
              freeCount: getProductFreeCount(item),
            }
          }),
        }
      })
      exportOrdersToExcel(formattedOrders)
      toast({
        title: "Експортирането е успешно",
        description: `${formattedOrders.length} поръчки бяха експортирани успешно.`,
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Грешка при експортиране",
        description: "Възникна проблем при генерирането на Excel файла.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        setAudioContext(ctx)
      }
    }

    // Initialize on first click anywhere
    document.addEventListener("click", initAudio, { once: true })
    return () => document.removeEventListener("click", initAudio)
  }, [audioContext])

  return (
    <div className="p-6">
      {newOrdersCount > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg animate-in slide-in-from-top duration-500 border-2 border-green-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full animate-pulse">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {newOrdersCount === 1 ? "Нова поръчка!" : `${newOrdersCount} нови поръчки!`}
                </h3>
                <p className="text-sm text-green-50">
                  {newOrdersCount === 1
                    ? "Имате 1 необработена поръчка. Прегледайте я по-долу."
                    : `Имате ${newOrdersCount} необработени поръчки. Прегледайте ги по-долу.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  clearNewOrdersBadge()
                  fetchOrders()
                }}
                variant="secondary"
                size="sm"
                className="bg-white text-green-600 hover:bg-green-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Обнови поръчките
              </Button>
              <Button onClick={clearNewOrdersBadge} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Управление на поръчки</h1>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  variant={notificationsEnabled ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {notificationsEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {notificationsEnabled ? "Известия ON" : "Известия OFF"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {notificationsEnabled ? "Изключи известията за нови поръчки" : "Вклю��и известията за нови поръчки"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            disabled={loading || orders.length === 0 || Object.keys(selectedOrders).length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Експорт Excel {Object.keys(selectedOrders).length > 0 && `(${Object.keys(selectedOrders).length})`}
          </Button>
          <Button
            onClick={fetchOrders}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Обнови
          </Button>
        </div>
      </div>

      {notificationsEnabled && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-800">
          <BellRing className="h-4 w-4" />
          <span>Известията са активни. Ще получавате уведомления за нови поръчки на всеки 30 секунди.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="relative w-full md:w-auto md:flex-1">
          <Input placeholder="Търсене по имейл, име или номер на поръчка" className="pl-8" />
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
          <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
            {selectAll ? "Премахни всички" : "Избери всички"}
          </label>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Всички статуси" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всички статуси</SelectItem>
            <SelectItem value="new">Нови</SelectItem>
            <SelectItem value="processing">В обработка</SelectItem>
            <SelectItem value="completed">Изпълнени</SelectItem>
            <SelectItem value="cancelled">Отказани</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-900">Възникна грешка при зареждането на поръчките</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Button onClick={fetchOrders} variant="outline" className="mt-4 bg-transparent">
            Опитайте отново
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Няма намерени поръчки</h3>
          <p className="mt-2 text-sm text-gray-500">Все още няма направени поръчки</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderItems = getOrderItems(order)
            const totalItems = orderItems.reduce((sum, item) => sum + getProductQuantity(item), 0)
            const customer = customers[order.customerEmail]
            const freeItemsCountForOrderHeader = getFreeItemsCount(order) // Общо за поръчката
            const productsWithFreeItems = getProductsWithFreeItems(order)

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="flex items-center mr-3 mt-1">
                        <Checkbox
                          checked={!!selectedOrders[order.id]}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                          aria-label={`Избери поръчка ${order.orderId}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Поръчка #{order.orderId}
                          <span className="ml-2">{getStatusBadge(order.status)}</span>
                          {freeItemsCountForOrderHeader > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                              <Gift className="h-3 w-3 mr-1" />
                              {freeItemsCountForOrderHeader} безплатни артикула
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Дата: {formatDate(order.createdAt)} • {totalItems} продукта
                          {productsWithFreeItems.length > 0 && (
                            <span className="ml-2 text-green-600">
                              • {productsWithFreeItems.length}{" "}
                              {productsWithFreeItems.length === 1 ? "продукт" : "продукта"} с подаръци
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOrderToDelete(order)}
                        className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingOrderId === order.id}
                      >
                        {deletingOrderId === order.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrderExpand(order.id)}
                        className="p-1 h-8 w-8"
                      >
                        {expandedOrderId === order.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Клиент:</p>
                      <p className="text-sm">{order.customerName || "Неизвестен клиент"}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail}</p>
                      {order.customerPhone && <p className="text-sm text-gray-500">{order.customerPhone}</p>}
                      {customer && <div className="mt-2">{getCustomerTypeBadge(customer)}</div>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Обща сума:</p>
                      <p className="text-lg font-bold">{convertBgnToEur(order.totalAmount).toFixed(2)} €</p>
                      {freeItemsCountForOrderHeader > 0 && (
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Gift className="h-3 w-3 mr-1" />
                            {freeItemsCountForOrderHeader} безплатни артикула
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      Поръчани продукти ({orderItems.length}):
                      {freeItemsCountForOrderHeader > 0 && (
                        <span className="text-green-600 ml-2">
                          включва {freeItemsCountForOrderHeader} безплатни артикула
                        </span>
                      )}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-2">
                        {orderItems.map((item, index) => {
                          const quantity = getProductQuantity(item)
                          const price = getProductPrice(item)
                          const name = getProductName(item)
                          const itemFreeCount = getProductFreeCount(item) // Безплатни за ТОЗИ артикул
                          const hasFreeItemsForThisProduct = itemFreeCount > 0

                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2 rounded border ${
                                hasFreeItemsForThisProduct ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.photoUrl || "/placeholder.svg?height=48&width=48&query=product"}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{name}</p>
                                    {hasFreeItemsForThisProduct && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">
                                              <Gift className="h-3 w-3 mr-1" />+{itemFreeCount} безплатно
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Клиентът получава {itemFreeCount} безплатни бройки от този продукт</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{convertBgnToEur(price).toFixed(2)} € за брой</p>
                                  {item.categoryPath && <p className="text-xs text-blue-600">{item.categoryPath}</p>}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Badge variant="secondary" className="font-bold">
                                    {quantity} бр.
                                  </Badge>
                                  {hasFreeItemsForThisProduct && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                      +{itemFreeCount} подарък
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mt-1">{convertBgnToEur(price * quantity).toFixed(2)} €</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="mt-4">
                      <Separator className="my-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Информация за клиента
                          </h3>
                          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm flex items-center gap-2">
                              <User className="h-3 w-3 text-gray-500" />
                              <span className="font-medium">Име:</span> {order.customerName || "Не е посочено"}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <span className="font-medium">Имейл:</span> {order.customerEmail}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="font-medium">Телефон:</span> {order.customerPhone || "Не е посочен"}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="font-medium">Адрес за доставка:</span>{" "}
                              {order.deliveryAddress || "Не е посочен"}
                            </p>
                            {customer && (
                              <>
                                <Separator className="my-2" />
                                <p className="text-sm flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                  <span className="font-medium">Регистрация:</span>{" "}
                                  {formatDate(customer.createdAt || customer["Created At"])}
                                </p>
                                {customer.storeName && (
                                  <p className="text-sm flex items-center gap-2">
                                    <Store className="h-3 w-3 text-gray-500" />
                                    <span className="font-medium">Магазин:</span> {customer.storeName}
                                  </p>
                                )}
                                {customer.companyName && (
                                  <p className="text-sm flex items-center gap-2">
                                    <Building className="h-3 w-3 text-gray-500" />
                                    <span className="font-medium">Фирма:</span> {customer.companyName}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Управление на статуса</h3>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={order.status === "new" ? "default" : "outline"}
                              className={order.status === "new" ? "bg-blue-600 hover:bg-blue-700" : ""}
                              onClick={() => updateOrderStatus(order.id, "new")}
                              disabled={updatingOrderId === order.id || order.status === "new"}
                            >
                              {updatingOrderId === order.id && order.status !== "new" ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              Нова
                            </Button>
                            <Button
                              size="sm"
                              variant={order.status === "processing" ? "default" : "outline"}
                              className={order.status === "processing" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                              onClick={() => updateOrderStatus(order.id, "processing")}
                              disabled={updatingOrderId === order.id || order.status === "processing"}
                            >
                              {updatingOrderId === order.id && order.status !== "processing" ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              В обработка
                            </Button>
                            <Button
                              size="sm"
                              variant={order.status === "completed" ? "default" : "outline"}
                              className={order.status === "completed" ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => updateOrderStatus(order.id, "completed")}
                              disabled={updatingOrderId === order.id || order.status === "completed"}
                            >
                              {updatingOrderId === order.id && order.status !== "completed" ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Изпълнена
                            </Button>
                            <Button
                              size="sm"
                              variant={order.status === "cancelled" ? "default" : "outline"}
                              className={order.status === "cancelled" ? "bg-red-600 hover:bg-red-700" : ""}
                              onClick={() => updateOrderStatus(order.id, "cancelled")}
                              disabled={updatingOrderId === order.id || order.status === "cancelled"}
                            >
                              {updatingOrderId === order.id && order.status !== "cancelled" ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Отказана
                            </Button>
                          </div>
                          {freeItemsCountForOrderHeader > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <h4 className="text-sm font-medium flex items-center gap-2 text-green-800">
                                <Gift className="h-4 w-4" />
                                Информация за безплатни артикули
                              </h4>
                              <p className="text-sm text-green-700 mt-1">
                                Тази поръчка включва <strong>{freeItemsCountForOrderHeader} безплатни артикула</strong>.
                              </p>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium text-green-800">Продукти с безплатни артикули:</p>
                                {productsWithFreeItems.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-white p-2 rounded border border-green-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                        <img
                                          src={item.photoUrl || "/placeholder.svg?height=32&width=32&query=product"}
                                          alt={getProductName(item)}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="text-xs font-medium">{getProductName(item)}</span>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 border-0">
                                      <Gift className="h-3 w-3 mr-1" />
                                      {getProductFreeCount(item)} безплатно
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Детайлна информация за продуктите
                      </h3>
                      {orderItems.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Снимка</TableHead>
                              <TableHead>Продукт</TableHead>
                              <TableHead>Категория</TableHead>
                              <TableHead className="text-right">Цена</TableHead>
                              <TableHead className="text-center w-[120px]">Количество</TableHead>
                              <TableHead className="text-right">Общо</TableHead>
                              <TableHead className="text-center">Безплатни</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderItems.map((item, index) => {
                              const quantity = getProductQuantity(item)
                              const price = getProductPrice(item)
                              const name = getProductName(item)
                              const total = price * quantity
                              const itemFreeCount = getProductFreeCount(item) // Безплатни за ТОЗИ артикул
                              const hasFreeItemsForThisProduct = itemFreeCount > 0

                              return (
                                <TableRow key={index} className={hasFreeItemsForThisProduct ? "bg-green-50" : ""}>
                                  <TableCell>
                                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                                      <img
                                        src={item.photoUrl || "/placeholder.svg?height=64&width=64&query=product"}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {name}
                                      {hasFreeItemsForThisProduct && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Info className="h-4 w-4 text-green-600" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                Този продукт участва в промоция и има {itemFreeCount} безплатни бройки.
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {item.categoryPath || "Неизвестна категория"}
                                  </TableCell>
                                  <TableCell className="text-right">{convertBgnToEur(price).toFixed(2)} €</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="px-3 py-1 font-bold">
                                      {quantity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-bold">{convertBgnToEur(total).toFixed(2)} €</TableCell>
                                  <TableCell className="text-center">
                                    {hasFreeItemsForThisProduct ? (
                                      <span className="text-green-700 font-medium">{itemFreeCount}</span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                            <TableRow>
                              <TableCell colSpan={5} className="text-right font-bold">
                                Общо:
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {convertBgnToEur(order.totalAmount).toFixed(2)} €
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {freeItemsCountForOrderHeader > 0 ? (
                                  <span className="text-green-700 font-medium">{freeItemsCountForOrderHeader}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-gray-500">Няма информация за продуктите в тази поръчка</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сигурни ли сте, че искате да изтриете тази поръчка?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие не може да бъде отменено. Поръчка #{orderToDelete?.orderId} ще бъде изтрита завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrder(orderToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
