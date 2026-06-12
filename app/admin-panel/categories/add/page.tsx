"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export default function AddCategoryPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    photourl: "",
    pricefrom: "",
    wholesalerpricefrom: "",
    retailerpricefrom: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/admin/categories/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("Категорията беше добавена успешно!")
        // Изчистваме формата след успешно добавяне
        setFormData({
          title: "",
          description: "",
          photourl: "",
          pricefrom: "",
          wholesalerpricefrom: "",
          retailerpricefrom: "",
        })

        // Пренасочваме към списъка с категории след кратко забавяне
        setTimeout(() => {
          router.push("/admin-panel/categories")
        }, 2000)
      } else {
        setError(data.error || "Грешка при добавяне на категорията.")
      }
    } catch (err) {
      console.error("Error adding category:", err)
      setError("Грешка при добавяне на категорията. Моля, опитайте отново.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Добавяне на категория</h1>
        <Button variant="outline" onClick={() => router.push("/admin-panel/categories")}>
          Назад към категории
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Информация за категорията</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-900/20 border border-red-800 p-4 rounded-md mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-800 p-4 rounded-md mb-4">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Име на категорията *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2 hidden">
              <label htmlFor="description" className="text-sm font-medium">
                Описание
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 min-h-[100px]"
              />
            </div>

            <div className="space-y-2 hidden">
              <label htmlFor="photourl" className="text-sm font-medium">
                URL на снимка
              </label>
              <Input
                id="photourl"
                name="photourl"
                value={formData.photourl}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 hidden">
              <div className="space-y-2">
                <label htmlFor="pricefrom" className="text-sm font-medium">
                  Цена от
                </label>
                <Input
                  id="pricefrom"
                  name="pricefrom"
                  type="number"
                  step="0.01"
                  value={formData.pricefrom}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="wholesalerpricefrom" className="text-sm font-medium">
                  Цена на едро от
                </label>
                <Input
                  id="wholesalerpricefrom"
                  name="wholesalerpricefrom"
                  type="number"
                  step="0.01"
                  value={formData.wholesalerpricefrom}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="retailerpricefrom" className="text-sm font-medium">
                  Цена на дребно от
                </label>
                <Input
                  id="retailerpricefrom"
                  name="retailerpricefrom"
                  type="number"
                  step="0.01"
                  value={formData.retailerpricefrom}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Добавяне...
                  </>
                ) : (
                  "Добави категория"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
