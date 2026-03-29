"use client"

import { useState, useEffect, useTransition } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HomePageImageUpload } from "@/components/home-image-uploader"
import { useToast } from "@/components/ui/use-toast"
import {
  Trash2,
  Loader2,
  Pencil,
  Save,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Link2,
  GripVertical,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface HomePageImage {
  id: number
  image_url: string
  is_active: boolean
  sort_order?: number
  link_url?: string | null
  created_at: string
}

export default function ManageHomePageImage() {
  const [images, setImages] = useState<HomePageImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [editingImageId, setEditingImageId] = useState<number | null>(null)
  const [editedUrl, setEditedUrl] = useState("")
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null)
  const [editedLinkUrl, setEditedLinkUrl] = useState("")
  const { toast } = useToast()

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/home-images")
      if (!response.ok) throw new Error("Failed to fetch images")
      const data = await response.json()
      // Sort by sort_order first, then by created_at
      const sorted = (data || []).sort((a: HomePageImage, b: HomePageImage) => {
        const orderA = a.sort_order ?? 999
        const orderB = b.sort_order ?? 999
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setImages(sorted)
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на снимките.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleImageUploaded = () => {
    toast({
      title: "Успешно качена снимка",
      description: "Обновяване на списъка...",
    })
    fetchImages()
  }

  const handleToggleActive = (id: number, currentActive: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/home-images/${id}/toggle-active`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !currentActive }),
        })
        if (!response.ok) throw new Error("Failed to toggle active")
        toast({
          title: "Успех",
          description: !currentActive ? "Банерът е активиран." : "Банерът е деактивиран.",
        })
        fetchImages()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешна промяна на статуса.",
          variant: "destructive",
        })
      }
    })
  }

  const handleDelete = (id: number, url: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този банер?")) return
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/home-images/${id}/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })
        if (!response.ok) throw new Error("Failed to delete image")
        toast({ title: "Успех", description: "Снимката е изтрита." })
        fetchImages()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешно изтриване на снимка.",
          variant: "destructive",
        })
      }
    })
  }

  const handleEditClick = (image: HomePageImage) => {
    setEditingImageId(image.id)
    setEditedUrl(image.image_url)
  }

  const handleCancelEdit = () => {
    setEditingImageId(null)
    setEditedUrl("")
  }

  const handleSaveUrl = (id: number) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/home-images/${id}/update-url`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newUrl: editedUrl }),
        })
        if (!response.ok) throw new Error("Failed to update URL")
        toast({ title: "Успех", description: "URL адресът е обновен." })
        handleCancelEdit()
        fetchImages()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешно обновяване на URL адреса.",
          variant: "destructive",
        })
      }
    })
  }

  const handleEditLinkClick = (image: HomePageImage) => {
    setEditingLinkId(image.id)
    setEditedLinkUrl(image.link_url || "")
  }

  const handleCancelLinkEdit = () => {
    setEditingLinkId(null)
    setEditedLinkUrl("")
  }

  const handleSaveLinkUrl = (id: number) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/home-images/${id}/link-url`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link_url: editedLinkUrl || null }),
        })
        if (!response.ok) throw new Error("Failed to update link URL")
        toast({ title: "Успех", description: "Линкът е обновен." })
        handleCancelLinkEdit()
        fetchImages()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешно обновяване на линка.",
          variant: "destructive",
        })
      }
    })
  }

  const handleMoveSortOrder = (id: number, direction: "up" | "down") => {
    const currentIndex = images.findIndex((img) => img.id === id)
    if (currentIndex === -1) return
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === images.length - 1) return

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const currentImage = images[currentIndex]
    const swapImage = images[swapIndex]

    // Swap sort orders
    const currentOrder = currentImage.sort_order ?? currentIndex
    const swapOrder = swapImage.sort_order ?? swapIndex

    startTransition(async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/admin/home-images/${currentImage.id}/sort-order`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: swapOrder }),
          }),
          fetch(`/api/admin/home-images/${swapImage.id}/sort-order`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: currentOrder }),
          }),
        ])
        if (!res1.ok || !res2.ok) throw new Error("Failed to update sort order")
        toast({ title: "Успех", description: "Редът е обновен." })
        fetchImages()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешна промяна на реда.",
          variant: "destructive",
        })
      }
    })
  }

  const activeCount = images.filter((img) => img.is_active).length

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Управление на банери</CardTitle>
          <CardDescription>
            Качете и управлявайте банерите на началната страница. Можете да имате множество активни банери, които ще се
            въртят в карусел. Задайте ред на показване и линкове за всеки банер.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomePageImageUpload onImageUploaded={handleImageUploaded} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активни банери</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Общо банери</p>
              <p className="text-2xl font-bold">{images.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner List */}
      <Card>
        <CardHeader>
          <CardTitle>Всички банери</CardTitle>
          <CardDescription>
            Включете/изключете банерите, подредете ги и добавете линкове. Активните банери се показват в карусела на
            началната страница.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма качени банери. Качете нова снимка по-горе.</p>
          ) : (
            <div className="space-y-4">
              {images.map((image, index) => (
                <Card
                  key={image.id}
                  className={`overflow-hidden transition-all ${
                    image.is_active ? "border-green-300 bg-green-50/30" : "border-gray-200 opacity-75"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image Preview */}
                    <div className="relative w-full md:w-64 lg:w-80 aspect-[21/9] md:aspect-auto md:min-h-[140px] flex-shrink-0">
                      <Image
                        src={image.image_url || "/placeholder.svg"}
                        alt={`Banner ${image.id}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?text=Invalid+Image"
                        }}
                      />
                      {image.is_active && (
                        <Badge className="absolute top-2 left-2 bg-green-600 text-white">Активен</Badge>
                      )}
                      {!image.is_active && (
                        <Badge variant="secondary" className="absolute top-2 left-2">
                          Неактивен
                        </Badge>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* Top row: Active toggle + Sort Order */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={image.is_active}
                            onCheckedChange={() => handleToggleActive(image.id, image.is_active)}
                            disabled={isPending}
                          />
                          <Label className="text-sm font-medium">
                            {image.is_active ? "Активен" : "Неактивен"}
                          </Label>
                        </div>

                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mr-1">Ред:</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSortOrder(image.id, "up")}
                            disabled={index === 0 || isPending}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSortOrder(image.id, "down")}
                            disabled={index === images.length - 1 || isPending}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Image URL */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">URL на снимка</Label>
                        {editingImageId === image.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editedUrl}
                              onChange={(e) => setEditedUrl(e.target.value)}
                              disabled={isPending}
                              placeholder="Поставете нов URL адрес"
                              className="text-xs"
                            />
                            <Button onClick={() => handleSaveUrl(image.id)} disabled={isPending} size="sm">
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                            <Button onClick={handleCancelEdit} disabled={isPending} variant="ghost" size="sm">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground break-all line-clamp-1 flex-1">
                              {image.image_url}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={() => handleEditClick(image)}
                              disabled={isPending}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Link URL */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          Линк (при клик върху банера)
                        </Label>
                        {editingLinkId === image.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editedLinkUrl}
                              onChange={(e) => setEditedLinkUrl(e.target.value)}
                              disabled={isPending}
                              placeholder="https://example.com/page или /category/1"
                              className="text-xs"
                            />
                            <Button onClick={() => handleSaveLinkUrl(image.id)} disabled={isPending} size="sm">
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                            <Button onClick={handleCancelLinkEdit} disabled={isPending} variant="ghost" size="sm">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground break-all line-clamp-1 flex-1">
                              {image.link_url || "Няма линк"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={() => handleEditLinkClick(image)}
                              disabled={isPending}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Bottom row: Delete */}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs text-muted-foreground">
                          Добавен: {new Date(image.created_at).toLocaleDateString("bg-BG")}
                        </span>
                        <Button
                          onClick={() => handleDelete(image.id, image.image_url)}
                          disabled={isPending}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Изтрий
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
