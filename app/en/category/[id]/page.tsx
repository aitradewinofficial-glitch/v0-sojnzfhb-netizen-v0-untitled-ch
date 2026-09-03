import type React from "react"
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
import { getCategoryById, getSubcategories, getProductsByCategory } from "@/lib/data"
import { getActiveQuantityPromotionForSubcategory, getBatchProductRatings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { getUser } from "@/lib/auth"
import { ProductCard } from "@/components/product-card"
import { CategoryFilterPanel } from "@/components/category-filter-panel"
import { SubcategoryImage } from "@/components/images"
import { StickyBottomNav } from "@/components/sticky-bottom-nav"
import { slugify } from "@/lib/utils"

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

// Function to normalize image URLs
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

// Helper function to get English title with fallback
function getEnglishTitle(item: { title_en?: string; title: string }): string {
  return item.title_en && item.title_en.trim() !== "" ? item.title_en : item.title
}

export default async function EnglishCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ subcategory?: string; minPrice?: string; maxPrice?: string; sort?: string }>
}) {
  const { id } = await params
  const searchParamsResolved = await searchParams
  console.log("[EnglishCategoryPage] Rendering. Category ID:", id, "Search Params:", searchParamsResolved)

  try {
    if (!id) {
      console.error("[EnglishCategoryPage] Category ID is required but not provided.")
      throw new Error("Category ID is required")
    }

    const subcategoryId = searchParamsResolved.subcategory
    console.log(`[EnglishCategoryPage] Current category param: ${id}, subcategoryId: ${subcategoryId}`)

    // Resolve the category first (param may be a Document ID or a name slug),
    // then use the real Document ID for all downstream lookups.
    const [category, allCategories, user] = await Promise.all([
      getCategoryById(id),
      getSubcategories(), // For SiteHeader
      getUser(),
    ])

    const categoryId = category?.id ?? id

    const [subcategories, productsByCategory] = await Promise.all([
      getSubcategories(categoryId),
      getProductsByCategory(categoryId),
    ])

    console.log("[EnglishCategoryPage] User data:", JSON.stringify(user, null, 2))

    if (!category) {
      console.warn(`[EnglishCategoryPage] Category with ID ${categoryId} not found.`)
      return (
        <div className="min-h-screen bg-gray-100 text-gray-800 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Category not found</h1>
            <p className="mb-6">Sorry, but the category you are looking for does not exist.</p>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/en">Go to homepage</Link>
            </Button>
          </div>
        </div>
      )
    }

    const categoryTitle = getEnglishTitle(category)
    // Human-readable slug (English title) used for all internal category links.
    const categorySlug = slugify(categoryTitle) || categoryId
    console.log("[EnglishCategoryPage] Fetched category:", categoryTitle)
    console.log(
      `[EnglishCategoryPage] Found ${productsByCategory.length} products for category ${categoryId} initially.`,
    )

    let filteredProducts = [...productsByCategory]

    if (subcategoryId) {
      filteredProducts = filteredProducts.filter((product) => product.subcateid === subcategoryId)
      console.log(`[EnglishCategoryPage] Filtered by subcategory ${subcategoryId}: ${filteredProducts.length} products`)
    }

    const minPriceParam = searchParamsResolved.minPrice ? Number.parseFloat(searchParamsResolved.minPrice) : undefined
    const maxPriceParam = searchParamsResolved.maxPrice ? Number.parseFloat(searchParamsResolved.maxPrice) : undefined

    if (minPriceParam !== undefined) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = Number.parseFloat(product.price)
        return price >= minPriceParam
      })
      console.log(`[EnglishCategoryPage] Filtered by minPrice ${minPriceParam}: ${filteredProducts.length} products`)
    }

    if (maxPriceParam !== undefined) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = Number.parseFloat(product.price)
        return price <= maxPriceParam
      })
      console.log(`[EnglishCategoryPage] Filtered by maxPrice ${maxPriceParam}: ${filteredProducts.length} products`)
    }

    const sortOption = searchParamsResolved.sort || "title-asc"
    // Sorting logic using English titles
    switch (sortOption) {
      case "title-asc":
        filteredProducts.sort((a, b) => (a.title_en || "").localeCompare(b.title_en || ""))
        break
      case "title-desc":
        filteredProducts.sort((a, b) => (b.title_en || "").localeCompare(a.title_en || ""))
        break
      case "price-asc":
        filteredProducts.sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))
        break
      case "price-desc":
        filteredProducts.sort((a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price))
        break
      default:
        filteredProducts.sort((a, b) => (a.title_en || "").localeCompare(b.title_en || ""))
    }
    console.log(`[EnglishCategoryPage] Sorted products by ${sortOption}.`)

    let productsToDisplay = [...filteredProducts]
    let subcategoryPagePromotion: { buy_quantity: number; free_quantity: number; description?: string | null } | null =
      null

    if (subcategoryId) {
      console.log(
        `[EnglishCategoryPage] Fetching promotion for specific subcategory: ${subcategoryId}, customerType: ${user?.customerType}`,
      )
      subcategoryPagePromotion = await getActiveQuantityPromotionForSubcategory(subcategoryId, user?.customerType)
      console.log(
        `[EnglishCategoryPage] Fetched subcategoryPagePromotion for subcategory ${subcategoryId} and customerType ${user?.customerType}:`,
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
        `[EnglishCategoryPage] No specific subcategory selected. Fetching promotions for each product's subcategory. CustomerType: ${user?.customerType}`,
      )
      productsToDisplay = await Promise.all(
        filteredProducts.map(async (product) => {
          if (product.subcateid) {
            const promotion = await getActiveQuantityPromotionForSubcategory(product.subcateid, user?.customerType)
            console.log(
              `[EnglishCategoryPage] Fetched promotion for product ${product.objectid} (subcat ${product.subcateid}) and customerType ${user?.customerType}:`,
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
      `[EnglishCategoryPage] Final productsToDisplay count: ${productsToDisplay.length}. First product's promo data:`,
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
        "Fishing Rods": <Package className="h-8 w-8 text-red-500" />,
        Макари: <ShoppingBag className="h-8 w-8 text-red-500" />,
        Reels: <ShoppingBag className="h-8 w-8 text-red-500" />,
        Примамки: <Droplet className="h-8 w-8 text-red-500" />,
        Lures: <Droplet className="h-8 w-8 text-red-500" />,
        Куки: <Anchor className="h-8 w-8 text-red-500" />,
        Hooks: <Anchor className="h-8 w-8 text-red-500" />,
        Влакна: <Waves className="h-8 w-8 text-red-500" />,
        Lines: <Waves className="h-8 w-8 text-red-500" />,
        Аксесоари: <ShoppingBag className="h-8 w-8 text-red-500" />,
        Accessories: <ShoppingBag className="h-8 w-8 text-red-500" />,
        Облекло: <Shirt className="h-8 w-8 text-red-500" />,
        Clothing: <Shirt className="h-8 w-8 text-red-500" />,
        Лодки: <Sailboat className="h-8 w-8 text-red-500" />,
        Boats: <Sailboat className="h-8 w-8 text-red-500" />,
        Сонари: <Waves className="h-8 w-8 text-red-500" />,
        "Fish Finders": <Waves className="h-8 w-8 text-red-500" />,
        Чанти: <Briefcase className="h-8 w-8 text-red-500" />,
        Bags: <Briefcase className="h-8 w-8 text-red-500" />,
      }
      return iconMap[categoryTitle] || <Fish className="h-8 w-8 text-red-500" />
    }

    const getCategoryImage = (category: { title: string; title_en?: string; photourl?: string }) => {
      if (category?.photourl) {
        return normalizeImageUrl(category.photourl)
      }
      const categoryImages: Record<string, string> = {
        Въдици: "/images/fishing-rod.png",
        "Fishing Rods": "/images/fishing-rod.png",
        Макари: "/images/fishing-reels.png",
        Reels: "/images/fishing-reels.png",
        Примамки: "/images/fishing-lures.png",
        Lures: "/images/fishing-lures.png",
        Куки: "/images/fishing-hooks.png",
        Hooks: "/images/fishing-hooks.png",
        Влакна: "/images/fishing-line.png",
        Lines: "/images/fishing-line.png",
        Аксесоари: "/images/fishing-accessories.png",
        Accessories: "/images/fishing-accessories.png",
        Облекло: "/images/fishing-clothing.png",
        Clothing: "/images/fishing-clothing.png",
        Лодки: "/images/fishing-boat.png",
        Boats: "/images/fishing-boat.png",
        Сонари: "/images/fish-finder.png",
        "Fish Finders": "/images/fish-finder.png",
        Чанти: "/images/fishing-bags.png",
        Bags: "/images/fishing-bags.png",
      }
      const categoryTitleForImage = getEnglishTitle(category)
      return categoryImages[categoryTitleForImage] || "/images/category-default.png"
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

    // Transform subcategories to ensure they use English titles
    const subcategoriesWithEnglishTitles = subcategories.map((subcategory) => {
      const englishTitle = getEnglishTitle(subcategory)
      console.log(
        `[EnglishCategoryPage] Subcategory ID: ${subcategory.id}, Original: ${subcategory.title}, English: ${subcategory.title_en || "N/A"}, Using: ${englishTitle}`,
      )
      return {
        ...subcategory,
        displayTitle: englishTitle,
        // Override the title to ensure English is used
        title: englishTitle,
      }
    })

    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 pb-20 md:pb-0">
        <SiteHeader categories={[]} subcategories={allCategories} currentCategoryId={categoryId} isEnglish={true} />
        <CategoriesNavbar currentCategoryId={categoryId} isEnglish={true} />

        <section className="relative py-6 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link href="/en" className="hover:text-red-600">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-red-600">{categoryTitle}</span>
            </div>
            <div className="grid grid-cols-1 gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{categoryTitle}</h1>
                {(category?.description_en || category?.description) && (
                  <p className="mt-2 text-gray-600 max-w-3xl">
                    {category?.description_en && category?.description_en.trim() !== ""
                      ? category?.description_en
                      : category?.description}
                  </p>
                )}
                <p className="mt-2 text-red-600 font-medium">
                  Products found: {productsToDisplay.length} of {productsByCategory.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {subcategoriesWithEnglishTitles.length > 0 && (
          <section className="py-8 md:py-10 bg-white border-b border-gray-100">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Subcategories</h2>
                <span className="text-sm text-gray-500 hidden md:block">{subcategoriesWithEnglishTitles.length} subcategories</span>
              </div>
              
              {/* Mobile: Horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-4 md:hidden scrollbar-hide">
                <Link
                  href={`/en/category/${categorySlug}`}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl min-w-[100px] transition-all duration-200 ${
                    !subcategoryId 
                      ? "bg-red-600 shadow-lg shadow-red-600/20" 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-14 h-14 flex items-center justify-center rounded-xl mb-2 ${
                    !subcategoryId ? "bg-white/20" : "bg-white"
                  }`}>
                    {getCategoryIcon(categoryTitle)}
                  </div>
                  <span className={`text-xs font-medium text-center ${!subcategoryId ? "text-white" : "text-gray-700"}`}>
                    All
                  </span>
                </Link>
                {subcategoriesWithEnglishTitles.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`/en/category/${categorySlug}?subcategory=${subcategory.id}`}
                    className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl min-w-[100px] transition-all duration-200 ${
                      subcategory.id === subcategoryId 
                        ? "bg-red-600 shadow-lg shadow-red-600/20" 
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`w-14 h-14 flex items-center justify-center rounded-xl mb-2 overflow-hidden ${
                      subcategory.id === subcategoryId ? "bg-white/20" : "bg-white"
                    }`}>
                      <SubcategoryImage
                        src={subcategory.photourl || getCategoryImage(category)}
                        alt={subcategory.displayTitle}
                        fallback={getCategoryIcon(categoryTitle)}
                      />
                    </div>
                    <span className={`text-xs font-medium text-center line-clamp-2 ${
                      subcategory.id === subcategoryId ? "text-white" : "text-gray-700"
                    }`}>
                      {subcategory.displayTitle}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Desktop: Grid layout with cards */}
              <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                <Link
                  href={`/en/category/${categorySlug}`}
                  className={`group flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                    !subcategoryId 
                      ? "bg-red-50 border-red-500 shadow-sm" 
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-lg mb-3 ${
                    !subcategoryId ? "bg-red-100" : "bg-gray-50"
                  }`}>
                    {getCategoryIcon(categoryTitle)}
                  </div>
                  <span className={`text-sm font-medium text-center ${!subcategoryId ? "text-red-600" : "text-gray-700"}`}>
                    All
                  </span>
                </Link>
                {subcategoriesWithEnglishTitles.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`/en/category/${categorySlug}?subcategory=${subcategory.id}`}
                    className={`group flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                      subcategory.id === subcategoryId 
                        ? "bg-red-50 border-red-500 shadow-sm" 
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg mb-3 overflow-hidden ${
                      subcategory.id === subcategoryId ? "bg-red-100" : "bg-gray-50"
                    }`}>
                      <SubcategoryImage
                        src={subcategory.photourl || getCategoryImage(category)}
                        alt={subcategory.displayTitle}
                        fallback={getCategoryIcon(categoryTitle)}
                      />
                    </div>
                    <span className={`text-sm font-medium text-center line-clamp-2 ${
                      subcategory.id === subcategoryId ? "text-red-600" : "text-gray-700"
                    }`}>
                      {subcategory.displayTitle}
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
              categoryId={categorySlug}
              subcategories={subcategoriesWithEnglishTitles}
              currentSubcategoryId={subcategoryId}
                minPrice={searchParamsResolved.minPrice}
                maxPrice={searchParamsResolved.maxPrice}
                sortOption={searchParamsResolved.sort || "title-asc"}
              isEnglish={true}
            />
          </div>
        </section>

        <section className="pt-8 pb-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {productsToDisplay.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {productsToDisplay.map((product) => {
                  // Only use English title - no fallback
                  const productTitle = product.title_en || ""

                  // Only use English description - no fallback
                  const productDescription = product.description_en || ""
                  
                  const rating = ratingsMap.get(product.objectid)

                  return (
                    <ProductCard
                      key={product.objectid}
                      id={product.objectid}
                      title={productTitle}
                      description={productDescription}
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
                      isEnglish={true}
                      averageRating={rating?.average_rating}
                      reviewCount={rating?.review_count}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <h3 className="text-xl font-medium mb-2 text-gray-800">No products found</h3>
                <p className="text-gray-600 mb-6">
                  {subcategoryId
                    ? "Try another subcategory or browse all products in this category."
                    : "There are currently no products in this category."}
                </p>
                {subcategoryId && (
                  <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                    <Link href={`/en/category/${categorySlug}`}>All products in category</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Sticky Bottom Navigation - Mobile only */}
        <StickyBottomNav isEnglish={true} />
      </div>
    )
  } catch (error) {
    console.error("[EnglishCategoryPage] Error during page rendering:", error)
    throw error
  }
}
