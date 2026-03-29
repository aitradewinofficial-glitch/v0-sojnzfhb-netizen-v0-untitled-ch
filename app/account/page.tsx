"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Loader2, Clock, Info, Eye, EyeOff, ArrowLeft, User, UserPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export default function AccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("login")
  const [loginData, setLoginData] = useState({ phone: "", password: "" })
  const [registerData, setRegisterData] = useState({
    storeName: "",
    companyName: "",
    customerType: "standard",
    phone: "",
    password: "",
    confirmPassword: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isPendingApproval, setIsPendingApproval] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "register" || tab === "login") {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
    if (loginError) setLoginError(null)
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
    if (registerError) setRegisterError(null)
  }

  const handleRegisterSelectChange = (value: string) => {
    setRegisterData((prev) => ({ ...prev, customerType: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsPendingApproval(false)

    if (!loginData.phone || !loginData.password) {
      setLoginError("Моля, попълнете всички полета")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginData.phone, password: loginData.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.pending) {
          setIsPendingApproval(true)
          setPendingMessage(data.message || "Моля, изчакайте одобрение от администратор.")
        } else {
          setLoginError(data.error || "Грешен телефонен номер или парола.")
        }
        return
      }
      toast({ title: "Успешен вход!", description: "Пренасочване..." })
      router.push("/account/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Login error:", err)
      setLoginError("Възникна грешка при входа. Моля, опитайте отново.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (!registerData.storeName || !registerData.phone || !registerData.password) {
      setRegisterError("Моля, попълнете всички задължителни полета (Имена, Телефон, Парола).")
      return
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Паролите не съвпадат.")
      return
    }
    if (registerData.password.length < 6) {
      setRegisterError("Паролата трябва да бъде поне 6 символа.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: registerData.storeName,
          companyName: registerData.companyName || null,
          phone: registerData.phone,
          email: registerData.email || null,
          customerType: registerData.customerType,
          password: registerData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setRegisterError(data.error || "Възникна грешка при регистрацията.")
        return
      }

      if (data.pending === false) {
        toast({
          title: "Регистрацията е успешна!",
          description: "Влизате в акаунта си...",
        })
        window.location.reload()
      } else if (data.pending === true) {
        setShowConfirmDialog(true)
        setRegisterData({
          storeName: "",
          companyName: "",
          customerType: "standard",
          phone: "",
          password: "",
          confirmPassword: "",
          email: "",
        })
      } else {
        setRegisterError("Регистрацията е успешна, но статусът на одобрение е неясен.")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setRegisterError("Възникна грешка при регистрацията. Моля, опитайте отново.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setShowConfirmDialog(false)
    setActiveTab("login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">Назад</span>
          </Link>
          
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <div className="relative h-10 w-28">
              <Image
                src="/images/design-mode/madix.png"
                alt="Madix Groundbaits"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          <div className="w-16" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* Tab Switcher - Apple Style Segmented Control */}
        <div className="bg-neutral-200/60 p-1 rounded-xl mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <User className="h-4 w-4" />
              Вход
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Регистрация
            </button>
          </div>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/50 overflow-hidden">
            <div className="p-6 pb-4">
              <h1 className="text-xl font-semibold text-neutral-900 mb-1">Добре дошли</h1>
              <p className="text-sm text-neutral-500">Влезте в профила си, за да продължите</p>
            </div>
            
            <div className="px-6 pb-6">
              {/* Error Alert */}
              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Грешка при вход</p>
                    <p className="text-sm text-red-600">{loginError}</p>
                  </div>
                </div>
              )}
              
              {/* Pending Approval Alert */}
              {isPendingApproval && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Изчакайте одобрение</p>
                    <p className="text-sm text-amber-600">{pendingMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone" className="text-sm font-medium text-neutral-700">
                    Телефонен номер
                  </Label>
                  <Input
                    id="login-phone"
                    name="phone"
                    type="tel"
                    value={loginData.phone}
                    onChange={handleLoginChange}
                    placeholder="0888 123 456"
                    className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 transition-all"
                    required
                    autoComplete="tel"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-neutral-700">
                    Парола
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="Въведете парола"
                      className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 pr-12 transition-all"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      <span className="sr-only">{showLoginPassword ? "Скрий паролата" : "Покажи паролата"}</span>
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Зареждане...
                    </>
                  ) : (
                    "Вход"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/50 overflow-hidden">
            <div className="p-6 pb-4">
              <h1 className="text-xl font-semibold text-neutral-900 mb-1">Създаване на акаунт</h1>
              <p className="text-sm text-neutral-500">Попълнете данните за регистрация</p>
            </div>
            
            <div className="px-6 pb-6">
              {/* Error Alert */}
              {registerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Грешка при регистрация</p>
                    <p className="text-sm text-red-600">{registerError}</p>
                  </div>
                </div>
              )}
              
              {/* Info Alert */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Стандартните клиенти получават достъп веднага. Търговските акаунти изискват одобрение.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-storeName" className="text-sm font-medium text-neutral-700">
                    Имена <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="register-storeName"
                    name="storeName"
                    value={registerData.storeName}
                    onChange={handleRegisterChange}
                    placeholder="Иван Иванов"
                    className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 transition-all"
                    required
                    autoComplete="name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-companyName" className="text-sm font-medium text-neutral-700">
                    Компания <span className="text-neutral-400 font-normal">(незадължително)</span>
                  </Label>
                  <Input
                    id="register-companyName"
                    name="companyName"
                    value={registerData.companyName}
                    onChange={handleRegisterChange}
                    placeholder="Име на фирма"
                    className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 transition-all"
                    autoComplete="organization"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-medium text-neutral-700">
                    Имейл <span className="text-neutral-400 font-normal">(незадължително)</span>
                  </Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="your@email.com"
                    className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 transition-all"
                    autoComplete="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-sm font-medium text-neutral-700">
                    Телефон <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    placeholder="0888 123 456"
                    className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 transition-all"
                    required
                    autoComplete="tel"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-customerType" className="text-sm font-medium text-neutral-700">
                    Тип клиент <span className="text-red-500">*</span>
                  </Label>
                  <Select value={registerData.customerType} onValueChange={handleRegisterSelectChange}>
                    <SelectTrigger 
                      id="register-customerType" 
                      className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 focus:bg-white focus:border-green-500 focus:ring-green-500/20"
                    >
                      <SelectValue placeholder="Изберете тип клиент" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200 rounded-xl shadow-lg">
                      <SelectItem value="standard" className="rounded-lg">Стандартен клиент</SelectItem>
                      <SelectItem value="retailer" className="rounded-lg">Търговец на дребно</SelectItem>
                      <SelectItem value="wholesaler" className="rounded-lg">Търговец на едро</SelectItem>
                      <SelectItem value="european" className="rounded-lg">Европейски клиент</SelectItem>
                    </SelectContent>
                  </Select>
                  {registerData.customerType !== "standard" && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Този тип акаунт изисква одобрение от администратор
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium text-neutral-700">
                    Парола <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      name="password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="Минимум 6 символа"
                      className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 pr-12 transition-all"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      <span className="sr-only">{showRegisterPassword ? "Скрий паролата" : "Покажи паролата"}</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirmPassword" className="text-sm font-medium text-neutral-700">
                    Потвърдете паролата <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Повторете паролата"
                      className="h-12 bg-neutral-50 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20 pr-12 transition-all"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      <span className="sr-only">{showConfirmPassword ? "Скрий паролата" : "Покажи паролата"}</span>
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    "Регистрирай се"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Продължи без регистрация
          </Link>
        </div>
      </main>

      {/* Success Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-white border-neutral-200 rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-neutral-900">
              Регистрацията е изпратена!
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              Вашата заявка за регистрация е получена успешно.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-neutral-600">
              Вашият акаунт ще бъде активиран след одобрение от администратор. 
              Ще можете да влезете в системата след това.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCloseDialog} 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl"
            >
              Разбрано
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
