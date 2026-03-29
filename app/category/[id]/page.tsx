import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ChevronRight,
  Fish,
  Package,
  ShoppingBag,
  Droplet,
  Anchor,
  Shirt,
  Sailboat,
  Waves,
  Briefcase,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCategoryById, getSubcategories, getProductsByCategory, getCategories } from "@/lib/data" // Added getCategories
import { getActiveQuantityPromotionForSubcategory, getBatchProductRatings } from "@/lib/db" // For specific DB calls like promotions
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getUser } from "@/lib/auth"
import { ProductCard } from "@/components/product-card"
// Carousel imports are removed as the slider section is removed
// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { CategoryFilterPanel } from "@/components/category-filter-panel"
import { SubcategoryImage } from "@/components/images"
import { StickyBottomNav } from "@/components/sticky-bottom-nav"

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

// Generate dynamic metadata from SEO fields
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const category = await getCategoryById(id)

  if (!category) {
    return {
      title: "Категория не е намерена | MADIX",
      description: "Търсената категория не съществува.",
    }
  }

  // Use SEO fields if available, fallback to title/description
  const metaTitle = category.seo_meta_title_bg || category.seo_meta_title || category.title
  const metaDescription = category.seo_meta_description_bg || category.seo_meta_description || category.description || `Разгледайте продуктите в категория ${category.title}`
  const ogTitle = category.seo_og_title_bg || category.seo_og_title || metaTitle
  const ogDescription = category.seo_og_description_bg || category.seo_og_description || metaDescription
  const ogImage = category.seo_og_image || category.photourl
  const twitterTitle = category.seo_twitter_title || ogTitle
  const twitterDescription = category.seo_twitter_description || ogDescription
  const twitterImage = category.seo_twitter_image || ogImage
  const keywords = category.seo_meta_keywords_bg || category.seo_meta_keywords

  return {
    title: `${metaTitle} | MADIX Groundbaits`,
    description: metaDescription,
    keywords: keywords ? keywords.split(",").map(k => k.trim()) : undefined,
    robots: category.seo_robots || "index, follow",
    openGraph: {
      title: ogTitle,
      description: ogDescription || undefined,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: (category.seo_twitter_card as "summary" | "summary_large_image") || "summary_large_image",
      title: twitterTitle,
      description: twitterDescription || undefined,
      images: twitterImage ? [twitterImage] : undefined,
    },
    alternates: category.seo_canonical_url ? {
      canonical: category.seo_canonical_url,
    } : undefined,
  }
}

