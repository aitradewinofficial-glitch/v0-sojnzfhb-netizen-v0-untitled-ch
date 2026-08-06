"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Loader2, CheckCircle2, Fish } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function RegistrationForm({ storeId }: { storeId: string }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedMarketing, setAgreedMarketing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Моля, въведете вашите имена.")
      return
    }
    if (!phone.trim()) {
      setError("Моля, въведете телефонен номер.")
      return
    }
    if (!agreedTerms) {
      setError("Трябва да се съгласите с общите условия.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/fishermen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          customerId: storeId,
          agreedTerms,
          agreedMarketing,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Възникна грешка при регистрацията.")
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Възникна грешка при регистрацията.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Вие се регистрирахте успешно!</h1>
        <p className="mt-3 text-pretty text-gray-600">
          Благодарим ви! Вече участвате в теглене за големите седмични награди. Успех!
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="relative mb-3 h-10 w-36">
          <Image src="/images/design-mode/new-madiks.png" alt="Madix" fill className="object-contain" priority />
        </div>
        <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-700">
          <Fish className="h-4 w-4" />
          Спечели седмична награда
        </div>
        <h1 className="mt-4 text-balance text-2xl font-bold text-gray-900">Регистрация за томбола</h1>
        <p className="mt-2 text-pretty text-sm text-gray-600">
          Попълни данните си и участвай в тегленето за големи седмични награди.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-gray-700">
            Имена
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Вашите три имена"
            className="border-gray-300 bg-white text-gray-900"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-gray-700">
            Телефон
          </Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0888 123 456"
            className="border-gray-300 bg-white text-gray-900"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedTerms}
              onCheckedChange={(v) => setAgreedTerms(Boolean(v))}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug text-gray-700">
              Съгласен съм с общите условия на играта.
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="marketing"
              checked={agreedMarketing}
              onCheckedChange={(v) => setAgreedMarketing(Boolean(v))}
              className="mt-0.5"
            />
            <Label htmlFor="marketing" className="text-sm font-normal leading-snug text-gray-700">
              Съгласен съм да получавам маркетингови съобщения и данните ми да бъдат използвани за тази цел.
            </Label>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full bg-orange-600 text-base font-semibold text-white hover:bg-orange-700"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Изпращане...
            </>
          ) : (
            "Регистрация"
          )}
        </Button>
      </form>
    </div>
  )
}
