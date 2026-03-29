"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { EcontDeliverySelector } from "@/components/econt-delivery-selector"
import {
  Trash2,
  ShoppingCart,
  MinusCircle,
  PlusCircle,
  Send,
  ImageIcon,
  Edit,
  Check,
  X,
  User,
  Phone,
  Loader2,
  Percent,
  Truck,
  Store,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/client-auth"
import type { User as UserTypeFromAuth } from "@/lib/auth"
import type { EcontOffice } from "@/lib/econt-api"

interface UserType extends UserTypeFromAuth {
  isEuropean?: boolean
}

interface CartContentProps {
  isEnglish?: boolean
}

export function CartContent({ isEnglish = false }: CartContentProps) {
  const cart = useCart()
  const { toast } = useToast()
  const router = useRouter()

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isEuropean, setIsEuropean] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)

  const [editingName, setEditingName] = useState("")
  const [editingPhone, setEditingPhone] = useState("")

  // Delivery options
  const [deliveryOption, setDeliveryOption] = useState<"home" | "econt">("home")
  const [selectedEcontOffice, setSelectedEcontOffice] = useState<EcontOffice | null>(null)

  // State to manage input values locally to avoid removing item on backspace
  const [inputQuantities, setInputQuantities] = useState<{ [key: string]: string }>({})

  // Translations
  const t = {
    title: isEnglish ? "Product List" : "Списък с продукти",
    emptyCartTitle: isEnglish ? "Product list is empty" : "Списъкът с продукти е празен",
    emptyCartDescription: isEnglish
      ? "It looks like you haven't added anything yet. Browse our products!"
      : "Изглежда не сте добавили нищо все още. Разгледайте нашите продукти!",
    toProducts: isEnglish ? "To Products" : "Към продуктите",
    price: isEnglish ? "Price" : "Цена",
    promo: isEnglish ? "Promo: Buy" : "Промо: Купи",
    take: isEnglish ? "Take" : "Вземи",
    free: isEnglish ? "free" : "безплатно",
    freeItems: isEnglish ? "free items" : "безплатни артикула",
    remove: isEnglish ? "Remove" : "Премахни",
    summary: isEnglish ? "Summary" : "Обобщение",
    items: isEnglish ? "Items (paid)" : "Артикули (платени)",
    freeItemsLabel: isEnglish ? "Free items" : "Безплатни артикули",
    subtotal: isEnglish ? "Subtotal" : "Междинна сума",
    discount: isEnglish ? "Discount" : "Отстъпка",
    finalTotal: isEnglish ? "Final Total" : "Крайна сума",
    pricesIncludeVAT: isEnglish
      ? "Prices include VAT. Final price and availability will be confirmed after processing the inquiry."
      : "Цените са с ДДС. Окончателната цена и наличност ще бъдат потвърдени след обработка на запитването.",
    contactDetails: isEnglish ? "Contact Details" : "Данни за контакт",
    edit: isEnglish ? "Edit" : "Промени",
    name: isEnglish ? "Name" : "Име",
    phone: isEnglish ? "Phone" : "Телефон",
    personalDiscount: isEnglish ? "Personal Discount" : "Персонална отстъпка",
    profileData: isEnglish
      ? "Data is from your profile. You can change it for this order."
      : "Данните са от вашия профил. Можете да ги промените за тази поръчка.",
    noData: isEnglish ? "No data" : "Няма данни",
    cancel: isEnglish ? "Cancel" : "Отказ",
    save: isEnglish ? "Save" : "Запази",
    nameCompany: isEnglish ? "Name / Company" : "Име / Фирма",
    namePlaceholder: isEnglish ? "Your name or company name" : "Вашето име или име на фирма",
    phonePlaceholder: isEnglish ? "08XXXXXXX" : "08XXXXXXX",
    additionalInfo: isEnglish ? "Additional Information" : "Адрес",
    additionalInfoPlaceholder: isEnglish
      ? "Order notes, specific requirements, etc."
      : "Адрес за доставка, бележки към поръчката и др.",
    confirmOrder: isEnglish ? "Confirm Order" : "Потвърди поръчка",
    sending: isEnglish ? "Sending..." : "Изпращане...",
    loadingData: isEnglish ? "Loading data..." : "Зареждане на данни...",
    emptyCart: isEnglish ? "Empty cart" : "Празна количка",
    emptyCartMessage: isEnglish
      ? "Please add products before submitting an inquiry."
      : "Моля, добавете продукти преди да изпратите запитване.",
    inquirySent: isEnglish ? "Inquiry sent successfully!" : "Запитването е изпратено успешно!",
    inquiryMessage: isEnglish
      ? "Your order number {orderId} has been received. We will contact you soon."
      : "Вашата поръчка с номер {orderId} е приета. Ще се свържем с Вас скоро.",
    sendingError: isEnglish ? "Error sending" : "Грешка при изпращане",
    sendingErrorMessage: isEnglish
      ? "A problem occurred while sending your inquiry."
      : "Възникна проблем при изпращането на вашето запитване.",
    connectionError: isEnglish
      ? "Failed connection to server. Please try again."
      : "Неуспешна връзка със сървъра. Моля, опитайте отново.",
    deliveryOptions: isEnglish ? "Delivery Options" : "Опции за доставка",
    homeDelivery: isEnglish ? "Home Delivery" : "Доставка до дома",
    econtOffice: isEnglish ? "Econt Office" : "Офис на Еконт",
    selectOffice: isEnglish ? "Please select an Econt office" : "Моля, изберете офис на Еконт",
  }

  // Effect to sync local state when items are added or removed from the cart
  useEffect(() => {
    const newQuantities = cart.items.reduce(
      (acc, item) => {
        acc[item.id] = String(item.quantity)
        return acc
      },
      {} as { [key: string]: string },
    )
    setInputQuantities(newQuantities)
  }, [cart.items.map((i) => i.id).join(",")])

  useEffect(() => {
    const fetchUserAndStatus = async () => {
      setIsLoadingUser(true)
      const user = await getUser()
      if (user) {
        setCurrentUser(user as UserType)
        const nameToSet = user.name || user.storeName || user.companyName || ""
        const phoneToSet = user.phone || ""
        setCustomerName(nameToSet)
        setCustomerPhone(phoneToSet)
        setEditingName(nameToSet)
        setEditingPhone(phoneToSet)
        const userIsEuropean = user.customerType?.toLowerCase().includes("europ") || false
        setIsEuropean(userIsEuropean)
      }
      setIsLoadingUser(false)
    }
    fetchUserAndStatus()
  }, [])

  // Handler for +/- buttons
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      cart.removeItem(id)
    } else {
      cart.updateQuantity(id, newQuantity)
      // Also update local state to reflect the change immediately
      setInputQuantities((prev) => ({ ...prev, [id]: String(newQuantity) }))
    }
  }

  // Handler for manual input change
  const handleInputChange = (id: string, value: string) => {
    // Allow empty string and positive integers
    if (value === "" || /^\d+$/.test(value)) {
      setInputQuantities((prev) => ({ ...prev, [id]: value }))
    }
  }

  // Handler for when input loses focus (blur)
  const handleInputBlur = (id: string) => {
    const value = inputQuantities[id]
    const newQuantity = Number.parseInt(value, 10)

    if (isNaN(newQuantity) || newQuantity < 1) {
      // On invalid input (empty, "abc", 0), revert to the quantity from the cart context.
      const originalItem = cart.items.find((item) => item.id === id)
      if (originalItem) {
        setInputQuantities((prev) => ({ ...prev, [id]: String(originalItem.quantity) }))
      }
    } else {
      // On valid input, update the cart context.
      cart.updateQuantity(id, newQuantity)
    }
  }

  const currentOriginalTotalPrice = cart.getTotalPrice() // This is sum of item.price * item.quantity
  const discountPercent = currentUser?.discountPercent || 0
  let currentDiscountAmount = 0
  let currentFinalTotalPrice = currentOriginalTotalPrice

  if (currentUser && discountPercent > 0) {
    currentDiscountAmount = currentOriginalTotalPrice * (discountPercent / 100)
    currentFinalTotalPrice = currentOriginalTotalPrice - currentDiscountAmount
  }

  const handleSubmitInquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    if (cart.items.length === 0) {
      toast({
        title: t.emptyCart,
        description: t.emptyCartMessage,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (deliveryOption === "econt" && !selectedEcontOffice) {
      toast({
        title: t.selectOffice,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const orderData = {
      customerName: (customerName || "").trim(),
      customerPhone: (customerPhone || "").trim(),
      additionalInfo: (additionalInfo || "").trim(),
      totalAmount: Number.parseFloat(currentFinalTotalPrice.toFixed(2)),
      originalTotalPrice: Number.parseFloat(currentOriginalTotalPrice.toFixed(2)),
      deliveryOption,
      econtOffice: selectedEcontOffice
        ? {
            id: selectedEcontOffice.id,
            name: selectedEcontOffice.name,
            address: selectedEcontOffice.address,
            phone: selectedEcontOffice.phone,
          }
        : null,
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        photourl: item.photourl,
        title: item.title,
        isEuropeanPrice: item.isEuropeanPrice,
        subcateid: (item as any).subcateid || null,
        freeItems: typeof item.freeItems === "number" ? item.freeItems : 0,
        promo_buy_qty: item.promo_buy_qty,
        promo_free_qty: item.promo_free_qty,
      })),
      isEuropeanCustomer: isEuropean,
      discountPercent: discountPercent,
      discountAmount: Number.parseFloat(currentDiscountAmount.toFixed(2)),
    }

    try {
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
      const result = await response.json()
      if (response.ok && result.success) {
        toast({
          title: t.inquirySent,
          description: t.inquiryMessage.replace("{orderId}", result.orderId),
        })
        cart.clearCart()
        router.push(
          isEnglish ? `/en/order-success?orderId=${result.orderId}` : `/order-success?orderId=${result.orderId}`,
        )
      } else {
        toast({
          title: t.sendingError,
          description: result.error || t.sendingErrorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t.sendingError,
        description: t.connectionError,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEditing = () => {
    setEditingName(customerName)
    setEditingPhone(customerPhone)
    setIsEditingDetails(true)
  }

  const handleCancelEditing = () => {
    setIsEditingDetails(false)
    if (currentUser) {
      setCustomerName(currentUser.name || currentUser.storeName || currentUser.companyName || "")
      setCustomerPhone(currentUser.phone || "")
    }
  }

  const handleSaveEditing = () => {
    setCustomerName(editingName)
    setCustomerPhone(editingPhone)
    setIsEditingDetails(false)
  }

  const renderCustomerForm = () => {
    if (isLoadingUser) {
      return (
        <div className="flex items-center justify-center p-8 space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="text-gray-600">{t.loadingData}</span>
        </div>
      )
    }

    if (currentUser && !isEditingDetails) {
      return (
        <div className="space-y-3 text-sm border border-gray-200 p-4 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base text-gray-800">{t.contactDetails}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEditing}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-3 w-3" />
              {t.edit}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium text-gray-600 mr-2">{t.name}:</span> {customerName || t.noData}
            </p>
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium text-gray-600 mr-2">{t.phone}:</span> {customerPhone || t.noData}
            </p>
            {discountPercent > 0 && (
              <p className="flex items-center text-green-600">
                <Percent className="h-4 w-4 mr-2" />
                <span className="font-medium mr-2">{t.personalDiscount}:</span> {discountPercent}%
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 pt-2">{t.profileData}</p>
        </div>
      )
    }

    return (
      <>
        <div>
          <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
            {t.nameCompany}
          </Label>
          <Input
            id="customerName"
            value={isEditingDetails ? editingName : customerName}
            onChange={(e) => (isEditingDetails ? setEditingName(e.target.value) : setCustomerName(e.target.value))}
            required
            className="mt-1"
            placeholder={t.namePlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
            {t.phone}
          </Label>
          <Input
            id="customerPhone"
            type="tel"
            value={isEditingDetails ? editingPhone : customerPhone}
            onChange={(e) => (isEditingDetails ? setEditingPhone(e.target.value) : setCustomerPhone(e.target.value))}
            required
            className="mt-1"
            placeholder={t.phonePlaceholder}
          />
        </div>
        {isEditingDetails && (
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={handleCancelEditing}>
              <X className="h-4 w-4 mr-1" />
              {t.cancel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveEditing}
              className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
            >
              <Check className="h-4 w-4 mr-1" />
              {t.save}
            </Button>
          </div>
        )}
      </>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow-md rounded-lg">
        <ShoppingCart className="h-20 w-20 mx-auto text-gray-400 mb-6" />
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">{t.emptyCartTitle}</h2>
        <p className="text-gray-500 mb-8">{t.emptyCartDescription}</p>
        <Button size="lg" asChild className="bg-red-500 hover:bg-red-600 text-white">
          <Link href={isEnglish ? "/en" : "/"}>{t.toProducts}</Link>
        </Button>
      </div>
    )
  }

  const currencySymbol = isEuropean ? "€" : isEnglish ? "$" : "лв."

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t.title}</h1>
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start gap-4 p-5 border rounded-xl bg-white shadow-lg"
            >
              {item.photourl ? (
                <img
                  src={item.photourl || "/placeholder.svg"}
                  alt={item.title}
                  width={100}
                  height={100}
                  className="rounded-lg object-cover aspect-square border"
                />
              ) : (
                <div className="w-[100px] h-[100px] bg-gray-100 rounded-lg flex items-center justify-center border">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div className="flex-grow">
                <h3 className="font-semibold text-xl text-gray-800">
                  <Link href={isEnglish ? `/en/product/${item.id}` : `/product/${item.id}`}>{item.title}</Link>
                </h3>
                <p className="text-md text-gray-700 mt-1">
                  {t.price}: {item.price.toFixed(2)} {currencySymbol}
                </p>
                {item.promo_buy_qty && typeof item.promo_free_qty === "number" && (
                  <p className="text-xs text-green-600 font-medium mt-1 bg-green-50 px-2 py-1 rounded-md inline-block">
                    {t.promo} {item.promo_buy_qty}, {t.take} {item.promo_free_qty} {t.free}
                  </p>
                )}
                {item.freeItems && item.freeItems > 0 && (
                  <p className="text-sm text-green-700 font-semibold mt-1.5">
                    + {item.freeItems} {t.freeItems}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3 mt-2 sm:mt-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputQuantities[item.id] ?? ""}
                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                    onBlur={() => handleInputBlur(item.id)}
                    className="w-16 text-center h-10"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => cart.removeItem(item.id)} className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-1.5" /> {t.remove}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 sticky top-28">
          <div className="bg-white p-6 rounded-xl shadow-xl border">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800">{t.summary}</h2>
            <div className="space-y-3 mb-5 text-gray-700">
              <div className="flex justify-between">
                <span>{t.items}:</span>
                <span className="font-medium">{cart.getItemCount()}</span>
              </div>
              {cart.items.reduce((acc, item) => acc + (item.freeItems || 0), 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t.freeItemsLabel}:</span>
                  <span className="font-medium">
                    {cart.items.reduce((acc, item) => acc + (item.freeItems || 0), 0)}
                  </span>
                </div>
              )}
              <hr className="my-1" />
              <div className="flex justify-between">
                <span>{t.subtotal}:</span>
                <span className="font-medium">
                  {currentOriginalTotalPrice.toFixed(2)} {currencySymbol}
                </span>
              </div>
              {currentDiscountAmount > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>
                      {t.discount} ({discountPercent}%):
                    </span>
                    <span className="font-medium">
                      -{currentDiscountAmount.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                  <hr className="my-1 border-dashed" />
                </>
              )}
              <div className="flex justify-between font-bold text-xl text-gray-800">
                <span>{t.finalTotal}:</span>
                <span>
                  {currentFinalTotalPrice.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">{t.pricesIncludeVAT}</p>

            {/* Delivery Options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{t.deliveryOptions}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setDeliveryOption("home")}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                    deliveryOption === "home"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Truck className="h-5 w-5" />
                  <span className="font-medium">{t.homeDelivery}</span>
                </button>
                <button
                  onClick={() => setDeliveryOption("econt")}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                    deliveryOption === "econt"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Store className="h-5 w-5" />
                  <span className="font-medium">{t.econtOffice}</span>
                </button>
              </div>
            </div>

            {/* Econt Office Selector */}
            {deliveryOption === "econt" && (
              <div className="mb-6">
                <EcontDeliverySelector
                  onOfficeSelect={setSelectedEcontOffice}
                  selectedOffice={selectedEcontOffice}
                  isEnglish={isEnglish}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  onCustomerDataChange={(name: string, phone: string) => {
                    setCustomerName(name)
                    setCustomerPhone(phone)
                  }}
                  currentUser={currentUser}
                  isLoadingUser={isLoadingUser}
                />
              </div>
            )}

            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              {deliveryOption === "home" && renderCustomerForm()}
              {deliveryOption === "home" && (
                <div>
                  <Label htmlFor="additionalInfo" className="text-sm font-medium text-gray-700">
                    {t.additionalInfo}
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                    placeholder={t.additionalInfoPlaceholder}
                    className="mt-1"
                  />
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  isSubmitting ||
                  isLoadingUser ||
                  (deliveryOption === "econt" && !selectedEcontOffice) ||
                  (deliveryOption === "econt" && (!customerName.trim() || !customerPhone.trim())) ||
                  (deliveryOption === "home" && (!customerName.trim() || !customerPhone.trim()))
                }
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                {isSubmitting ? t.sending : t.confirmOrder}
              </Button>

              {deliveryOption === "econt" && !selectedEcontOffice && (
                <p className="text-sm text-amber-600 text-center mt-2">{t.selectOffice}</p>
              )}
              {deliveryOption === "econt" && selectedEcontOffice && (!customerName.trim() || !customerPhone.trim()) && (
                <p className="text-sm text-amber-600 text-center mt-2">
                  {isEnglish
                    ? "Please fill in your details in the office popup above"
                    : "Моля, попълнете данните си в прозореца за офиса по-горе"}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
