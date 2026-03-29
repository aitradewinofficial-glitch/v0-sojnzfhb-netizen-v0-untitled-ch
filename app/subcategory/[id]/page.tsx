import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ChevronRightIcon, Layers, ArrowLeft } from "lucide-react"
import { getSubcategoryById } from "@/lib/data"

import { Button } from "@/components/ui/button"
import {
  getCategories,
  getProductsBySubcategory,
  getSubcategories,
  getCategoryById,
  getActiveQuantityPromotionForSubcategory,
  getBatchProductRatings,
} from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { SiteFooter } from "@/components/site-footer"
import { StickyBottomNav } from "@/components/sticky-bottom-nav"
import { getUser } from "@/lib/auth"
import { ProductCard } from "@/components/product-card"
import { SubcategoryFilterPanel } from "@/components/subcategory-filter-panel"

// Generate dynamic metadata from SEO fields
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const subcategory = await getSubcategoryById(id)

  if (!subcategory) {
    return {
      title: "Подкатегория не е намерена | MADIX",
      description: "Търсената подкатегория не съществува.",
    }
  }

  // Use SEO fields if available, fallback to title/description
  const metaTitle = subcategory.seo_meta_title_bg || subcategory.seo_meta_title || subcategory.title
  const metaDescription = subcategory.seo_meta_description_bg || subcategory.seo_meta_description || subcategory.description || `Разгледайте продуктите в подкатегория ${subcategory.title}`
  const ogTitle = subcategory.seo_og_title_bg || subcategory.seo_og_title || metaTitle
  const ogDescription = subcategory.seo_og_description_bg || subcategory.seo_og_description || metaDescription
  const ogImage = subcategory.seo_og_image || subcategory.photourl
  const twitterTitle = subcategory.seo_twitter_title || ogTitle
  const twitterDescription = subcategory.seo_twitter_description || ogDescription
  const twitterImage = subcategory.seo_twitter_image || ogImage
  const keywords = subcategory.seo_meta_keywords_bg || subcategory.seo_meta_keywords

  return {
    title: `${metaTitle} | MADIX Groundbaits`,
    description: metaDescription,
    keywords: keywords ? keywords.split(",").map(k => k.trim()) : undefined,
    robots: subcategory.seo_robots || "index, follow",
    openGraph: {
      title: ogTitle,
      description: ogDescription || undefined,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: (subcategory.seo_twitter_card as "summary" | "summary_large_image") || "summary_large_image",
      title: twitterTitle,
      description: twitterDescription || undefined,
      images: twitterImage ? [twitterImage] : undefined,
    },
    alternates: subcategory.seo_canonical_url ? {
      canonical: subcategory.seo_canonical_url,
    } : undefined,
  }
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ minPrice?: string; maxPrice?: string; sort?: string }>
}) {
  const { id: subcategoryId } = await params
  const searchParamsResolved = await searchParams
  console.log("[SubcategoryPage] Rendering. Subcategory ID:", subcategoryId, "Search Params:", searchParamsResolved)

  const allSubcategories = await getSubcategories()
  const subcategory = allSubcategories.find((sub) => sub.id === subcategoryId)

  const user = await getUser()
  const isLoggedIn = !!user
  console.log("[SubcategoryPage] User data:", JSON.stringify(user, null, 2))

  const subcategoryPromotion = await getActiveQuantityPromotionForSubcategory(subcategoryId, user?.customerType)
  console.log(
    `[SubcategoryPage] Fetched subcategoryPromotion for subcategory ${subcategoryId} and customerType ${user?.customerType}:`,
    JSON.stringify(subcategoryPromotion, null, 2),
  )

  if (!subcategory) {
    console.warn(`[SubcategoryPage] Subcategory with ID ${subcategoryId} not found.`)
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Подкатегорията не е намерена</h1>
          <p className="mb-6">Съжаляваме, но търсената от вас подкатегория не съществува.</p>
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
            <Link href="/">Към началната страница</Link>
          </Button>
        </div>
      </div>
    )
  }
  console.log("[SubcategoryPage] Fetched subcategory:", subcategory?.title)

  const products = await getProductsBySubcategory(subcategoryId)
  console.log(`[SubcategoryPage] Found ${products.length} products for subcategory ${subcategoryId} initially.`)

  let filteredProducts = [...products]

  const minPriceParam = searchParamsResolved.minPrice ? Number.parseFloat(searchParamsResolved.minPrice) : undefined
  const maxPriceParam = searchParamsResolved.maxPrice ? Number.parseFloat(searchParamsResolved.maxPrice) : undefined

  if (minPriceParam !== undefined) {
    filteredProducts = filteredProducts.filter((product) => {
      const price = Number.parseFloat(product.price)
      return price >= minPriceParam
    })
    console.log(`[SubcategoryPage] Filtered by minPrice ${minPriceParam}: ${filteredProducts.length} products`)
  }

  if (maxPriceParam !== undefined) {
    filteredProducts = filteredProducts.filter((product) => {
      const price = Number.parseFloat(product.price)
      return price <= maxPriceParam
    })
    console.log(`[SubcategoryPage] Filtered by maxPrice ${maxPriceParam}: ${filteredProducts.length} products`)
  }

  const sortOption = searchParamsResolved.sort || "title-asc"
  // Sorting logic...
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
  console.log(`[SubcategoryPage] Sorted products by ${sortOption}.`)
  console.log(
    `[SubcategoryPage] Final filteredProducts count: ${filteredProducts.length}. First product's promo data will use subcategoryPromotion.`,
  )

  // Fetch ratings for all products
  const productIds = filteredProducts.map((p) => p.objectid)
  const ratingsMap = await getBatchProductRatings(productIds)

  const categories = await getCategories()
  const parentCategoryId = subcategory.cateid
  const currentSubcategory = subcategory
  const parentCategory = parentCategoryId ? await getCategoryById(parentCategoryId) : null
  const siblingSubcategories = parentCategoryId
    ? allSubcategories.filter((sub) => sub.cateid === parentCategoryId && sub.id !== subcategoryId)
    : []

  const getCategoryImage = (category: { title: string; photourl?: string }) => {
    if (category?.photourl) return category.photourl
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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-20 md:pb-0">
      <div className="bg-gray-950">
        <SiteHeader
          categories={categories}
          subcategories={allSubcategories}
          currentCategoryId={parentCategoryId}
          currentSubcategoryId={subcategoryId}
        />
      </div>
      <div className="bg-gray-900">
        <CategoriesNavbar categories={categories} subcategories={allSubcategories} currentCategoryId={parentCategoryId} isEnglish={false} />
      </div>
      {/* Apple-style Header Section */}
      <section className="relative py-8 md:py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Начало
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5" />
            {parentCategory && (
              <>
                <Link href={`/category/${parentCategory.id}`} className="hover:text-gray-900 transition-colors">
                  {parentCategory.title}
                </Link>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </>
            )}
            <span className="text-gray-900 font-medium">{currentSubcategory.title}</span>
          </nav>
          
          {/* Title and Stats */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900">
                {currentSubcategory.title}
              </h1>
              {currentSubcategory.description && (
                <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">{currentSubcategory.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "продукт" : "продукта"}
                </span>
                {parentCategory && (
                  <Link 
                    href={`/category/${parentCategory.id}`} 
                    className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Към {parentCategory.title}</span>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Optional: Category image on desktop */}
            <div className="hidden md:block relative h-32 w-48 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
              <Image
                src={
                  currentSubcategory.photourl ||
                  getCategoryImage(parentCategory || {}) ||
                  "/images/category-default.png"
                }
                alt={currentSubcategory.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Sibling subcategories section - hidden on mobile, shown in floating bar instead */}
      {siblingSubcategories.length > 0 && (
        <section className="hidden md:block py-6 bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center mb-4">
              <Layers className="h-5 w-5 text-red-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-800">Други подкатегории в {parentCategory?.title}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {siblingSubcategories.map(
                (
                  siblingSub, // Renamed subcategory to siblingSub to avoid conflict
                ) => (
                  <Link
                    key={siblingSub.id}
                    href={`/subcategory/${siblingSub.id}`}
                    className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 hover:border-red-600 rounded-md text-sm transition-colors text-gray-700"
                  >
                    {siblingSub.title}
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
      )}
      <section className="py-4 bg-gray-50">
        <div className="container mx-auto px-4">
          <SubcategoryFilterPanel
            subcategoryId={subcategoryId}
            minPrice={searchParamsResolved.minPrice}
            maxPrice={searchParamsResolved.maxPrice}
            sortOption={searchParamsResolved.sort || "title-asc"}
            siblingSubcategories={siblingSubcategories}
            parentCategoryTitle={parentCategory?.title}
          />
        </div>
      </section>
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => {
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
                    photourl={product.photourl}
                    isLoggedIn={isLoggedIn}
                    customerType={user?.customerType}
                    discountPercent={user?.discountPercent}
                    isNew={product.createdat ? isNewProduct(product.createdat) : false}
                    discount={getRandomDiscount()}
                    promo_buy_qty={subcategoryPromotion?.buy_quantity}
                    promo_free_qty={subcategoryPromotion?.free_quantity}
                    promo_description={subcategoryPromotion?.description}
                    averageRating={rating?.average_rating}
                    reviewCount={rating?.review_count}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <h3 className="text-xl font-medium mb-2 text-gray-800">Няма намерени продукти</h3>
              <p className="text-gray-600 mb-6">В момента няма продукти в тази подкатегория.</p>
              {parentCategory && (
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white mr-4">
                  <Link href={`/category/${parentCategory.id}`}>Към {parentCategory.title}</Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
              >
                <Link href="/">Към началната страница</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
<SiteFooter categories={categories || []} isEnglish={false} />

        {/* Sticky Bottom Navigation - Mobile only */}
        <StickyBottomNav isEnglish={false} />
    </div>
  )
}
