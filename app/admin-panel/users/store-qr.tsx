"use client"

import { useState } from "react"
import QRCode from "qrcode"
import { QrCode, Download, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function buildPromoUrl(storeId: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/promo/${encodeURIComponent(storeId)}`
}

async function generateQrDataUrl(storeId: string) {
  const url = buildPromoUrl(storeId)
  return QRCode.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: "M" })
}

function safeFileName(name: string) {
  return (name || "магазин").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60)
}

// Бутон + диалог за преглед/сваляне на QR код за конкретен магазин
export function StoreQrButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [open, setOpen] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    setOpen(true)
    if (!dataUrl) {
      setLoading(true)
      try {
        setDataUrl(await generateQrDataUrl(storeId))
      } catch (e) {
        console.error("QR generation error:", e)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDownload = () => {
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `QR_${safeFileName(storeName)}.png`
    a.click()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 bg-white text-orange-600 hover:text-orange-700"
        onClick={handleOpen}
        title="QR код"
      >
        <QrCode className="h-4 w-4" />
        <span className="sr-only">QR код</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR код за регистрация</DialogTitle>
            <DialogDescription>{storeName || "Магазин"}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {loading || !dataUrl ? (
              <div className="flex h-64 w-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl || "/placeholder.svg"} alt={`QR код за ${storeName}`} className="h-64 w-64" />
            )}
            <p className="break-all text-center text-xs text-gray-500">{buildPromoUrl(storeId)}</p>
            <Button onClick={handleDownload} disabled={!dataUrl} className="w-full bg-orange-600 hover:bg-orange-700">
              <Download className="mr-2 h-4 w-4" />
              Свали PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ExportStore {
  id: string
  storename?: string
  companyname?: string
}

// Бутон за експорт на всички QR кодове (за печат на плакати)
export function ExportQrButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/customers?page=1&limit=100000")
      const data = await res.json()
      const stores: ExportStore[] = Array.isArray(data.customers) ? data.customers : []

      const cards = await Promise.all(
        stores
          .filter((s) => s.id)
          .map(async (s) => {
            const name = s.storename || s.companyname || "Магазин"
            const qr = await generateQrDataUrl(s.id)
            return { name, qr }
          }),
      )

      const win = window.open("", "_blank")
      if (!win) {
        alert("Моля, разрешете изскачащите прозорци (pop-ups), за да експортирате QR кодовете.")
        return
      }

      const cardsHtml = cards
        .map(
          (c) => `
            <div class="card">
              <div class="store">${c.name.replace(/</g, "&lt;")}</div>
              <img src="${c.qr}" alt="QR" />
              <div class="cta">Сканирай и спечели седмична награда</div>
            </div>`,
        )
        .join("")

      win.document.write(`
        <!doctype html>
        <html lang="bg">
          <head>
            <meta charset="utf-8" />
            <title>QR кодове за магазини</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #fff; color: #111; }
              h1 { font-size: 20px; margin: 0 0 16px; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
              .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; }
              .store { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
              .card img { width: 100%; max-width: 220px; height: auto; }
              .cta { margin-top: 8px; font-size: 12px; color: #c2410c; font-weight: 600; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom:16px;">
              <button onclick="window.print()" style="padding:10px 16px;border:0;border-radius:8px;background:#ea580c;color:#fff;font-weight:600;cursor:pointer;">Печат / Запази като PDF</button>
              <span style="margin-left:12px;color:#666;">Общо магазини: ${cards.length}</span>
            </div>
            <h1>QR кодове за регистрация по магазини</h1>
            <div class="grid">${cardsHtml}</div>
          </body>
        </html>
      `)
      win.document.close()
    } catch (e) {
      console.error("Export error:", e)
      alert("Възникна грешка при експорта на QR кодовете.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant="outline"
      className="bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
      Експорт на QR кодове
    </Button>
  )
}
