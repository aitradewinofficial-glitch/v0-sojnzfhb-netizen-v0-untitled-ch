"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Boxes, AlertTriangle, Truck, Pencil, Trash2, PackageSearch } from "lucide-react"

const CATEGORIES = ["Етикети", "Седящи пликове", "Фолио", "Кашони", "Вакуум пликове", "Буркан", "Бутилка"]

interface Material {
  id: number
  category: string
  name: string
  stock: number
  min_quantity: number
  created_at: string
  updated_at: string
}

const emptyForm = { category: "", name: "", stock: 0, min_quantity: 0 }

export default function SupplyPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [addOpen, setAddOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ ...emptyForm })

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deliveryTarget, setDeliveryTarget] = useState<Material | null>(null)
  const [deliveryAmount, setDeliveryAmount] = useState<number>(0)

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/supply/materials")
      if (res.ok) {
        const data = await res.json()
        setMaterials(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast({ title: "Грешка", description: "Проблем при зареждане на материалите", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const lowStock = useMemo(
    () => materials.filter((m) => Number(m.stock) < Number(m.min_quantity)),
    [materials],
  )

  const filtered = useMemo(
    () => (categoryFilter === "all" ? materials : materials.filter((m) => m.category === categoryFilter)),
    [materials, categoryFilter],
  )

  const isLow = (m: Material) => Number(m.stock) < Number(m.min_quantity)

  const addMaterial = async () => {
    if (!newMaterial.category) {
      toast({ title: "Грешка", description: "Изберете категория", variant: "destructive" })
      return
    }
    if (!newMaterial.name.trim()) {
      toast({ title: "Грешка", description: "Въведете име на материала", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/admin/supply/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaterial),
      })
      if (res.ok) {
        toast({ title: "Успех", description: "Материалът е добавен" })
        setNewMaterial({ ...emptyForm })
        setAddOpen(false)
        fetchMaterials()
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }
    } catch (error: any) {
      toast({ title: "Грешка", description: error.message || "Проблем при добавяне", variant: "destructive" })
    }
  }

  const updateMaterial = async () => {
    if (!editing) return
    try {
      const res = await fetch(`/api/admin/supply/materials/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editing.category,
          name: editing.name,
          stock: editing.stock,
          min_quantity: editing.min_quantity,
        }),
      })
      if (res.ok) {
        toast({ title: "Успех", description: "Материалът е обновен" })
        setEditOpen(false)
        setEditing(null)
        fetchMaterials()
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }
    } catch (error: any) {
      toast({ title: "Грешка", description: error.message || "Проблем при обновяване", variant: "destructive" })
    }
  }

  const submitDelivery = async () => {
    if (!deliveryTarget) return
    if (!deliveryAmount || deliveryAmount <= 0) {
      toast({ title: "Грешка", description: "Въведете положително количество", variant: "destructive" })
      return
    }
    try {
      const res = await fetch(`/api/admin/supply/materials/${deliveryTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addStock: deliveryAmount }),
      })
      if (res.ok) {
        toast({ title: "Успех", description: `Добавени ${deliveryAmount} бр. към "${deliveryTarget.name}"` })
        setDeliveryOpen(false)
        setDeliveryTarget(null)
        setDeliveryAmount(0)
        fetchMaterials()
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({ title: "Грешка", description: "Проблем при записване на доставката", variant: "destructive" })
    }
  }

  const deleteMaterial = async (m: Material) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете "${m.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/supply/materials/${m.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Успех", description: "Материалът е изтрит" })
        fetchMaterials()
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({ title: "Грешка", description: "Проблем при изтриване", variant: "destructive" })
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Boxes className="h-6 w-6 text-orange-600" />
            Снабдяване
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Проследяване на наличности от опаковки, етикети, пликове и други материали
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Добави материал
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добави нов материал</DialogTitle>
              <DialogDescription>Въведете данните за материала</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-category">Категория *</Label>
                <Select
                  value={newMaterial.category}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, category: value })}
                >
                  <SelectTrigger id="new-category">
                    <SelectValue placeholder="Изберете категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-name">Име на материала *</Label>
                <Input
                  id="new-name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  placeholder="напр. Етикет 100гр мед"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-stock">Наличност</Label>
                  <Input
                    id="new-stock"
                    type="number"
                    min="0"
                    value={newMaterial.stock}
                    onChange={(e) => setNewMaterial({ ...newMaterial, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-min">Минимално количество</Label>
                  <Input
                    id="new-min"
                    type="number"
                    min="0"
                    value={newMaterial.min_quantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, min_quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Отказ
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={addMaterial}>
                Добави
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lowStock.length > 0 && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />
              Материали под минимума ({lowStock.length})
            </CardTitle>
            <CardDescription className="text-red-600">
              Следните материали трябва да бъдат поръчани / доставени спешно
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((m) => (
                <Badge key={m.id} variant="outline" className="border-red-400 text-red-700 bg-white">
                  {m.name}: {Number(m.stock)} / мин. {Number(m.min_quantity)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Всички материали</CardTitle>
          <div className="w-56">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Всички категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички категории</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PackageSearch className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Няма добавени материали</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категория</TableHead>
                  <TableHead>Име</TableHead>
                  <TableHead className="text-right">Наличност</TableHead>
                  <TableHead className="text-right">Минимум</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className={isLow(m) ? "bg-red-50" : undefined}>
                    <TableCell>
                      <Badge variant="secondary">{m.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(m.stock)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{Number(m.min_quantity)}</TableCell>
                    <TableCell>
                      {isLow(m) ? (
                        <Badge className="bg-red-600 hover:bg-red-600">Под минимума</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          Наличен
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Доставка"
                          onClick={() => {
                            setDeliveryTarget(m)
                            setDeliveryAmount(0)
                            setDeliveryOpen(true)
                          }}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Редакция"
                          onClick={() => {
                            setEditing({ ...m })
                            setEditOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Изтрий"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteMaterial(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалог за редакция */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирай материал</DialogTitle>
            <DialogDescription>Променете данните на материала</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category">Категория</Label>
                <Select
                  value={editing.category}
                  onValueChange={(value) => setEditing({ ...editing, category: value })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Изберете категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-name">Име на материала</Label>
                <Input
                  id="edit-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-stock">Наличност</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={editing.stock}
                    onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-min">Минимално количество</Label>
                  <Input
                    id="edit-min"
                    type="number"
                    min="0"
                    value={editing.min_quantity}
                    onChange={(e) => setEditing({ ...editing, min_quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Отказ
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={updateMaterial}>
              Запази
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог за доставка */}
      <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Доставка на материал</DialogTitle>
            <DialogDescription>
              {deliveryTarget
                ? `Добавете доставено количество към "${deliveryTarget.name}" (текуща наличност: ${Number(
                    deliveryTarget.stock,
                  )})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delivery-amount">Доставено количество</Label>
            <Input
              id="delivery-amount"
              type="number"
              min="1"
              value={deliveryAmount}
              onChange={(e) => setDeliveryAmount(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryOpen(false)}>
              Отказ
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={submitDelivery}>
              Запиши доставка
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
