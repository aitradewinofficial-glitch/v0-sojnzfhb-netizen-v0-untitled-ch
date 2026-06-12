"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw } from "lucide-react"

export default function DiagnosticsPage() {
  const [tableInfo, setTableInfo] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productId, setProductId] = useState("")
  const [productTitle, setProductTitle] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [rawSql, setRawSql] = useState("")
  const [sqlResult, setSqlResult] = useState<any>(null)
  const [sqlLoading, setSqlLoading] = useState(false)
  const [sqlError, setSqlError] = useState<string | null>(null)

  useEffect(() => {
    fetchTableInfo()
  }, [])

  const fetchTableInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/diagnostics/table-info?table=new_products")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTableInfo(data.columns || [])
    } catch (err) {
      console.error("Error fetching table info:", err)
      setError(`Грешка при зареждане на информация за таблицата: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTest = async () => {
    if (!productId || !productTitle) {
      setUpdateError("ID и заглавие на продукта са задължителни")
      return
    }

    try {
      setUpdateLoading(true)
      setUpdateError(null)
      setUpdateResult(null)

      const response = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectid: productId,
          title: productTitle,
          price: productPrice || null,
        }),
      })

      const data = await response.json()
      setUpdateResult(data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
    } catch (err) {
      console.error("Error updating product:", err)
      setUpdateError(`Грешка при обновяване на продукта: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleExecuteSql = async () => {
    if (!rawSql) {
      setSqlError("SQL заявката е задължителна")
      return
    }

    try {
      setSqlLoading(true)
      setSqlError(null)
      setSqlResult(null)

      const response = await fetch("/api/admin/diagnostics/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: rawSql,
        }),
      })

      const data = await response.json()
      setSqlResult(data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
    } catch (err) {
      console.error("Error executing SQL:", err)
      setSqlError(`Грешка при изпълнение на SQL заявката: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSqlLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Диагностика на базата данни</h1>
        <Button variant="outline" onClick={fetchTableInfo} disabled={loading}>
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Обнови
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 p-4 rounded-md">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Структура на таблицата new_products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : tableInfo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4">Колона</th>
                    <th className="text-left py-3 px-4">Тип</th>
                    <th className="text-left py-3 px-4">Nullable</th>
                    <th className="text-left py-3 px-4">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {tableInfo.map((column, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-3 px-4">{column.column_name}</td>
                      <td className="py-3 px-4">{column.data_type}</td>
                      <td className="py-3 px-4">{column.is_nullable}</td>
                      <td className="py-3 px-4">{column.column_default || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Няма информация за таблицата.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Тест за обновяване на продукт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="productId" className="text-sm font-medium">
                ID на продукта *
              </label>
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="bg-gray-800 border-gray-700"
                placeholder="Въведете objectid на продукта"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="productTitle" className="text-sm font-medium">
                Заглавие *
              </label>
              <Input
                id="productTitle"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="bg-gray-800 border-gray-700"
                placeholder="Въведете ново заглавие"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="productPrice" className="text-sm font-medium">
                Цена
              </label>
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="bg-gray-800 border-gray-700"
                placeholder="Въведете нова цена"
              />
            </div>

            <Button onClick={handleUpdateTest} disabled={updateLoading} className="w-full">
              {updateLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Обновяване...
                </>
              ) : (
                "Тествай обновяване"
              )}
            </Button>

            {updateError && (
              <div className="bg-red-900/20 border border-red-800 p-4 rounded-md">
                <p className="text-red-400">{updateError}</p>
              </div>
            )}

            {updateResult && (
              <div className="bg-gray-800 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Резултат:</h3>
                <pre className="text-sm overflow-x-auto">{JSON.stringify(updateResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Изпълнение на SQL заявка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="rawSql" className="text-sm font-medium">
                SQL заявка *
              </label>
              <Textarea
                id="rawSql"
                value={rawSql}
                onChange={(e) => setRawSql(e.target.value)}
                className="bg-gray-800 border-gray-700 min-h-[100px]"
                placeholder="Въведете SQL заявка (SELECT, UPDATE, INSERT, DELETE)"
              />
            </div>

            <Button onClick={handleExecuteSql} disabled={sqlLoading} className="w-full">
              {sqlLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Изпълнение...
                </>
              ) : (
                "Изпълни SQL"
              )}
            </Button>

            {sqlError && (
              <div className="bg-red-900/20 border border-red-800 p-4 rounded-md">
                <p className="text-red-400">{sqlError}</p>
              </div>
            )}

            {sqlResult && (
              <div className="bg-gray-800 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Резултат:</h3>
                <pre className="text-sm overflow-x-auto">{JSON.stringify(sqlResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
