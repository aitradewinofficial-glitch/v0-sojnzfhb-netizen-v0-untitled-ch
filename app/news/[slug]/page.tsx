import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ChevronRight, Calendar, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { getNewsBySlug, getNewsById, getCategories, getSubcategories, getProductById } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { ProductCard } from "@/components/product-card"

interface ContentBlock {
  type: "text" | "image" | "heading"
  content?: string
  url?: string
  alt?: string
  level?: number
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  // Try to get by slug first, then by ID
  let newsItem = await getNewsBySlug(slug)
  if (!newsItem) {
    const id = parseInt(slug)
    if (!isNaN(id)) {
      newsItem = await getNewsById(id)
    }
  }

  if (!newsItem) {
    return { title: "Новина не е намерена" }
  }

  return {
    title: newsItem.meta_title || newsItem.title,
    description: newsItem.meta_description || newsItem.summary || "",
    keywords: newsItem.meta_keywords || "",
    openGraph: {
      title: newsItem.meta_title || newsItem.title,
      description: newsItem.meta_description || newsItem.summary || "",
      images: newsItem.image_url ? [newsItem.image_url] : [],
    },
  }
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Try to get by slug first, then by ID
  let newsItem = await getNewsBySlug(slug)
  if (!newsItem) {
    const id = parseInt(slug)
    if (!isNaN(id)) {
      newsItem = await getNewsById(id)
    }
  }

  if (!newsItem || !newsItem.is_active) {
    notFound()
  }

  const categories = await getCategories().catch(() => [])
  const allSubcategories = await getSubcategories().catch(() => [])
  const user = await getUser().catch(() => null)
  const isUserLoggedIn = !!user

  // Parse content blocks
  const contentBlocks: ContentBlock[] = Array.isArray(newsItem.content_blocks) 
    ? newsItem.content_blocks 
    : (typeof newsItem.content_blocks === 'string' ? JSON.parse(newsItem.content_blocks || '[]') : [])

  // Parse gallery images
  const galleryImages: string[] = Array.isArray(newsItem.gallery_images)
    ? newsItem.gallery_images
    : (typeof newsItem.gallery_images === 'string' ? JSON.parse(newsItem.gallery_images || '[]') : [])

  // Parse related products
  const relatedProductIds: string[] = Array.isArray(newsItem.related_products)
    ? newsItem.related_products
    : (typeof newsItem.related_products === 'string' ? JSON.parse(newsItem.related_products || '[]') : [])

  // Fetch related products
  const relatedProducts = await Promise.all(
    relatedProductIds.map(async (id) => {
      try {
        return await getProductById(id)
      } catch {
        return null
      }
    })
  ).then(products => products.filter(Boolean))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("bg-BG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader
        categories={categories}
        subcategories={allSubcategories}
        isLoggedIn={isUserLoggedIn}
        userName={user?.name || user?.storeName || ""}
      />

      <CategoriesNavbar isEnglish={false} />

      {/* Breadcrumb */}
      <div className="border-b border-neutral-200/60 py-3.5">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1.5 text-sm text-neutral-400">
            <Link href="/" className="transition-colors hover:text-neutral-700">
              Начало
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/#news" className="transition-colors hover:text-neutral-700">
              Новини
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-neutral-700 font-medium truncate max-w-[200px]">{newsItem.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article className="py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Обратно към начало</span>
          </Link>

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 leading-tight text-balance mb-4">
              {newsItem.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={newsItem.created_at}>{formatDate(newsItem.created_at)}</time>
              </div>
            </div>

            {newsItem.summary && (
              <p className="mt-6 text-xl text-neutral-600 leading-relaxed">
                {newsItem.summary}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {newsItem.image_url && (
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 bg-neutral-100">
              <Image
                src={newsItem.image_url}
                alt={newsItem.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg prose-neutral max-w-none">
            {/* Legacy content field */}
            {newsItem.content && !contentBlocks.length && (
              <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                {newsItem.content}
              </div>
            )}

            {/* Content blocks */}
            {contentBlocks.map((block, index) => {
              switch (block.type) {
                case "heading":
                  const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements
                  return (
                    <HeadingTag key={index} className="font-bold text-neutral-900 mt-8 mb-4">
                      {block.content}
                    </HeadingTag>
                  )
                case "text":
                  return (
                    <p key={index} className="text-neutral-700 leading-relaxed mb-6 whitespace-pre-wrap">
                      {block.content}
                    </p>
                  )
                case "image":
                  return (
                    <figure key={index} className="my-8">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-100">
                        <Image
                          src={block.url || ""}
                          alt={block.alt || ""}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {block.alt && (
                        <figcaption className="text-center text-sm text-neutral-500 mt-2">
                          {block.alt}
                        </figcaption>
                      )}
                    </figure>
                  )
                default:
                  return null
              }
            })}
          </div>

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Галерия</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
                    <Image
                      src={url}
                      alt={`Изображение ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 md:py-16 border-t border-neutral-200/60 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                Свързани продукти
              </h2>
              <p className="text-neutral-500 mt-1.5 text-sm">
                Разгледайте продуктите, свързани с тази новина
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {relatedProducts.map((product: any) => (
                <ProductCard
                  key={product.objectid}
                  id={product.objectid}
                  title={product.title}
                  description={product.description}
                  price={Number(product.price) || 0}
                  retailerprice={Number(product.retailerprice)}
                  wholesalerprice={Number(product.wholesalerprice)}
                  europe_price={Number(product.europe_price)}
                  price_eur={product.price_eur ? Number(product.price_eur) : null}
                  retailerprice_eur={product.retailerprice_eur ? Number(product.retailerprice_eur) : null}
                  wholesalerprice_eur={product.wholesalerprice_eur ? Number(product.wholesalerprice_eur) : null}
                  europe_price_eur={product.europe_price_eur ? Number(product.europe_price_eur) : null}
                  photourl={product.photourl}
                  isLoggedIn={isUserLoggedIn}
                  customerType={user?.customerType}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter isEnglish={false} />
    </div>
  )
}
