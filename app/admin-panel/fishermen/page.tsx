"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Fish, Search, RefreshCw, Trophy, Trash2, Store, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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

    // След 3.5 секунди спираме и обявяваме печеливш
    setTimeout(async () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const chosen = pool[Math.floor(Math.random() * pool.length)]
      setRollingName(chosen.name)
      setWinner(chosen)
      setDrawing(false)
      await persistWinner(chosen.id, true)
    }, 3500)
  }

  const totalRegistered = storeCounts.reduce((acc, s) => acc + s.count, 0)
  const winnersCount = fishermen.filter((f) => f.isWinner).length

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

      {/* Диалог за теглене на печеливш */}
      <Dialog open={drawOpen} onOpenChange={(o) => !drawing && setDrawOpen(o)}>
        <DialogContent className="bg-white sm:max-w-lg" onInteractOutside={(e) => drawing && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Теглене на печеливш
            </DialogTitle>
            <DialogDescription>
              {selected.size > 0
                ? "Тегли се измежду избраните рибари."
                : "Тегли се измежду всички показани рибари."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center gap-4 py-8">
            {drawing ? (
              <>
                <Sparkles className="h-10 w-10 animate-pulse text-amber-500" />
                <div className="w-full rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 px-6 py-8 text-center">
                  <p className="animate-pulse text-3xl font-extrabold text-orange-700">{rollingName || "..."}</p>
                </div>
                <p className="text-sm text-gray-500">Разбъркваме имената...</p>
              </>
            ) : winner ? (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                  <Trophy className="h-10 w-10 text-amber-500" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Печеливш</p>
                <p className="text-balance text-center text-4xl font-extrabold text-gray-900">{winner.name}</p>
                <div className="text-center text-gray-600">
                  <p>{winner.phone}</p>
                  <p className="text-sm">{winner.storeName || "Без магазин"}</p>
                </div>
                <Button
                  onClick={() => setDrawOpen(false)}
                  className="mt-2 bg-orange-600 hover:bg-orange-700"
                >
                  Готово
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
