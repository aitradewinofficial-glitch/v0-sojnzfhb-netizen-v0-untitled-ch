"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Search, Globe, Share2, Twitter, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SeoFieldsProps {
  formData: Record<string, any>
  onChange: (name: string, value: string | null) => void
  prefix?: string
  showAdvanced?: boolean
}

export function SeoFields({ formData, onChange, prefix = "", showAdvanced = true }: SeoFieldsProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const getFieldName = (field: string) => (prefix ? `${prefix}_${field}` : field)
  const getValue = (field: string) => formData[getFieldName(field)] || ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onChange(name, value || null)
  }

  const handleSelectChange = (name: string, value: string) => {
    onChange(name, value === "null" ? null : value)
  }

  const getCharCount = (field: string, max: number) => {
    const value = getValue(field)
    const count = value.length
    const isOver = count > max
    return (
      <span className={`text-xs ${isOver ? "text-red-500" : "text-gray-500"}`}>
        {count}/{max} символа
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-800">SEO Настройки</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="basic" className="flex items-center gap-1 text-xs">
            <Search className="h-3 w-3" />
            Основни
          </TabsTrigger>
          <TabsTrigger value="og" className="flex items-center gap-1 text-xs">
            <Share2 className="h-3 w-3" />
            Open Graph
          </TabsTrigger>
          <TabsTrigger value="twitter" className="flex items-center gap-1 text-xs">
            <Twitter className="h-3 w-3" />
            Twitter
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            Schema.org
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1 text-xs">
            <Globe className="h-3 w-3" />
            Разширени
          </TabsTrigger>
        </TabsList>

        {/* Basic Meta Tags Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_meta_title")} className="text-sm font-medium">
                Meta Title (EN)
              </Label>
              <Input
                id={getFieldName("seo_meta_title")}
                name={getFieldName("seo_meta_title")}
                value={getValue("seo_meta_title")}
                onChange={handleChange}
                placeholder="Заглавие за търсачки"
                className="bg-white border-gray-300"
              />
              {getCharCount("seo_meta_title", 60)}
            </div>
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_meta_title_bg")} className="text-sm font-medium">
                Meta Title (BG)
              </Label>
              <Input
                id={getFieldName("seo_meta_title_bg")}
                name={getFieldName("seo_meta_title_bg")}
                value={getValue("seo_meta_title_bg")}
                onChange={handleChange}
                placeholder="Заглавие за търсачки (BG)"
                className="bg-white border-gray-300"
              />
              {getCharCount("seo_meta_title_bg", 60)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_meta_description")} className="text-sm font-medium">
                Meta Description (EN)
              </Label>
              <Textarea
                id={getFieldName("seo_meta_description")}
                name={getFieldName("seo_meta_description")}
                value={getValue("seo_meta_description")}
                onChange={handleChange}
                placeholder="Описание за търсачки"
                className="bg-white border-gray-300 min-h-[80px]"
                rows={3}
              />
              {getCharCount("seo_meta_description", 160)}
            </div>
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_meta_description_bg")} className="text-sm font-medium">
                Meta Description (BG)
              </Label>
              <Textarea
                id={getFieldName("seo_meta_description_bg")}
                name={getFieldName("seo_meta_description_bg")}
                value={getValue("seo_meta_description_bg")}
                onChange={handleChange}
                placeholder="Описание за търсачки (BG)"
                className="bg-white border-gray-300 min-h-[80px]"
                rows={3}
              />
              {getCharCount("seo_meta_description_bg", 160)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_meta_keywords")} className="text-sm font-medium">
                Meta Keywords (EN)
              </Label>
              <Input
                id={getFieldName("seo_meta_keywords")}
                name={getFieldName("seo_meta_keywords")}
                value={getValue("seo_meta_keywords")}
                onChange={handleChange}
                placeholder="ключова дума 1, ключова дума 2"
                className="bg-white border-gray-300"
              />
              <span className="text-xs text-gray-500">Разделени със запетая</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_meta_keywords_bg")} className="text-sm font-medium">
                Meta Keywords (BG)
              </Label>
              <Input
                id={getFieldName("seo_meta_keywords_bg")}
                name={getFieldName("seo_meta_keywords_bg")}
                value={getValue("seo_meta_keywords_bg")}
                onChange={handleChange}
                placeholder="ключова дума 1, ключова дума 2"
                className="bg-white border-gray-300"
              />
              <span className="text-xs text-gray-500">Разделени със запетая</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_focus_keyword")} className="text-sm font-medium">
                Focus Keyword
              </Label>
              <Input
                id={getFieldName("seo_focus_keyword")}
                name={getFieldName("seo_focus_keyword")}
                value={getValue("seo_focus_keyword")}
                onChange={handleChange}
                placeholder="Основна ключова дума"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_secondary_keywords")} className="text-sm font-medium">
                Secondary Keywords
              </Label>
              <Input
                id={getFieldName("seo_secondary_keywords")}
                name={getFieldName("seo_secondary_keywords")}
                value={getValue("seo_secondary_keywords")}
                onChange={handleChange}
                placeholder="Вторични ключови думи"
                className="bg-white border-gray-300"
              />
            </div>
          </div>
        </TabsContent>

        {/* Open Graph Tab */}
        <TabsContent value="og" className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Open Graph тагове се използват при споделяне във Facebook, LinkedIn и други социални мрежи.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_og_title")} className="text-sm font-medium">
                OG Title (EN)
              </Label>
              <Input
                id={getFieldName("seo_og_title")}
                name={getFieldName("seo_og_title")}
                value={getValue("seo_og_title")}
                onChange={handleChange}
                placeholder="Заглавие за социални мрежи"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_og_title_bg")} className="text-sm font-medium">
                OG Title (BG)
              </Label>
              <Input
                id={getFieldName("seo_og_title_bg")}
                name={getFieldName("seo_og_title_bg")}
                value={getValue("seo_og_title_bg")}
                onChange={handleChange}
                placeholder="Заглавие за социални мрежи (BG)"
                className="bg-white border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_og_description")} className="text-sm font-medium">
                OG Description (EN)
              </Label>
              <Textarea
                id={getFieldName("seo_og_description")}
                name={getFieldName("seo_og_description")}
                value={getValue("seo_og_description")}
                onChange={handleChange}
                placeholder="Описание за социални мрежи"
                className="bg-white border-gray-300 min-h-[80px]"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getFieldName("seo_og_description_bg")} className="text-sm font-medium">
                OG Description (BG)
              </Label>
              <Textarea
                id={getFieldName("seo_og_description_bg")}
                name={getFieldName("seo_og_description_bg")}
                value={getValue("seo_og_description_bg")}
                onChange={handleChange}
                placeholder="Описание за социални мрежи (BG)"
                className="bg-white border-gray-300 min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_og_image")} className="text-sm font-medium">
              OG Image URL
            </Label>
            <Input
              id={getFieldName("seo_og_image")}
              name={getFieldName("seo_og_image")}
              value={getValue("seo_og_image")}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="bg-white border-gray-300"
            />
            <span className="text-xs text-gray-500">Препоръчителен размер: 1200x630px</span>
          </div>
        </TabsContent>

        {/* Twitter Tab */}
        <TabsContent value="twitter" className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Twitter Card тагове контролират как се показва съдържанието при споделяне в Twitter/X.
          </p>
          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_twitter_card")} className="text-sm font-medium">
              Twitter Card Type
            </Label>
            <Select
              value={getValue("seo_twitter_card") || "summary_large_image"}
              onValueChange={(val) => handleSelectChange(getFieldName("seo_twitter_card"), val)}
            >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Избери тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_twitter_title")} className="text-sm font-medium">
              Twitter Title
            </Label>
            <Input
              id={getFieldName("seo_twitter_title")}
              name={getFieldName("seo_twitter_title")}
              value={getValue("seo_twitter_title")}
              onChange={handleChange}
              placeholder="Заглавие за Twitter"
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_twitter_description")} className="text-sm font-medium">
              Twitter Description
            </Label>
            <Textarea
              id={getFieldName("seo_twitter_description")}
              name={getFieldName("seo_twitter_description")}
              value={getValue("seo_twitter_description")}
              onChange={handleChange}
              placeholder="Описание за Twitter"
              className="bg-white border-gray-300 min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_twitter_image")} className="text-sm font-medium">
              Twitter Image URL
            </Label>
            <Input
              id={getFieldName("seo_twitter_image")}
              name={getFieldName("seo_twitter_image")}
              value={getValue("seo_twitter_image")}
              onChange={handleChange}
              placeholder="https://example.com/twitter-image.jpg"
              className="bg-white border-gray-300"
            />
          </div>
        </TabsContent>

        {/* Schema.org Tab */}
        <TabsContent value="schema" className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Schema.org структурирани данни помагат на търсачките да разберат по-добре съдържанието.
          </p>
          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_schema_type")} className="text-sm font-medium">
              Schema Type
            </Label>
            <Select
              value={getValue("seo_schema_type") || "CollectionPage"}
              onValueChange={(val) => handleSelectChange(getFieldName("seo_schema_type"), val)}
            >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Избери тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CollectionPage">CollectionPage</SelectItem>
                <SelectItem value="ItemList">ItemList</SelectItem>
                <SelectItem value="WebPage">WebPage</SelectItem>
                <SelectItem value="Category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_canonical_url")} className="text-sm font-medium">
              Canonical URL
            </Label>
            <Input
              id={getFieldName("seo_canonical_url")}
              name={getFieldName("seo_canonical_url")}
              value={getValue("seo_canonical_url")}
              onChange={handleChange}
              placeholder="https://example.com/category/name"
              className="bg-white border-gray-300"
            />
            <span className="text-xs text-gray-500">Оставете празно за автоматично генериране</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor={getFieldName("seo_robots")} className="text-sm font-medium">
              Robots Directive
            </Label>
            <Select
              value={getValue("seo_robots") || "index, follow"}
              onValueChange={(val) => handleSelectChange(getFieldName("seo_robots"), val)}
            >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Избери директива" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index, Follow (по подразбиране)</SelectItem>
                <SelectItem value="noindex, follow">Noindex, Follow</SelectItem>
                <SelectItem value="index, nofollow">Index, Nofollow</SelectItem>
                <SelectItem value="noindex, nofollow">Noindex, Nofollow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
