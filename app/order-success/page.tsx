"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, ShoppingBag, Home, Phone, Mail } from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const orderIdFromUrl = searchParams.get("orderId")
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl)
    } else {
      // If no order ID, redirect to home after a short delay
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Поръчката е потвърдена!</h1>
          <p className="text-gray-600">Благодарим Ви за доверието!</p>
        </div>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Номер на поръчката:</p>
            <p className="text-xl font-bold text-gray-800">{orderId}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center text-gray-700">
            <Phone className="h-5 w-5 mr-2 text-blue-500" />
            <span className="text-sm">Ще се свържем с Вас скоро</span>
          </div>
          <div className="flex items-center justify-center text-gray-700">
            <Mail className="h-5 w-5 mr-2 text-blue-500" />
            <span className="text-sm">Проверете имейла си за потвърждение</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full bg-red-500 hover:bg-red-600 text-white">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Към началната страница
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Продължи пазаруването
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            При въпроси се свържете с нас на{" "}
            <a href="tel:+359888123456" className="text-blue-600 hover:underline">
              +359894352204
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