// Функция за нормализиране на URL адреси на снимки
function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || url === "" || url === "null" || url === "undefined") {
    return "/placeholder.svg?height=400&width=400"
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  if (url.startsWith("/")) {
    return url
  }
  return `/${url}`
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ subcategory?: string; minPrice?: string; maxPrice?: string; sort?: string }>
}) {
  const { id } = await params
  const searchParamsResolved = await searchParams
  console.log("[CategoryPage] Rendering. Category ID:", id, "Search Params:", searchParamsResolved)

  try {
    if (!id) {
      console.error("[CategoryPage] Category ID is required but not provided.")
      throw new Error("Category ID is required")
    }

    const categoryId = id
    const subcategoryId = searchParamsResolved.subcategory
    console.log(`[CategoryPage] Current categoryId: ${categoryId}, subcategoryId: ${subcategoryId}`)

    const [category, subcategories, allSubcategories, categories, user, productsByCategory] = await Promise.all([
      getCategoryById(categoryId),
      getSubcategories(categoryId),
      getSubcategories(), // For SiteHeader
      getCategories(), // For SiteFooter
      getUser(),
      getProductsByCategory(categoryId),
    ])

    console.log("[CategoryPage] User data:", JSON.stringify(user, null, 2))

    if (!category) {
      console.warn(`[CategoryPage] Category with ID ${categoryId} not found.`)
      return (
        <div className="min-h-screen bg-gray-100 text-gray-800 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Категорията не е намерена</h1>
            <p className="mb-6">Съжаляваме, но търсената от вас категория не съществува.</p>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/">Към началната страница</Link>
            </Button>
          </div>
        </div>
      )
    }
    console.log("[CategoryPage] Fetched category:", category?.title)
    console.log(`[CategoryPage] Found ${productsByCategory.length} products for category ${categoryId} initially.`)

    let filteredProducts = [...productsByCategory]

    if (subcategoryId) {
      filteredProducts = filteredProducts.filter((product) => product.subcateid === subcategoryId)
      console.log(`[CategoryPage] Filtered by subcategory ${subcategoryId}: ${filteredProducts.length} products`)
    }

    const minPriceParam = searchParamsResolved.minPrice ? Number.parseFloat(searchParamsResolved.minPrice) : undefined
    const maxPriceParam = searchParamsResolved.maxPrice ? Number.parseFloat(searchParamsResolved.maxPrice) : undefined

    if (minPriceParam !== undefined) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = Number.parseFloat(product.price)
        return price >= minPriceParam
      })
      console.log(`[CategoryPage] Filtered by minPrice ${minPriceParam}: ${filteredProducts.length} products`)
    }

    if (maxPriceParam !== undefined) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = Number.parseFloat(product.price)
        return price <= maxPriceParam
      })
      console.log(`[CategoryPage] Filtered by maxPrice ${maxPriceParam}: ${filteredProducts.length} products`)
    }

    const sortOption = searchParamsResolved.sort || "title-asc"
    // Sorting logic... (console logs for sorting can be added if needed)
    switch (sortOption) {
      case "title-asc":
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "title-desc":
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title))
        break
      case "price-asc":
        filteredProducts.sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))
        break
      case "price-desc":
        filteredProducts.sort((a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price))
        break
      default:
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title))
    }
    console.log(`[CategoryPage] Sorted products by ${sortOption}.`)

    let productsToDisplay = [...filteredProducts]
    let subcategoryPagePromotion: { buy_quantity: number; free_quantity: number; description?: string | null } | null =
      null

    if (subcategoryId) {
      console.log(
        `[CategoryPage] Fetching promotion for specific subcategory: ${subcategoryId}, customerType: ${user?.customerType}`,
      )
      subcategoryPagePromotion = await getActiveQuantityPromotionForSubcategory(subcategoryId, user?.customerType)
      console.log(
        `[CategoryPage] Fetched subcategoryPagePromotion for subcategory ${subcategoryId} and customerType ${user?.customerType}:`,
        JSON.stringify(subcategoryPagePromotion, null, 2),
      )
      productsToDisplay = filteredProducts.map((product) => ({
        ...product,
        promo_buy_qty: subcategoryPagePromotion?.buy_quantity,
        promo_free_qty: subcategoryPagePromotion?.free_quantity,
        promo_description: subcategoryPagePromotion?.description,
      }))
    } else {
      console.log(
        `[CategoryPage] No specific subcategory selected. Fetching promotions for each product's subcategory. CustomerType: ${user?.customerType}`,
      )
      productsToDisplay = await Promise.all(
        filteredProducts.map(async (product) => {
          if (product.subcateid) {
            const promotion = await getActiveQuantityPromotionForSubcategory(product.subcateid, user?.customerType)
            console.log(
              `[CategoryPage] Fetched promotion for product ${product.objectid} (subcat ${product.subcateid}) and customerType ${user?.customerType}:`,
              JSON.stringify(promotion, null, 2),
            )
            return {
              ...product,
              promo_buy_qty: promotion?.buy_quantity,
              promo_free_qty: promotion?.free_quantity,
              promo_description: promotion?.description,
            }
          }
          return product
        }),
      )
    }
    console.log(
      `[CategoryPage] Final productsToDisplay count: ${productsToDisplay.length}. First product's promo data:`,
      productsToDisplay.length > 0
        ? {
            promo_buy_qty: productsToDisplay[0].promo_buy_qty,
            promo_free_qty: productsToDisplay[0].promo_free_qty,
            promo_description: productsToDisplay[0].promo_description,
          }
        : "No products to display",
    )

    // Fetch ratings for all products
    const productIds = productsToDisplay.map((p) => p.objectid)
    const ratingsMap = await getBatchProductRatings(productIds)

    const getCategoryIcon = (categoryTitle: string) => {
      const iconMap: Record<string, React.ReactNode> = {
        Въдици: <Package className="h-8 w-8 text-red-500" />,
        Макари: <ShoppingBag className="h-8 w-8 text-red-500" />,
        Примамки: <Droplet className="h-8 w-8 text-red-500" />,
        Куки: <Anchor className="h-8 w-8 text-red-500" />,
        Влакна: <Waves className="h-8 w-8 text-red-500" />,
        Аксесоари: <ShoppingBag className="h-8 w-8 text-red-500" />,
        Облекло: <Shirt className="h-8 w-8 text-red-500" />,
        Лодки: <Sailboat className="h-8 w-8 text-red-500" />,
        Сонари: <Waves className="h-8 w-8 text-red-500" />,
        Чанти: <Briefcase className="h-8 w-8 text-red-500" />,
      }
      return iconMap[categoryTitle] || <Fish className="h-8 w-8 text-red-500" />
    }

    const getCategoryImage = (category: { title: string; photourl?: string }) => {
      if (category?.photourl) {
        return normalizeImageUrl(category.photourl)
      }
      const categoryImages: Record<string, string> = {
        Въдици: "/images/fishing-rod.png",
        Макари: "/images/fishing-reels.png",
        Примамки: "/images/fishing-lures.png",
        Куки: "/images/fishing-hooks.png",
        Влакна: "/images/fishing-line.png",
        Аксесоари: "/images/fishing-accessories.png",
        Облекло: "/images/fishing-clothing.png",
        Лодки: "/images/fishing-boat.png",
        Сонари: "/images/fish-finder.png",
        Чанти: "/images/fishing-bags.png",
      }
      return categoryImages[category?.title || ""] || "/images/category-default.png"
    }

    const isNewProduct = (createdAt: string) => {
      if (!createdAt) return false
      const productDate = new Date(createdAt)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      return productDate > twoWeeksAgo
    }

    const getRandomDiscount = () => {
      if (Math.random() < 0.2) {
        return Math.floor(Math.random() * 26) + 5
      }
      return 0
    }
    const isLoggedIn = !!user

    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 pb-20 md:pb-0">
        <SiteHeader categories={categories} subcategories={allSubcategories} currentCategoryId={categoryId} />
        <CategoriesNavbar categories={categories} subcategories={allSubcategories} currentCategoryId={categoryId} isEnglish={false} />

        {/* Apple-style Header Section */}
        <section className="relative py-8 md:py-12 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Начало
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">{category?.title || "Категория"}</span>
            </nav>
            
            {/* Title and Stats */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900">
                {category?.title || "Категория"}
              </h1>
              {category?.description && (
                <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">{category.description}</p>
              )}
              <p className="text-sm text-gray-400">
                {productsToDisplay.length === productsByCategory.length ? (
                  <span>{productsToDisplay.length} продукта</span>
                ) : (
                  <span>{productsToDisplay.length} от {productsByCategory.length} продукта</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {subcategories.length > 0 && (
          <section className="py-6 bg-white border-b border-gray-200">
            <div className="container mx-auto px-4">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Подкатегории</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Link
                  href={`/category/${categoryId}`}
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    !subcategoryId ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full mb-2">
                    {getCategoryIcon(category.title)}
                  </div>
                  <span
                    className={`text-sm text-center ${!subcategoryId ? "font-medium text-red-600" : "text-gray-700"}`}
                  >
                    Всички
                  </span>
                </Link>
                {subcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`/category/${categoryId}?subcategory=${subcategory.id}`}
                    className={`flex flex-col items-center p-3 rounded-lg border ${
                      subcategory.id === subcategoryId ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full mb-2">
                      <SubcategoryImage
                        src={subcategory.photourl || getCategoryImage(category)}
                        alt={subcategory.title}
                        fallback={getCategoryIcon(category.title)}
                      />
                    </div>
                    <span
                      className={`text-sm text-center ${
                        subcategory.id === subcategoryId ? "font-medium text-red-600" : "text-gray-700"
                      }`}
                    >
                      {subcategory.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-4 bg-gray-50">
          <div className="container mx-auto px-4">
            <CategoryFilterPanel
              categoryId={categoryId}
              subcategories={subcategories}
              currentSubcategoryId={subcategoryId}
                minPrice={searchParamsResolved.minPrice}
                maxPrice={searchParamsResolved.maxPrice}
                sortOption={searchParamsResolved.sort || "title-asc"}
            />
          </div>
        </section>

        <section className="pt-8 pb-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {productsToDisplay.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {productsToDisplay.map((product) => {
                  const rating = ratingsMap.get(product.objectid)
                  return (
                    <ProductCard
                      key={product.objectid}
                      id={product.objectid}
                      title={product.title}
                      description={product.description}
                      price={Number(product.price)}
                      retailerprice={product.retailerprice ? Number(product.retailerprice) : undefined}
                      wholesalerprice={product.wholesalerprice ? Number(product.wholesalerprice) : undefined}
                      europe_price={product.europe_price ? Number(product.europe_price) : undefined}
                      price_eur={product.price_eur ? Number(product.price_eur) : undefined}
                      retailerprice_eur={product.retailerprice_eur ? Number(product.retailerprice_eur) : undefined}
                      wholesalerprice_eur={product.wholesalerprice_eur ? Number(product.wholesalerprice_eur) : undefined}
                      europe_price_eur={product.europe_price_eur ? Number(product.europe_price_eur) : undefined}
                      photourl={normalizeImageUrl(product.photourl)}
                      isLoggedIn={isLoggedIn}
                      customerType={user?.customerType}
                      discountPercent={user?.discountPercent}
                      isNew={product.createdat ? isNewProduct(product.createdat) : false}
                      discount={getRandomDiscount()}
                      promo_buy_qty={product.promo_buy_qty}
                      promo_free_qty={product.promo_free_qty}
                      promo_description={product.promo_description}
                      averageRating={rating?.average_rating}
                      reviewCount={rating?.review_count}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <h3 className="text-xl font-medium mb-2 text-gray-800">Няма намерени продукти</h3>
                <p className="text-gray-600 mb-6">
                  {subcategoryId
                    ? "Опитайте с друга подкатегория или разгледайте всички продукти в тази категория."
                    : "В момента няма продукти в тази категория."}
                </p>
                {subcategoryId && (
                  <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                    <Link href={`/category/${categoryId}`}>Всички продукти в категорията</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        <SiteFooter categories={categories || []} isEnglish={false} />

        {/* Sticky Bottom Navigation - Mobile only */}
        <StickyBottomNav isEnglish={false} />
      </div>
    )
  } catch (error) {
    console.error("[CategoryPage] Error during page rendering:", error)
    // It's generally better to re-throw or handle with a user-facing error component
    // For now, re-throwing to let Next.js error boundary handle it.
    throw error // Re-throw to allow Next.js to handle it or show an error boundary
  }
}
