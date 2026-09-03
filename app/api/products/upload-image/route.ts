import { NextResponse } from "next/server"
import { uploadProductImage, updateProductImageUrl } from "@/lib/blob-storage"
// import { getUser } from "@/lib/auth"; // Премахваме проверката за потребител, затова getUser не е нужен

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // ПРЕМАНАТА ПРОВЕРКА ЗА ПОТРЕБИТЕЛ И РОЛЯ:
    // const user = await getUser()
    // if (!user || typeof user.role !== "string" || user.role.toLowerCase() !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized. Only admins can upload product images." }, { status: 401 })
    // }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string

    if (!file) {
      return NextResponse.json({ error: "Missing required field: file" }, { status: 400 })
    }

    // ProductId е все още важен, за да се знае за кой продукт е снимката
    // if (!productId) {
    //   console.warn(
    //     "ProductId not provided for image upload. Image will be uploaded to a general location and not directly associated with a product in the database via this endpoint.",
    //   )
    //   // Може да решите да върнете грешка, ако productId е задължителен за вас:
    //   // return NextResponse.json({ error: "Missing required field: productId" }, { status: 400 });
    // }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    const imageUrl = await uploadProductImage(file, productId || `temp-${Date.now()}`)

    if (productId) {
      const updated = await updateProductImageUrl(productId, imageUrl)
      if (!updated) {
        console.error("Failed to update product with new image URL, but image was uploaded:", imageUrl)
      }
    }

    return NextResponse.json({ success: true, url: imageUrl, imageUrl: imageUrl })
  } catch (error) {
    console.error("Error uploading product image:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to upload product image"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
