"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, RefreshCw, Search, Share2, Globe, Code, Palette } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface SeoSettings {
  id?: number
  page_key: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  og_title?: string
  og_description?: string
  og_image?: string
  og_image_width?: number
  og_image_height?: number
  og_type?: string
  og_site_name?: string
  og_locale?: string
  og_url?: string
  twitter_card?: string
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  twitter_site?: string
  twitter_creator?: string
  canonical_url?: string
  robots?: string
  author?: string
  schema_type?: string
  schema_name?: string
  schema_description?: string
  schema_logo?: string
  schema_same_as?: string[]
  schema_address_locality?: string
  schema_address_region?: string
  schema_address_country?: string
  schema_postal_code?: string
  schema_street_address?: string
  schema_telephone?: string
  schema_email?: string
  hreflang_en?: string
  hreflang_bg?: string
  google_site_verification?: string
  bing_site_verification?: string
  yandex_verification?: string
  theme_color?: string
  background_color?: string
  ga_tracking_id?: string
  gtm_id?: string
  fb_pixel_id?: string
}

export default function SeoSettingsPage() {
  const [settings, setSettings] = useState<SeoSettings>({
    page_key: "homepage",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    og_type: "website",
    og_site_name: "",
    og_locale: "bg_BG",
    twitter_card: "summary_large_image",
    twitter_title: "",
    twitter_description: "",
    robots: "index, follow",
    author: "",
    schema_type: "Organization",
    schema_name: "",
    schema_description: "",
    theme_color: "#f59e0b",
    background_color: "#ffffff",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/seo-settings?pageKey=homepage")
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на SEO настройките.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/seo-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        })
        if (!response.ok) throw new Error("Failed to update settings")
        toast({ title: "Успех", description: "SEO настройките са запазени успешно." })
        fetchSettings()
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Неуспешно запазване на SEO настройките.",
          variant: "destructive",
        })
      }
    })
  }

  const updateField = (field: keyof SeoSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const CharacterCount = ({ current, max, label }: { current: number; max: number; label: string }) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{label}:</span>
      <Badge variant={current > max ? "destructive" : current > max * 0.9 ? "secondary" : "outline"}>
        {current}/{max}
      </Badge>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Настройки - Начална страница</h1>
          <p className="text-muted-foreground">
            Управлявайте SEO метаданните за вашата начална страница
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Презареди
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Запази всички
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Основни
          </TabsTrigger>
          <TabsTrigger value="opengraph" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Open Graph
          </TabsTrigger>
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Twitter
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Schema.org
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Разширени
          </TabsTrigger>
        </TabsList>

        {/* Basic SEO Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Основни SEO настройки</CardTitle>
              <CardDescription>
                Тези мета тагове са най-важни за търсачките като Google
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta_title">Мета заглавие (Title)</Label>
                  <CharacterCount current={settings.meta_title?.length || 0} max={70} label="символа" />
                </div>
                <Input
                  id="meta_title"
                  value={settings.meta_title || ""}
                  onChange={(e) => updateField("meta_title", e.target.value)}
                  placeholder="Заглавие на страницата за търсачките..."
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Препоръчително: 50-70 символа. Това е заглавието, което се показва в резултатите от търсенето.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta_description">Мета описание (Description)</Label>
                  <CharacterCount current={settings.meta_description?.length || 0} max={160} label="символа" />
                </div>
                <Textarea
                  id="meta_description"
                  value={settings.meta_description || ""}
                  onChange={(e) => updateField("meta_description", e.target.value)}
                  placeholder="Кратко описание на страницата..."
                  rows={3}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Препоръчително: 120-160 символа. Това описание се показва под заглавието в резултатите от търсенето.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_keywords">Ключови думи (Keywords)</Label>
                <Input
                  id="meta_keywords"
                  value={settings.meta_keywords || ""}
                  onChange={(e) => updateField("meta_keywords", e.target.value)}
                  placeholder="риболов, захранки, въдици, макари..."
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Разделете ключовите думи със запетая. Полезно за вътрешно търсене и категоризация.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="robots">Robots директива</Label>
                  <Input
                    id="robots"
                    value={settings.robots || ""}
                    onChange={(e) => updateField("robots", e.target.value)}
                    placeholder="index, follow"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Указва на търсачките как да индексират страницата.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Автор</Label>
                  <Input
                    id="author"
                    value={settings.author || ""}
                    onChange={(e) => updateField("author", e.target.value)}
                    placeholder="Мадикс Граундбейтс"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonical_url">Каноничен URL</Label>
                <Input
                  id="canonical_url"
                  value={settings.canonical_url || ""}
                  onChange={(e) => updateField("canonical_url", e.target.value)}
                  placeholder="https://example.com/"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Основният URL на страницата за избягване на дублирано съдържание.
                </p>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/20 space-y-2">
                <Label className="text-sm font-semibold">Визуализация в Google:</Label>
                <div className="bg-white rounded border p-4 space-y-1">
                  <p className="text-blue-600 text-lg hover:underline cursor-pointer line-clamp-1">
                    {settings.meta_title || "Заглавие на страницата"}
                  </p>
                  <p className="text-green-700 text-sm">
                    {settings.canonical_url || "https://example.com/"}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {settings.meta_description || "Описание на страницата..."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Graph Tab */}
        <TabsContent value="opengraph">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph настройки</CardTitle>
              <CardDescription>
                Контролирайте как изглежда вашият сайт при споделяне във Facebook, LinkedIn и други социални мрежи
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="og_title">OG Заглавие</Label>
                  <CharacterCount current={settings.og_title?.length || 0} max={95} label="символа" />
                </div>
                <Input
                  id="og_title"
                  value={settings.og_title || ""}
                  onChange={(e) => updateField("og_title", e.target.value)}
                  placeholder="Заглавие за социални мрежи..."
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="og_description">OG Описание</Label>
                  <CharacterCount current={settings.og_description?.length || 0} max={200} label="символа" />
                </div>
                <Textarea
                  id="og_description"
                  value={settings.og_description || ""}
                  onChange={(e) => updateField("og_description", e.target.value)}
                  placeholder="Описание за социални мрежи..."
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image">OG Изображение (URL)</Label>
                <Input
                  id="og_image"
                  value={settings.og_image || ""}
                  onChange={(e) => updateField("og_image", e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Препоръчителен размер: 1200x630 пиксела. Това изображение се показва при споделяне.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="og_image_width">Ширина на изображението</Label>
                  <Input
                    id="og_image_width"
                    type="number"
                    value={settings.og_image_width || 1200}
                    onChange={(e) => updateField("og_image_width", parseInt(e.target.value))}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_image_height">Височина на изображението</Label>
                  <Input
                    id="og_image_height"
                    type="number"
                    value={settings.og_image_height || 630}
                    onChange={(e) => updateField("og_image_height", parseInt(e.target.value))}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="og_site_name">Име на сайта</Label>
                  <Input
                    id="og_site_name"
                    value={settings.og_site_name || ""}
                    onChange={(e) => updateField("og_site_name", e.target.value)}
                    placeholder="Мадикс Граундбейтс"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_type">Тип</Label>
                  <Input
                    id="og_type"
                    value={settings.og_type || "website"}
                    onChange={(e) => updateField("og_type", e.target.value)}
                    placeholder="website"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="og_locale">Локал</Label>
                  <Input
                    id="og_locale"
                    value={settings.og_locale || "bg_BG"}
                    onChange={(e) => updateField("og_locale", e.target.value)}
                    placeholder="bg_BG"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_url">URL</Label>
                  <Input
                    id="og_url"
                    value={settings.og_url || ""}
                    onChange={(e) => updateField("og_url", e.target.value)}
                    placeholder="https://example.com/"
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Twitter Tab */}
        <TabsContent value="twitter">
          <Card>
            <CardHeader>
              <CardTitle>Twitter Card настройки</CardTitle>
              <CardDescription>
                Контролирайте как изглежда вашият сайт при споделяне в Twitter/X
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="twitter_card">Тип карта</Label>
                <Input
                  id="twitter_card"
                  value={settings.twitter_card || "summary_large_image"}
                  onChange={(e) => updateField("twitter_card", e.target.value)}
                  placeholder="summary_large_image"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Опции: summary, summary_large_image, app, player
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twitter_title">Заглавие</Label>
                  <CharacterCount current={settings.twitter_title?.length || 0} max={70} label="символа" />
                </div>
                <Input
                  id="twitter_title"
                  value={settings.twitter_title || ""}
                  onChange={(e) => updateField("twitter_title", e.target.value)}
                  placeholder="Заглавие за Twitter..."
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twitter_description">Описание</Label>
                  <CharacterCount current={settings.twitter_description?.length || 0} max={200} label="символа" />
                </div>
                <Textarea
                  id="twitter_description"
                  value={settings.twitter_description || ""}
                  onChange={(e) => updateField("twitter_description", e.target.value)}
                  placeholder="Описание за Twitter..."
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_image">Изображение (URL)</Label>
                <Input
                  id="twitter_image"
                  value={settings.twitter_image || ""}
                  onChange={(e) => updateField("twitter_image", e.target.value)}
                  placeholder="https://example.com/twitter-image.jpg"
                  disabled={isPending}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twitter_site">Twitter акаунт на сайта</Label>
                  <Input
                    id="twitter_site"
                    value={settings.twitter_site || ""}
                    onChange={(e) => updateField("twitter_site", e.target.value)}
                    placeholder="@username"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_creator">Twitter акаунт на автора</Label>
                  <Input
                    id="twitter_creator"
                    value={settings.twitter_creator || ""}
                    onChange={(e) => updateField("twitter_creator", e.target.value)}
                    placeholder="@username"
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema.org Tab */}
        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Schema.org / Структурирани данни</CardTitle>
              <CardDescription>
                Помагат на Google да разбере по-добре вашия бизнес и показва богати резултати в търсенето
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schema_type">Тип схема</Label>
                  <Input
                    id="schema_type"
                    value={settings.schema_type || "Organization"}
                    onChange={(e) => updateField("schema_type", e.target.value)}
                    placeholder="Organization"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Примери: Organization, LocalBusiness, Store
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schema_name">Име на организацията</Label>
                  <Input
                    id="schema_name"
                    value={settings.schema_name || ""}
                    onChange={(e) => updateField("schema_name", e.target.value)}
                    placeholder="Мадикс Граундбейтс"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema_description">Описание</Label>
                <Textarea
                  id="schema_description"
                  value={settings.schema_description || ""}
                  onChange={(e) => updateField("schema_description", e.target.value)}
                  placeholder="Описание на вашата организация..."
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema_logo">Лого (URL)</Label>
                <Input
                  id="schema_logo"
                  value={settings.schema_logo || ""}
                  onChange={(e) => updateField("schema_logo", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={isPending}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Адрес</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schema_street_address">Улица и номер</Label>
                    <Input
                      id="schema_street_address"
                      value={settings.schema_street_address || ""}
                      onChange={(e) => updateField("schema_street_address", e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema_address_locality">Град</Label>
                    <Input
                      id="schema_address_locality"
                      value={settings.schema_address_locality || ""}
                      onChange={(e) => updateField("schema_address_locality", e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema_address_region">Област/Регион</Label>
                    <Input
                      id="schema_address_region"
                      value={settings.schema_address_region || ""}
                      onChange={(e) => updateField("schema_address_region", e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema_postal_code">Пощенски код</Label>
                    <Input
                      id="schema_postal_code"
                      value={settings.schema_postal_code || ""}
                      onChange={(e) => updateField("schema_postal_code", e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema_address_country">Държава</Label>
                    <Input
                      id="schema_address_country"
                      value={settings.schema_address_country || "Bulgaria"}
                      onChange={(e) => updateField("schema_address_country", e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Контакти</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schema_telephone">Телефон</Label>
                    <Input
                      id="schema_telephone"
                      value={settings.schema_telephone || ""}
                      onChange={(e) => updateField("schema_telephone", e.target.value)}
                      placeholder="+359 888 123 456"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema_email">Имейл</Label>
                    <Input
                      id="schema_email"
                      value={settings.schema_email || ""}
                      onChange={(e) => updateField("schema_email", e.target.value)}
                      placeholder="info@example.com"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Разширени настройки</CardTitle>
              <CardDescription>
                Верификация на сайта, hreflang тагове и PWA настройки
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-4">Верификация на сайта</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="google_site_verification">Google Site Verification</Label>
                    <Input
                      id="google_site_verification"
                      value={settings.google_site_verification || ""}
                      onChange={(e) => updateField("google_site_verification", e.target.value)}
                      placeholder="код за верификация"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bing_site_verification">Bing Site Verification</Label>
                    <Input
                      id="bing_site_verification"
                      value={settings.bing_site_verification || ""}
                      onChange={(e) => updateField("bing_site_verification", e.target.value)}
                      placeholder="код за верификация"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yandex_verification">Yandex Verification</Label>
                    <Input
                      id="yandex_verification"
                      value={settings.yandex_verification || ""}
                      onChange={(e) => updateField("yandex_verification", e.target.value)}
                      placeholder="код за верификация"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h4 className="font-semibold mb-4">Езикови алтернативи (hreflang)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hreflang_bg">Български URL</Label>
                    <Input
                      id="hreflang_bg"
                      value={settings.hreflang_bg || ""}
                      onChange={(e) => updateField("hreflang_bg", e.target.value)}
                      placeholder="https://example.com/"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hreflang_en">English URL</Label>
                    <Input
                      id="hreflang_en"
                      value={settings.hreflang_en || ""}
                      onChange={(e) => updateField("hreflang_en", e.target.value)}
                      placeholder="https://example.com/en/"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h4 className="font-semibold mb-4">PWA / Тема</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme_color">Цвят на темата</Label>
                    <div className="flex gap-2">
                      <Input
                        id="theme_color"
                        value={settings.theme_color || "#f59e0b"}
                        onChange={(e) => updateField("theme_color", e.target.value)}
                        disabled={isPending}
                      />
                      <input
                        type="color"
                        value={settings.theme_color || "#f59e0b"}
                        onChange={(e) => updateField("theme_color", e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="background_color">Фонов цвят</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background_color"
                        value={settings.background_color || "#ffffff"}
                        onChange={(e) => updateField("background_color", e.target.value)}
                        disabled={isPending}
                      />
                      <input
                        type="color"
                        value={settings.background_color || "#ffffff"}
                        onChange={(e) => updateField("background_color", e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Аналитика и проследяване</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ga_tracking_id">Google Analytics ID</Label>
                    <Input
                      id="ga_tracking_id"
                      value={settings.ga_tracking_id || ""}
                      onChange={(e) => updateField("ga_tracking_id", e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gtm_id">Google Tag Manager ID</Label>
                    <Input
                      id="gtm_id"
                      value={settings.gtm_id || ""}
                      onChange={(e) => updateField("gtm_id", e.target.value)}
                      placeholder="GTM-XXXXXXX"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb_pixel_id">Facebook Pixel ID</Label>
                    <Input
                      id="fb_pixel_id"
                      value={settings.fb_pixel_id || ""}
                      onChange={(e) => updateField("fb_pixel_id", e.target.value)}
                      placeholder="1234567890"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Запази всички настройки
        </Button>
      </div>
    </div>
  )
}
