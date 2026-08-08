"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Fish, Search, RefreshCw, Trophy, Trash2, Store, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface Fisherman {
  id: number
  name: string
  phone: string
  customerId: string | null
  storeName: string
  agreedTerms: boolean
  agreedMarketing: boolean
  isWinner: boolean
  createdAt: string
}

interface StoreCount {
  customerId: string | null
  storeName: string
  count: number
}

export default function FishermenPage() {
  const [fishermen, setFishermen] = useState<Fisherman[]>([])
  const [storeCounts, setStoreCounts] = useState<StoreCount[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [storeFilter, setStoreFilter] = useState("all")
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Winner draw state
  const [drawOpen, setDrawOpen] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [rollingName, setRollingName] = useState("")
  const [winner, setWinner] = useState<Fisherman | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadFishermen = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (storeFilter !== "all") params.set("store", storeFilter)
      const res = await fetch(`/api/admin/fishermen?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("HTTP " + res.status)
      const data = await res.json()
      setFishermen(Array.isArray(data.fishermen) ? data.fishermen : [])
      setStoreCounts(Array.isArray(data.storeCounts) ? data.storeCounts : [])
      setTotal(Number(data.total) || 0)
    } catch (e) {
      console.error("Load fishermen error:", e)
      toast({ title: "Грешка", description: "Неуспешно зареждане на рибарите.", variant: "destructive" })
      setFishermen([])
    } finally {
      setLoading(false)
    }
  }, [search, storeFilter])

  useEffect(() => {
    loadFishermen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilter])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formatDate = (d: string) => {
    if (!d) return "—"
    try {
      return new Date(d).toLocaleString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return d
    }
  }

  const persistWinner = async (id: number, isWinner: boolean) => {
    try {
      await fetch("/api/admin/fishermen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isWinner }),
      })
      setFishermen((prev) => prev.map((f) => (f.id === id ? { ...f, isWinner } : f)))
    } catch (e) {
      console.error("Persist winner error:", e)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този рибар?")) return
    try {
      await fetch(`/api/admin/fishermen?id=${id}`, { method: "DELETE" })
      setFishermen((prev) => prev.filter((f) => f.id !== id))
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast({ title: "Изтрито", description: "Рибарят беше премахнат." })
    } catch (e) {
      console.error("Delete error:", e)
      toast({ title: "Грешка", description: "Неуспешно изтриване.", variant: "destructive" })
    }
  }

  const startDraw = () => {
    // Ако има чекнати – теглим само измежду тях, иначе измежду всички видими
    const pool = selected.size > 0 ? fishermen.filter((f) => selected.has(f.id)) : fishermen
    if (pool.length === 0) {
      toast({ title: "Няма участници", description: "Няма рибари за теглене.", variant: "destructive" })
      return
    }

    setWinner(null)
    setDrawOpen(true)
    setDrawing(true)

    // Разбъркваме имената визуално
    intervalRef.current = setInterval(() => {
      const random = pool[Math.floor(Math.random() * pool.length)]
      setRollingName(random?.name || "")
    }, 80)

    // Ако има предварително маркирани печеливши в набора – печели един от тях (нагласено теглене)
    const preMarked = pool.filter((f) => f.isWinner)

    // След 3.5 секунди спираме и обявяваме печеливш
    setTimeout(async () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const chosen =
        preMarked.length > 0
          ? preMarked[Math.floor(Math.random() * preMarked.length)]
          : pool[Math.floor(Math.random() * pool.length)]
      setRollingName(chosen.name)
      setWinner(chosen)
      setDrawing(false)
      await persistWinner(chosen.id, true)
    }, 3500)
  }

  const totalRegistered = storeCounts.reduce((acc, s) => acc + s.count, 0)
  const winnersCount = fishermen.filter((f) => f.isWinner).length

  // Имена за скролващата лента по време на теглене
  const marqueeNames =
    fishermen.length > 0 ? fishermen.map((f) => f.name).filter(Boolean) : ["MADIX", "ТОМБОЛА", "РИБАРИ"]

  // Конфети за екрана с печеливш (генерира се веднъж)
  const confettiPieces = useRef(
    Array.from({ length: 60 }, () => {
      const palette = ["#f97316", "#facc15", "#ffffff", "#22c55e", "#ef4444"]
      return {
        left: Math.random() * 100,
        size: `${8 + Math.random() * 12}px`,
        color: palette[Math.floor(Math.random() * palette.length)],
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 2.5,
      }
    }),
  ).current

  return (
    <div className="container mx-auto p-4">
      {/* Обобщение */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Общо регистрирани</p>
              <p className="text-2xl font-bold text-gray-900">{totalRegistered}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Магазини с регистрации</p>
              <p className="text-2xl font-bold text-gray-900">{storeCounts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Печеливши</p>
              <p className="text-2xl font-bold text-gray-900">{winnersCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <Fish className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Избрани за теглене</p>
              <p className="text-2xl font-bold text-gray-900">{selected.size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Fish className="h-6 w-6 text-orange-600" />
                Регистрирани рибари
              </CardTitle>
              <CardDescription className="text-gray-600">
                Всички рибари, регистрирали се чрез QR кодовете на магазините.
              </CardDescription>
            </div>
            <Button
              onClick={startDraw}
              className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
              disabled={fishermen.length === 0}
            >
              <Trophy className="mr-2 h-4 w-4" />
              {selected.size > 0 ? `Изтегли измежду избраните (${selected.size})` : "Изтегли печеливш"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Филтри */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Търсене по име, телефон или магазин..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) loadFishermen()
                }}
                className="flex-1"
              />
              <Button onClick={loadFishermen} variant="outline" className="bg-white">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-[260px] bg-white">
                  <SelectValue placeholder="Всички магазини" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички магазини</SelectItem>
                  {storeCounts
                    .filter((s) => s.customerId)
                    .map((s) => (
                      <SelectItem key={s.customerId} value={s.customerId as string}>
                        {s.storeName} ({s.count})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={loadFishermen} variant="outline" className="bg-white" title="Обнови">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600" />
            </div>
          ) : fishermen.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Все още няма регистрирани рибари.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-10" />
                    <TableHead className="font-semibold">Имена</TableHead>
                    <TableHead className="font-semibold">Телефон</TableHead>
                    <TableHead className="font-semibold">Магазин</TableHead>
                    <TableHead className="font-semibold">Регистриран на</TableHead>
                    <TableHead className="font-semibold text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fishermen.map((f) => (
                    <TableRow
                      key={f.id}
                      className={`border-b hover:bg-gray-50 ${f.isWinner ? "bg-amber-50" : ""}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.has(f.id)}
                          onCheckedChange={() => toggleSelected(f.id)}
                          aria-label={`Избери ${f.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {f.name}
                          {f.isWinner && (
                            <Badge className="bg-amber-500 text-white">
                              <Trophy className="mr-1 h-3 w-3" />
                              Печеливш
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{f.phone}</TableCell>
                      <TableCell>{f.storeName || "Без магазин"}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(f.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 px-2 ${
                              f.isWinner ? "bg-amber-100 text-amber-700" : "bg-white text-amber-600"
                            }`}
                            onClick={() => persistWinner(f.id, !f.isWinner)}
                            title={f.isWinner ? "Премахни печеливш" : "Маркирай като печеливш"}
                          >
                            <Trophy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(f.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Изтрий</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Теглене на печеливш – цял екран, брутален дизайн */}
      {drawOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] font-sans"
          role="dialog"
          aria-modal="true"
          aria-label="Теглене на печеливш"
        >
          <style>{`
            @keyframes reel-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            @keyframes confetti-fall {
              0% { transform: translateY(-120vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(120vh) rotate(720deg); opacity: 1; }
            }
            @keyframes brutal-shake {
              0%,100% { transform: translate(0,0) rotate(-1deg); }
              25% { transform: translate(-6px,4px) rotate(1.5deg); }
              50% { transform: translate(5px,-5px) rotate(-1.5deg); }
              75% { transform: translate(-4px,-3px) rotate(1deg); }
            }
            @keyframes winner-pop {
              0% { transform: scale(0.4) rotate(-6deg); opacity: 0; }
              60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
              100% { transform: scale(1) rotate(-2deg); opacity: 1; }
            }
            @keyframes blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.15; } }
          `}</style>

          {/* Диагонални райета на фона */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,#fff 0,#fff 3px,transparent 3px,transparent 26px)",
            }}
          />
          {/* Ъглов блок с етикет */}
          <div className="absolute left-0 top-0 border-b-4 border-r-4 border-[#f97316] bg-[#f97316] px-5 py-2 sm:px-8 sm:py-3">
            <span className="text-lg font-black uppercase tracking-[0.2em] text-black sm:text-2xl">
              MADIX × ТОМБОЛА
            </span>
          </div>

          {/* Затваряне (само когато не тегли) */}
          {!drawing && (
            <button
              onClick={() => setDrawOpen(false)}
              className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center border-4 border-white bg-black text-2xl font-black text-white transition-transform hover:-translate-y-1 hover:bg-[#f97316] hover:text-black sm:right-8 sm:top-8"
              aria-label="Затвори"
            >
              ✕
            </button>
          )}

          {drawing ? (
            <div className="relative z-10 flex w-full flex-col items-center px-4">
              <p className="mb-8 text-2xl font-black uppercase tracking-[0.3em] text-[#f97316] sm:text-4xl">
                Теглене на печеливш
              </p>

              {/* Гигантско разбъркващо се име */}
              <div
                className="w-full max-w-5xl border-8 border-[#f97316] bg-white px-6 py-10 text-center shadow-[16px_16px_0_0_#f97316] sm:py-16"
                style={{ animation: "brutal-shake 0.35s infinite" }}
              >
                <p className="truncate text-[clamp(2.5rem,12vw,9rem)] font-black uppercase leading-none tracking-tighter text-black">
                  {rollingName || "···"}
                </p>
              </div>

              <p
                className="mt-10 text-xl font-black uppercase tracking-[0.35em] text-white sm:text-3xl"
                style={{ animation: "blink 0.9s steps(1) infinite" }}
              >
                Разбъркваме имената
              </p>

              {/* Скролваща лента с всички имена */}
              <div className="absolute inset-x-0 bottom-6 overflow-hidden border-y-4 border-white/20 py-3">
                <div className="flex w-max whitespace-nowrap" style={{ animation: "reel-scroll 12s linear infinite" }}>
                  {[...marqueeNames, ...marqueeNames].map((n, i) => (
                    <span key={i} className="mx-6 text-2xl font-black uppercase tracking-widest text-white/25">
                      {n} <span className="text-[#f97316]">✦</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : winner ? (
            <div className="relative z-10 flex w-full flex-col items-center px-4">
              {/* Конфети */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {confettiPieces.map((c, i) => (
                  <span
                    key={i}
                    className="absolute top-0 block"
                    style={{
                      left: `${c.left}%`,
                      width: c.size,
                      height: c.size,
                      backgroundColor: c.color,
                      animation: `confetti-fall ${c.duration}s linear ${c.delay}s infinite`,
                    }}
                  />
                ))}
              </div>

              <div
                className="flex items-center gap-3 border-4 border-black bg-[#facc15] px-6 py-2 shadow-[8px_8px_0_0_#000]"
                style={{ animation: "winner-pop 0.6s ease-out both" }}
              >
                <Trophy className="h-8 w-8 text-black sm:h-10 sm:w-10" />
                <span className="text-2xl font-black uppercase tracking-[0.25em] text-black sm:text-4xl">
                  Печеливш
                </span>
              </div>

              {/* Голямото име */}
              <div
                className="mt-10 w-full max-w-5xl border-8 border-white bg-[#f97316] px-6 py-12 text-center shadow-[20px_20px_0_0_#facc15] sm:py-20"
                style={{ animation: "winner-pop 0.7s 0.1s ease-out both" }}
              >
                <p className="text-balance text-[clamp(3rem,13vw,10rem)] font-black uppercase leading-[0.9] tracking-tighter text-black">
                  {winner.name}
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={startDraw}
                  className="border-4 border-white bg-black px-8 py-4 text-lg font-black uppercase tracking-widest text-white transition-transform hover:-translate-y-1 hover:bg-white hover:text-black"
                >
                  Тегли отново
                </button>
                <button
                  onClick={() => setDrawOpen(false)}
                  className="border-4 border-black bg-[#f97316] px-10 py-4 text-lg font-black uppercase tracking-widest text-black shadow-[8px_8px_0_0_#fff] transition-transform hover:-translate-y-1"
                >
                  Готово
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
