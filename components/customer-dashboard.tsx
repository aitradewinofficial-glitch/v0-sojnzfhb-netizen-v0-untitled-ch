import type { User } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Fish } from "lucide-react"
import Image from "next/image"

export type OrderItem = {
  id: string // Ще използваме 'id' от данните в базата
  title: string
  quantity: number
  original_item_price: string // Това е полето с оригиналната единична цена от базата
  photourl?: string
}

export type Order = {
  objectid: string
  orderid: string
  status: string
  createdat: string
  bill: string
  items?: OrderItem[] | string
}

interface CustomerDashboardProps {
  user: User
  orders: Order[]
  fishermenCount?: number
}

export function CustomerDashboard({ user, orders = [], fishermenCount = 0 }: CustomerDashboardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("bg-BG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const formatCurrency = (amountString: string | number) => {
    if (amountString === null || amountString === undefined) return "0.00 лв."
    const amount = Number.parseFloat(String(amountString))
    return `${amount.toFixed(2)} лв.`
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const lowerStatus = status?.toLowerCase() || ""
    if (lowerStatus.includes("обработва се") || lowerStatus.includes("pending") || lowerStatus.includes("new"))
      return "default"
    if (lowerStatus.includes("изпратена") || lowerStatus.includes("shipped")) return "secondary"
    if (lowerStatus.includes("доставена") || lowerStatus.includes("completed") || lowerStatus.includes("delivered"))
      return "default"
    if (lowerStatus.includes("отказана") || lowerStatus.includes("cancelled") || lowerStatus.includes("rejected"))
      return "destructive"
    return "outline"
  }

  const getStatusBadgeClassName = (status: string): string => {
    const lowerStatus = status?.toLowerCase() || ""
    if (lowerStatus.includes("доставена") || lowerStatus.includes("completed") || lowerStatus.includes("delivered")) {
      return "bg-green-600 hover:bg-green-700 text-white"
    }
    if (lowerStatus.includes("обработва се") || lowerStatus.includes("pending") || lowerStatus.includes("new")) {
      return "bg-yellow-500 hover:bg-yellow-600 text-black"
    }
    if (lowerStatus.includes("изпратена") || lowerStatus.includes("shipped")) {
      return "bg-blue-500 hover:bg-blue-600 text-white"
    }
    return ""
  }

  const parseOrderItems = (itemsData: OrderItem[] | string | undefined): OrderItem[] => {
    console.log("CustomerDashboard - parseOrderItems - received itemsData:", itemsData)
    if (!itemsData) return []
    if (typeof itemsData === "string") {
      try {
        const parsed = JSON.parse(itemsData)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        console.error("Error parsing order items JSON:", error)
        return []
      }
    }
    return Array.isArray(itemsData) ? itemsData : []
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-3 border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Fish className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Регистрирани рибари от вашия магазин</p>
                <p className="text-4xl font-extrabold leading-none">{fishermenCount}</p>
              </div>
            </div>
            <p className="max-w-md text-pretty text-sm text-white/90">
              Всеки рибар, който сканира вашия QR код и се регистрира, се брои тук. Колкото повече регистрации, толкова
              по-близо сте до бонуса!
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Информация за акаунта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-gray-600">
                Име
              </Label>
              <Input id="name" value={user.name || ""} readOnly className="bg-gray-50 border-gray-300 text-gray-900" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-600">
                Имейл
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-gray-600">
                Телефон
              </Label>
              <Input
                id="phone"
                type="tel"
                value={user.phone || ""}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
            {user.isCustomer && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="customerType" className="text-gray-600">
                    Тип клиент
                  </Label>
                  <Input
                    id="customerType"
                    value={user.customerType || "Не е указан"}
                    readOnly
                    className="bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="discount" className="text-gray-600">
                    Отстъпка
                  </Label>
                  <Input
                    id="discount"
                    value={`${user.discountPercent || 0}%`}
                    readOnly
                    className="bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Адрес за доставка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="storeName" className="text-gray-600">
                Име на магазин (ако е приложимо)
              </Label>
              <Input
                id="storeName"
                value={user.storeName || "N/A"}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="companyName" className="text-gray-600">
                Име на фирма (ако е приложимо)
              </Label>
              <Input
                id="companyName"
                value={user.companyName || "N/A"}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deliveryAddress" className="text-gray-600">
                Адрес за доставка
              </Label>
              <Input
                id="deliveryAddress"
                value={user.deliveryAddress || "Моля, добавете адрес от профила си"}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Последни поръчки</CardTitle>
            {orders.length === 0 && (
              <CardDescription className="text-gray-500">Все още нямате направени поръчки.</CardDescription>
            )}
          </CardHeader>
          {orders.length > 0 && (
            <CardContent className="p-0">
              <div className="border-t">
                <div className="flex w-full items-center bg-gray-50/50 px-4 py-2 text-sm font-semibold text-gray-700">
                  <div className="w-[25%]">Номер</div>
                  <div className="w-[25%]">Дата</div>
                  <div className="w-[20%]">Статус</div>
                  <div className="w-[20%] text-right">Сума</div>
                  <div className="w-[10%] text-right">Детайли</div>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {orders.map((order) => {
                    const parsedItems = parseOrderItems(order.items)
                    return (
                      <AccordionItem value={order.objectid} key={order.objectid} className="border-b last:border-b-0">
                        <AccordionTrigger className="hover:no-underline hover:bg-gray-50/70 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 w-full text-sm data-[state=open]:bg-slate-50 py-0">
                          <div className="flex w-full items-center py-3 px-4">
                            <span className="w-[25%] text-left font-medium text-gray-800">{order.orderid}</span>
                            <span className="w-[25%] text-left text-gray-600">{formatDate(order.createdat)}</span>
                            <span className="w-[20%] text-left">
                              <Badge
                                variant={getStatusBadgeVariant(order.status)}
                                className={`${getStatusBadgeClassName(order.status)}`}
                              >
                                {order.status || "N/A"}
                              </Badge>
                            </span>
                            <span className="w-[20%] text-right font-medium text-gray-800">
                              {formatCurrency(order.bill)}
                            </span>
                            <span className="w-[10%] text-right">{/* Chevron is part of AccordionTrigger */}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
                          <h4 className="text-md font-semibold mb-3 text-gray-700">Поръчани артикули:</h4>
                          {parsedItems.length > 0 ? (
                            <div className="space-y-3">
                              {parsedItems.map((item, index) => (
                                <div key={index} className="flex items-start p-3 rounded-md border bg-white shadow-sm">
                                  {item.photourl && (
                                    <div className="relative w-16 h-16 mr-4 flex-shrink-0">
                                      <Image
                                        src={item.photourl || "/placeholder.svg"}
                                        alt={item.title}
                                        fill
                                        objectFit="cover"
                                        className="rounded"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-grow">
                                    <p className="font-medium text-gray-800">{item.title}</p>
                                    <p className="text-xs text-gray-500">Количество: {item.quantity}</p>
                                    <p className="text-xs text-gray-500">
                                      Ед. цена: {formatCurrency(item.original_item_price)}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-700 font-medium whitespace-nowrap ml-2">
                                    Общо: {formatCurrency(Number.parseFloat(item.original_item_price) * item.quantity)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Няма информация за артикулите в тази поръчка. Възможно е поръчката да е направена преди
                              добавянето на тази функционалност.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
