"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  Trash2,
  Loader2,
  Pencil,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Star,
  GripVertical,
  ImageIcon,
  Upload,
  X,
  Search,
  Type,
  FileText,
  Link2,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContentBlock {
  type: "text" | "image" | "heading"
  content?: string
  url?: string
  alt?: string
  level?: number
}

interface NewsItem {
  id: number
  title: string
  title_en: string | null
  summary: string | null
  summary_en: string | null
  content: string | null
  content_en: string | null
  image_url: string | null
  link_url: string | null
  is_active: boolean
  is_featured: boolean
  sort_order: number
  slug: string | null
  meta_title: string | null
  meta_title_en: string | null
  meta_description: string | null
  meta_description_en: string | null
  meta_keywords: string | null
  meta_keywords_en: string | null
  content_blocks: ContentBlock[]
  content_blocks_en: ContentBlock[]
  related_products: string[]
  gallery_images: string[]
  created_at: string
  updated_at: string
}

interface Product {
  objectid: string
  title: string
  photourl: string | null
}

const emptyNews = {
  title: "",
  title_en: "",
  summary: "",
  summary_en: "",
  content: "",
  content_en: "",
  image_url: "",
  link_url: "",
  is_active: true,
  is_featured: false,
  sort_order: 0,
  slug: "",
  meta_title: "",
  meta_title_en: "",
  meta_description: "",
  meta_description_en: "",
  meta_keywords: "",
  meta_keywords_en: "",
  content_blocks: [] as ContentBlock[],
  content_blocks_en: [] as ContentBlock[],
  related_products: [] as string[],
  gallery_images: [] as string[],
}

