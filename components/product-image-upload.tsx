"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

interface ProductImageUploadProps {
  productId: string
  currentImageUrl?: string
  onImageUploaded?: (imageUrl: string) => void
}

export function ProductImageUpload({ productId, currentImageUrl, onImageUploaded }: ProductImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(currentImageUrl || null)
  const { toast } = useToast()

  // Sync with prop changes (e.g., when a different product is selected)
  useEffect(() => {
    setUploadedImageUrl(currentImageUrl || null)
    setSelectedFile(null)
    setPreviewUrl(null)
  }, [currentImageUrl, productId])

  // Функция за избор на файл
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяваме дали файлът е изображение
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Невалиден файл",
        description: "Моля, изберете изображение (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Създаваме URL за преглед на изображението
    const fileReader = new FileReader()
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string)
    }
    fileReader.readAsDataURL(file)
  }

  // Функция за качване на файл
  const handleUpload = async () => {
    if (!selectedFile || !productId) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("productId", productId)

      const response = await fetch("/api/products/upload-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image")
      }

      setUploadedImageUrl(data.imageUrl)

      if (onImageUploaded) {
        onImageUploaded(data.imageUrl)
      }

      toast({
        title: "Успешно качване",
        description: "Изображението беше качено успешно",
        variant: "default",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Грешка при качване",
        description: error instanceof Error ? error.message : "Възникна грешка при качване на изображението",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Функция за отказ от избрания файл
  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center">
            {uploadedImageUrl ? (
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={uploadedImageUrl || "/placeholder.svg"}
                  alt="Product image"
                  fill
                  className="object-contain"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : previewUrl ? (
              <div className="relative w-full h-48 mb-4">
                <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center mb-4 border-2 border-dashed border-gray-300 rounded-md">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {!uploadedImageUrl && (
              <div className="flex flex-col items-center w-full">
                <label
                  htmlFor={`file-upload-${productId}`}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md w-full text-center"
                >
                  {previewUrl ? "Избери друго изображение" : "Избери изображение"}
                </label>
                <input
                  id={`file-upload-${productId}`}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {previewUrl && !uploadedImageUrl && (
            <div className="flex space-x-2">
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1 bg-green-600 hover:bg-green-700">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Качване...
                  </>
                ) : (
                  "Качи изображението"
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isUploading} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Отказ
              </Button>
            </div>
          )}

          {uploadedImageUrl && (
            <Button
              onClick={() => {
                setUploadedImageUrl(null)
                setSelectedFile(null)
                setPreviewUrl(null)
              }}
              variant="outline"
              className="w-full"
            >
              Качи ново изображение
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
