"use client"

import { useState, useEffect } from "react"
import { Copy, Check, ExternalLink, RefreshCw, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MetaFeedPage() {
  const [feedStats, setFeedStats] = useState<{
    productCount: number
    lastChecked: string | null
    feedUrl: string
    csvUrl: string
    eurFeedUrl: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  // Display URLs should always show the production domain
  const displayBaseUrl = "https://www.madiks.bg"

  useEffect(() => {
    // Fetch from the current origin (works both in preview and production)
    const localFeedUrl = `${baseUrl}/api/meta-product-feed`
    const feedUrl = `${displayBaseUrl}/api/meta-product-feed`
    const csvUrl = `${displayBaseUrl}/api/meta-product-feed?format=csv`
    const eurFeedUrl = `${displayBaseUrl}/api/meta-product-feed?currency=EUR`

    // Check the feed by fetching it
    fetch(localFeedUrl)
      .then((res) => res.text())
      .then((xml) => {
        console.log("[v0] Feed response length:", xml.length, "First 200 chars:", xml.substring(0, 200))
        const entryCount = (xml.match(/<entry>/g) || []).length
        // Check for error comments in the XML
        const errorMatch = xml.match(/<!-- Feed Error: (.+?) -->/)
        if (errorMatch) {
          setFeedError(errorMatch[1])
        }
        setFeedStats({
          productCount: entryCount,
          lastChecked: new Date().toLocaleString("bg-BG"),
          feedUrl,
          csvUrl,
          eurFeedUrl,
        })
        setLoading(false)
      })
      .catch((err) => {
        console.error("[v0] Feed fetch error:", err)
        setFeedError(err.message)
        setFeedStats({
          productCount: 0,
          lastChecked: new Date().toLocaleString("bg-BG"),
          feedUrl,
          csvUrl,
          eurFeedUrl,
        })
        setLoading(false)
      })
  }, [baseUrl])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const loadPreview = async () => {
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/meta-product-feed`)
      const xml = await res.text()
      // Show first 3000 characters
      setPreviewData(xml.substring(0, 3000) + (xml.length > 3000 ? "\n..." : ""))
    } catch {
      setPreviewData("Грешка при зареждане на фийда.")
    }
    setPreviewLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meta Product Feed</h1>
        <p className="text-gray-500 mt-1">
          Каталог с продукти за Meta Business Suite (Facebook / Instagram реклами)
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Зареждане...</span>
        </div>
      ) : (
        <>
          {/* Error display */}
          {feedError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-red-800">Грешка при зареждане на фийда:</p>
                <p className="text-xs text-red-600 mt-1 font-mono">{feedError}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Продукти във фийда</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{feedStats?.productCount || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Формат</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">XML + CSV</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Последна проверка</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900">{feedStats?.lastChecked || "N/A"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Feed URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                XML Feed URL (BGN)
              </CardTitle>
              <CardDescription>
                Основен фийд в XML формат. Използвайте този URL в Meta Commerce Manager.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono break-all text-gray-800">
                  {feedStats?.feedUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(feedStats?.feedUrl || "", "xml")}
                  className="shrink-0"
                >
                  {copiedField === "xml" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <a href={feedStats?.feedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                XML Feed URL (EUR)
              </CardTitle>
              <CardDescription>
                Фийд с цени в евро. За европейски реклами.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono break-all text-gray-800">
                  {feedStats?.eurFeedUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(feedStats?.eurFeedUrl || "", "eur")}
                  className="shrink-0"
                >
                  {copiedField === "eur" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <a href={feedStats?.eurFeedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                CSV Feed URL
              </CardTitle>
              <CardDescription>
                Алтернативен формат - CSV. Може да се използва и за Google Merchant Center.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono break-all text-gray-800">
                  {feedStats?.csvUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(feedStats?.csvUrl || "", "csv")}
                  className="shrink-0"
                >
                  {copiedField === "csv" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <a href={feedStats?.csvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Инструкции за Meta Business Suite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Отворете Commerce Manager</p>
                    <p className="text-sm text-gray-500">
                      Отидете на{" "}
                      <a
                        href="https://business.facebook.com/commerce"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        business.facebook.com/commerce
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Създайте каталог</p>
                    <p className="text-sm text-gray-500">
                      Изберете {"\""}Add Catalog{"\""} {"->"} {"\""}E-commerce{"\""}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Добавете Data Feed</p>
                    <p className="text-sm text-gray-500">
                      Data Sources {"->"} Data Feed {"->"} Scheduled Feed {"->"} поставете XML URL-а от по-горе
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Настройте график</p>
                    <p className="text-sm text-gray-500">
                      Задайте на {"\""}Hourly{"\""} или {"\""}Daily{"\""} за автоматична синхронизация
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                    5
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Свържете с Pixel</p>
                    <p className="text-sm text-gray-500">
                      В настройките на каталога, свържете го с вашия Meta Pixel (ID: 4091774537713950). Така Meta ще
                      разпознава продуктите при ViewContent, AddToCart и Purchase евентите.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                    6
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Създайте Dynamic Ads</p>
                    <p className="text-sm text-gray-500">
                      В Ads Manager изберете {"\""}Catalog Sales{"\""} като цел и изберете продукти от каталога.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Преглед на фийда</CardTitle>
              <CardDescription>Показва първите записи от XML фийда</CardDescription>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <pre className="bg-gray-100 p-4 rounded-md text-xs font-mono overflow-x-auto max-h-96 text-gray-800 whitespace-pre-wrap">
                  {previewData}
                </pre>
              ) : (
                <Button onClick={loadPreview} disabled={previewLoading} variant="outline">
                  {previewLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Зареждане...
                    </>
                  ) : (
                    "Покажи преглед"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