export default function ManageNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyNews)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [productSearch, setProductSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const contentImageInputRef = useRef<HTMLInputElement>(null)
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null)
  const [currentLang, setCurrentLang] = useState<"bg" | "en">("bg")
  const { toast } = useToast()

  const fetchNews = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/news")
      if (!response.ok) throw new Error("Failed to fetch news")
      const data = await response.json()
      const sorted = (data || []).sort((a: NewsItem, b: NewsItem) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setNews(sorted)
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на новините.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleOpenDialog = (item?: NewsItem) => {
    if (item) {
      setEditingNews(item)
      setFormData({
        title: item.title,
        title_en: item.title_en || "",
        summary: item.summary || "",
        summary_en: item.summary_en || "",
        content: item.content || "",
        content_en: item.content_en || "",
        image_url: item.image_url || "",
        link_url: item.link_url || "",
        is_active: item.is_active,
        is_featured: item.is_featured,
        sort_order: item.sort_order,
        slug: item.slug || "",
        meta_title: item.meta_title || "",
        meta_title_en: item.meta_title_en || "",
        meta_description: item.meta_description || "",
        meta_description_en: item.meta_description_en || "",
        meta_keywords: item.meta_keywords || "",
        meta_keywords_en: item.meta_keywords_en || "",
        content_blocks: Array.isArray(item.content_blocks) ? item.content_blocks : [],
        content_blocks_en: Array.isArray(item.content_blocks_en) ? item.content_blocks_en : [],
        related_products: Array.isArray(item.related_products) ? item.related_products : [],
        gallery_images: Array.isArray(item.gallery_images) ? item.gallery_images : [],
      })
    } else {
      setEditingNews(null)
      setFormData(emptyNews)
    }
    setActiveTab("basic")
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingNews(null)
    setFormData(emptyNews)
    setProductSearch("")
    setSearchResults([])
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[а-я]/g, (char) => {
        const map: { [key: string]: string } = {
          а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
          и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
          р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
          ш: "sh", щ: "sht", ъ: "a", ь: "", ю: "yu", я: "ya",
        }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleImageUpload = async (file: File, type: "main" | "gallery" | "content") => {
    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/admin/news/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()

      if (type === "main") {
        setFormData({ ...formData, image_url: url })
      } else if (type === "gallery") {
        setFormData({ ...formData, gallery_images: [...formData.gallery_images, url] })
      } else if (type === "content" && currentBlockIndex !== null) {
        const blocks = currentLang === "bg" ? [...formData.content_blocks] : [...formData.content_blocks_en]
        blocks[currentBlockIndex] = { ...blocks[currentBlockIndex], url }
        if (currentLang === "bg") {
          setFormData({ ...formData, content_blocks: blocks })
        } else {
          setFormData({ ...formData, content_blocks_en: blocks })
        }
      }

      toast({ title: "Успех", description: "Изображението е качено." })
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно качване на изображението.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSearchProducts = async () => {
    if (!productSearch.trim()) return
    setIsSearching(true)
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(productSearch)}&limit=10`)
      if (!response.ok) throw new Error("Search failed")
      const data = await response.json()
      setSearchResults(data.products || [])
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно търсене на продукти.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const addProduct = (productId: string) => {
    if (!formData.related_products.includes(productId)) {
      setFormData({ ...formData, related_products: [...formData.related_products, productId] })
    }
  }

  const removeProduct = (productId: string) => {
    setFormData({
      ...formData,
      related_products: formData.related_products.filter((id) => id !== productId),
    })
  }

  const addContentBlock = (type: ContentBlock["type"], lang: "bg" | "en") => {
    const newBlock: ContentBlock = type === "heading" 
      ? { type, content: "", level: 2 }
      : type === "image"
      ? { type, url: "", alt: "" }
      : { type, content: "" }

    if (lang === "bg") {
      setFormData({ ...formData, content_blocks: [...formData.content_blocks, newBlock] })
    } else {
      setFormData({ ...formData, content_blocks_en: [...formData.content_blocks_en, newBlock] })
    }
  }

  const updateContentBlock = (index: number, updates: Partial<ContentBlock>, lang: "bg" | "en") => {
    const blocks = lang === "bg" ? [...formData.content_blocks] : [...formData.content_blocks_en]
    blocks[index] = { ...blocks[index], ...updates }
    if (lang === "bg") {
      setFormData({ ...formData, content_blocks: blocks })
    } else {
      setFormData({ ...formData, content_blocks_en: blocks })
    }
  }

  const removeContentBlock = (index: number, lang: "bg" | "en") => {
    if (lang === "bg") {
      setFormData({ ...formData, content_blocks: formData.content_blocks.filter((_, i) => i !== index) })
    } else {
      setFormData({ ...formData, content_blocks_en: formData.content_blocks_en.filter((_, i) => i !== index) })
    }
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Грешка",
        description: "Заглавието е задължително.",
        variant: "destructive",
      })
      return
    }

    // Auto-generate slug if empty
    const dataToSubmit = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
    }

    startTransition(async () => {
      try {
        const url = editingNews ? `/api/admin/news/${editingNews.id}` : "/api/admin/news"
        const method = editingNews ? "PUT" : "POST"

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSubmit),
        })

        if (!response.ok) throw new Error("Failed to save news")

        toast({
          title: "Успех",
          description: editingNews ? "Новината е обновена." : "Новината е добавена.",
        })
        handleCloseDialog()
        fetchNews()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешно записване на новината.",
          variant: "destructive",
        })
      }
    })
  }

  const handleToggleActive = (id: number, currentActive: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/news/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !currentActive }),
        })
        if (!response.ok) throw new Error("Failed to toggle active")
        toast({
          title: "Успех",
          description: !currentActive ? "Новината е активирана." : "Новината е деактивирана.",
        })
        fetchNews()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешна промяна на статуса.",
          variant: "destructive",
        })
      }
    })
  }

  const handleToggleFeatured = (id: number, currentFeatured: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/news/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_featured: !currentFeatured }),
        })
        if (!response.ok) throw new Error("Failed to toggle featured")
        toast({
          title: "Успех",
          description: !currentFeatured ? "Новината е отбелязана като важна." : "Новината вече не е важна.",
        })
        fetchNews()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешна промяна на статуса.",
          variant: "destructive",
        })
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази новина?")) return
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/news/${id}`, { method: "DELETE" })
        if (!response.ok) throw new Error("Failed to delete news")
        toast({ title: "Успех", description: "Новината е изтрита." })
        fetchNews()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешно изтриване на новината.",
          variant: "destructive",
        })
      }
    })
  }

  const handleMoveSortOrder = (id: number, direction: "up" | "down") => {
    const currentIndex = news.findIndex((item) => item.id === id)
    if (currentIndex === -1) return
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === news.length - 1) return

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const currentItem = news[currentIndex]
    const swapItem = news[swapIndex]

    const currentOrder = currentItem.sort_order ?? currentIndex
    const swapOrder = swapItem.sort_order ?? swapIndex

    startTransition(async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/admin/news/${currentItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: swapOrder }),
          }),
          fetch(`/api/admin/news/${swapItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: currentOrder }),
          }),
        ])
        if (!res1.ok || !res2.ok) throw new Error("Failed to update sort order")
        toast({ title: "Успех", description: "Редът е обновен." })
        fetchNews()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешна промяна на реда.",
          variant: "destructive",
        })
      }
    })
  }

  const activeCount = news.filter((item) => item.is_active).length
  const featuredCount = news.filter((item) => item.is_featured).length

  const renderContentBlockEditor = (blocks: ContentBlock[], lang: "bg" | "en") => (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-3">
              {block.type === "heading" && (
                <>
                  <div className="flex gap-2">
                    <Select
                      value={String(block.level || 2)}
                      onValueChange={(v) => updateContentBlock(index, { level: parseInt(v) }, lang)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">H2</SelectItem>
                        <SelectItem value="3">H3</SelectItem>
                        <SelectItem value="4">H4</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={block.content || ""}
                      onChange={(e) => updateContentBlock(index, { content: e.target.value }, lang)}
                      placeholder={lang === "bg" ? "Заглавие..." : "Heading..."}
                      className="flex-1"
                    />
                  </div>
                </>
              )}
              {block.type === "text" && (
                <Textarea
                  value={block.content || ""}
                  onChange={(e) => updateContentBlock(index, { content: e.target.value }, lang)}
                  placeholder={lang === "bg" ? "Текст..." : "Text..."}
                  rows={4}
                />
              )}
              {block.type === "image" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={block.url || ""}
                      onChange={(e) => updateContentBlock(index, { url: e.target.value }, lang)}
                      placeholder="URL на изображение"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCurrentBlockIndex(index)
                        setCurrentLang(lang)
                        contentImageInputRef.current?.click()
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input
                    value={block.alt || ""}
                    onChange={(e) => updateContentBlock(index, { alt: e.target.value }, lang)}
                    placeholder={lang === "bg" ? "Описание на изображението" : "Image description"}
                  />
                  {block.url && (
                    <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden bg-neutral-100">
                      <Image src={block.url} alt={block.alt || ""} fill className="object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeContentBlock(index, lang)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock("heading", lang)}>
          <Type className="h-4 w-4 mr-1" /> Заглавие
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock("text", lang)}>
          <FileText className="h-4 w-4 mr-1" /> Текст
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock("image", lang)}>
          <ImageIcon className="h-4 w-4 mr-1" /> Изображение
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "main")}
      />
      <input
        type="file"
        ref={galleryInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "gallery")}
      />
      <input
        type="file"
        ref={contentImageInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "content")}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление на новини</CardTitle>
              <CardDescription>
                Добавете и управлявайте новини с изображения, SEO и свързани продукти.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добави новина
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingNews ? "Редактиране на новина" : "Добавяне на новина"}</DialogTitle>
                  <DialogDescription>
                    {editingNews ? "Редактирайте информацията за новината." : "Попълнете информацията за новата новина."}
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Основни</TabsTrigger>
                    <TabsTrigger value="content">Съдържание</TabsTrigger>
                    <TabsTrigger value="gallery">Галерия</TabsTrigger>
                    <TabsTrigger value="products">Продукти</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>

                  {/* Basic Tab */}
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Заглавие (BG) *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Въведете заглавие"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title_en">Заглавие (EN)</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                          placeholder="Enter title"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">URL slug</Label>
                      <div className="flex gap-2">
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="auto-generated-from-title"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title) })}
                        >
                          Генерирай
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        URL: /news/{formData.slug || "auto-generated"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="summary">Резюме (BG)</Label>
                        <Textarea
                          id="summary"
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          placeholder="Кратко описание на новината"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="summary_en">Резюме (EN)</Label>
                        <Textarea
                          id="summary_en"
                          value={formData.summary_en}
                          onChange={(e) => setFormData({ ...formData, summary_en: e.target.value })}
                          placeholder="Short description"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Основно изображение</Label>
                      <div className="flex gap-2 items-start">
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          <span className="ml-2">Качи</span>
                        </Button>
                      </div>
                      {formData.image_url && (
                        <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-neutral-100 mt-2">
                          <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setFormData({ ...formData, image_url: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>Активна</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_featured}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                        />
                        <Label>Важна</Label>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-6 mt-4">
                    <Tabs defaultValue="bg" className="w-full">
                      <TabsList>
                        <TabsTrigger value="bg">Български</TabsTrigger>
                        <TabsTrigger value="en">English</TabsTrigger>
                      </TabsList>
                      <TabsContent value="bg" className="mt-4">
                        <Label className="mb-2 block">Блокове съдържание (BG)</Label>
                        {renderContentBlockEditor(formData.content_blocks, "bg")}
                      </TabsContent>
                      <TabsContent value="en" className="mt-4">
                        <Label className="mb-2 block">Content Blocks (EN)</Label>
                        {renderContentBlockEditor(formData.content_blocks_en, "en")}
                      </TabsContent>
                    </Tabs>
                  </TabsContent>

                  {/* Gallery Tab */}
                  <TabsContent value="gallery" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <Label>Галерия със снимки</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="ml-2">Добави снимка</span>
                      </Button>
                    </div>
                    {formData.gallery_images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {formData.gallery_images.map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                            <Image src={url} alt={`Gallery ${index + 1}`} fill className="object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  gallery_images: formData.gallery_images.filter((_, i) => i !== index),
                                })
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Няма добавени снимки в галерията.
                      </p>
                    )}
                  </TabsContent>

                  {/* Products Tab */}
                  <TabsContent value="products" className="space-y-4 mt-4">
                    <div className="flex gap-2">
                      <Input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Търсене на продукт по име или ID..."
                        onKeyDown={(e) => e.key === "Enter" && handleSearchProducts()}
                      />
                      <Button type="button" onClick={handleSearchProducts} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((product) => (
                          <div
                            key={product.objectid}
                            className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer"
                            onClick={() => addProduct(product.objectid)}
                          >
                            {product.photourl && (
                              <div className="relative w-10 h-10 rounded bg-neutral-100 overflow-hidden">
                                <Image src={product.photourl} alt={product.title} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.title}</p>
                              <p className="text-xs text-muted-foreground">{product.objectid}</p>
                            </div>
                            <Plus className="h-4 w-4 text-green-600" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Избрани продукти ({formData.related_products.length})</Label>
                      {formData.related_products.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.related_products.map((id) => (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {id}
                              <button type="button" onClick={() => removeProduct(id)} className="ml-1 hover:text-red-500">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Няма избрани продукти.</p>
                      )}
                    </div>
                  </TabsContent>

                  {/* SEO Tab */}
                  <TabsContent value="seo" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_title">Meta Title (BG)</Label>
                        <Input
                          id="meta_title"
                          value={formData.meta_title}
                          onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                          placeholder="SEO заглавие"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meta_title_en">Meta Title (EN)</Label>
                        <Input
                          id="meta_title_en"
                          value={formData.meta_title_en}
                          onChange={(e) => setFormData({ ...formData, meta_title_en: e.target.value })}
                          placeholder="SEO title"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Description (BG)</Label>
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description}
                          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                          placeholder="SEO описание"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meta_description_en">Meta Description (EN)</Label>
                        <Textarea
                          id="meta_description_en"
                          value={formData.meta_description_en}
                          onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                          placeholder="SEO description"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_keywords">Meta Keywords (BG)</Label>
                        <Input
                          id="meta_keywords"
                          value={formData.meta_keywords}
                          onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                          placeholder="ключова дума, друга ключова дума"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meta_keywords_en">Meta Keywords (EN)</Label>
                        <Input
                          id="meta_keywords_en"
                          value={formData.meta_keywords_en}
                          onChange={(e) => setFormData({ ...formData, meta_keywords_en: e.target.value })}
                          placeholder="keyword, another keyword"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Отказ
                  </Button>
                  <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingNews ? "Запази" : "Добави"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активни новини</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Важни новини</p>
              <p className="text-2xl font-bold">{featuredCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Общо новини</p>
              <p className="text-2xl font-bold">{news.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News List */}
      <Card>
        <CardHeader>
          <CardTitle>Всички новини</CardTitle>
          <CardDescription>
            Управлявайте новините - включете/изключете, подредете и редактирайте.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : news.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Няма добавени новини. Добавете нова новина по-горе.
            </p>
          ) : (
            <div className="space-y-4">
              {news.map((item, index) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden transition-all ${
                    item.is_active
                      ? item.is_featured
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-green-300 bg-green-50/30"
                      : "border-gray-200 opacity-75"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image Preview */}
                    <div className="relative w-full md:w-48 lg:w-56 aspect-video md:aspect-square flex-shrink-0 bg-gray-100">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.is_active && <Badge className="bg-green-600 text-white">Активна</Badge>}
                        {item.is_featured && <Badge className="bg-amber-500 text-white">Важна</Badge>}
                        {!item.is_active && <Badge variant="secondary">Неактивна</Badge>}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex-1 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                          {item.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.summary}</p>
                          )}
                          {item.slug && (
                            <a
                              href={`/news/${item.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              /news/{item.slug}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.is_active}
                              onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                              disabled={isPending}
                            />
                            <Label className="text-sm">Активна</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.is_featured}
                              onCheckedChange={() => handleToggleFeatured(item.id, item.is_featured)}
                              disabled={isPending}
                            />
                            <Label className="text-sm">Важна</Label>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mr-1">Ред:</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSortOrder(item.id, "up")}
                            disabled={index === 0 || isPending}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSortOrder(item.id, "down")}
                            disabled={index === news.length - 1 || isPending}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 ml-2"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
