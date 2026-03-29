import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { ChevronRight, Tag, Package, Layers, Hash, CheckCircle2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { ProductCard } from "@/components/product-card"
import { ProductQuantityControls } from "@/components/product-quantity-controls"
import { StickyBuyButton } from "@/components/sticky-buy-button"
import { CompareFloatingButton } from "@/components/compare-floating-button"
import { StarRating } from "@/components/star-rating"
import { ProductReviewsSection } from "@/components/product-reviews-section"
import { getUser } from "@/lib/auth"
import {
  getCategories,
  getSubcategories,
  getProductById,
  getCategoryById,
  getSubcategoryById,
  getProductsByCategory,
  getActiveQuantityPromotionForSubcategory,
  getProductRatingSummary,
} from "@/lib/db"

export const dynamic = "force-dynamic"

// Dynamic SEO metadata from database (English version)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: productId } = await params
  
  if (!productId || productId === "null" || productId === "undefined") {
    return { title: "Product not found | Madix Groundbaits" }
  }

  const product = await getProductById(productId)
  
  if (!product) {
    return { title: "Product not found | Madix Groundbaits" }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://madix-groundbaits.bg"
  const productUrl = `${baseUrl}/en/product/${productId}`
  const productImage = product.photourl || `${baseUrl}/og-image.jpg`
  const displayTitle = product.title_en || product.title
  const displayDescription = product.description_en || product.description

  return {
    title: product.seo_meta_title || `${displayTitle} | Madix Groundbaits`,
    description: product.seo_meta_description || displayDescription?.slice(0, 160) || `Buy ${displayTitle} from Madix Groundbaits - professional fishing equipment`,
    keywords: product.seo_meta_keywords?.split(",").map((k: string) => k.trim()),
    robots: product.seo_robots || "index, follow",
    alternates: {
      canonical: product.seo_canonical_url || productUrl,
      languages: {
        "bg": `${baseUrl}/product/${productId}`,
        "en": productUrl,
      },
    },
    openGraph: {
      title: product.seo_og_title || product.seo_meta_title || displayTitle,
      description: product.seo_og_description || product.seo_meta_description || displayDescription?.slice(0, 200),
      url: productUrl,
      siteName: "Madix Groundbaits",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: product.seo_og_image || productImage,
          width: 1200,
          height: 630,
          alt: product.seo_alt_text || displayTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.seo_twitter_title || product.seo_og_title || displayTitle,
      description: product.seo_twitter_description || product.seo_og_description || displayDescription?.slice(0, 200),
      images: [product.seo_twitter_image || product.seo_og_image || productImage],
    },
  }
}

interface ProductPageProps {
  params: Promise<{
  id: string
  }>
}

function formatDisplayPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return "N/A"
  }
  return Number(price).toFixed(2)
}

function convertBgnToEur(bgnPrice: number | null | undefined): number | null {
  if (bgnPrice === null || bgnPrice === undefined || isNaN(Number(bgnPrice))) {
    return null
  }
  return Number(bgnPrice) / 1.96
}

async function ProductContent({ productId }: { productId: string }) {
  try {
    if (!productId || productId === "null" || productId === "undefined" || productId.trim() === "") {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-3">Product not found</h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              Sorry, but the product you are looking for does not exist.
            </p>
            <Button asChild className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3">
              <Link href="/en">Back to homepage</Link>
            </Button>
          </div>
        </div>
      )
    }

    const product = await getProductById(productId)
    if (!product) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-3">Product not found</h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              Sorry, but the product you are looking for does not exist.
            </p>
            <Button asChild className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3">
              <Link href="/en">Back to homepage</Link>
            </Button>
          </div>
        </div>
      )
    }

    const categories = await getCategories().catch(() => [])
    const user = await getUser().catch(() => null)
    const isUserLoggedIn = !!user

    const subcategoryPromotion = await getActiveQuantityPromotionForSubcategory(product.subcateid, user?.customerType)

    const category = product?.cateid ? await getCategoryById(product.cateid).catch(() => null) : null
    const allSubcategories = await getSubcategories().catch(() => [])
    const subcategory = product?.subcateid ? await getSubcategoryById(product.subcateid).catch(() => null) : null

    const similarProducts = product?.cateid
      ? (await getProductsByCategory(product.cateid).catch(() => []))
          .filter((p) => p["Document ID"] !== product["Document ID"])
          .slice(0, 8)
      : []

    const ratingSummary = await getProductRatingSummary(product["Document ID"] || product.objectid).catch(() => null)

    const englishCategories = (categories || []).map((cat) => ({
      ...cat,
      title: cat.title_en || cat.title,
    }))

    const isEuropeanCustomer = () => {
      const type = user?.customerType?.toLowerCase()
      return type === "european" || type === "europen"
    }

    const getBasePriceForCustomer = (): number | null => {
      if (!isUserLoggedIn) {
        return Number(product.price)
      }
      const type = user?.customerType?.toLowerCase()
      if (isEuropeanCustomer()) {
        return product.europe_price !== undefined && product.europe_price !== null ? Number(product.europe_price) : null
      } else if (type === "wholesaler" || type === "едро") {
        return product.wholesalerprice !== undefined && product.wholesalerprice !== null
          ? Number(product.wholesalerprice)
          : null
      } else if (type === "retailer" || type === "дребно") {
        return product.retailerprice !== undefined && product.retailerprice !== null
          ? Number(product.retailerprice)
          : null
      } else {
        return Number(product.price)
      }
    }

    const priceToDisplay = getBasePriceForCustomer()
    
    // Get EUR price directly from database for customer type
    const getEurPriceForCustomer = (): number | null => {
      if (!isUserLoggedIn) {
        return product.price_eur !== undefined && product.price_eur !== null ? Number(product.price_eur) : null
      }
      const type = user?.customerType?.toLowerCase()
      if (isEuropeanCustomer()) {
        return product.europe_price_eur !== undefined && product.europe_price_eur !== null ? Number(product.europe_price_eur) : null
      } else if (type === "wholesaler" || type === "едро") {
        return product.wholesalerprice_eur !== undefined && product.wholesalerprice_eur !== null ? Number(product.wholesalerprice_eur) : null
      } else if (type === "retailer" || type === "дребно") {
        return product.retailerprice_eur !== undefined && product.retailerprice_eur !== null ? Number(product.retailerprice_eur) : null
      } else {
        return product.price_eur !== undefined && product.price_eur !== null ? Number(product.price_eur) : null
      }
    }
    
    const dbEurPrice = getEurPriceForCustomer()
    const eurPrice = dbEurPrice !== null ? dbEurPrice : convertBgnToEur(priceToDisplay)

    const getPriceLabel = (): string => {
      if (!isUserLoggedIn) return "Standard Price"
      const type = user?.customerType?.toLowerCase()
      if (isEuropeanCustomer()) {
        return priceToDisplay !== null ? "Price for European Customers" : "Price for European Customers (N/A)"
      }
      if (type === "wholesaler" || type === "едро") {
        return priceToDisplay !== null ? "Wholesale Price" : "Wholesale Price (N/A)"
      }
      if (type === "retailer" || type === "дребно") {
        return priceToDisplay !== null ? "Retail Price" : "Retail Price (N/A)"
      }
      return "Standard Price"
    }

    let finalPromoBuyQty: number | null | undefined = null
    let finalPromoFreeQty: number | null | undefined = null
    let promotionDisplayMessage: string | null = null

    if (subcategoryPromotion && subcategoryPromotion.buy_quantity > 0 && subcategoryPromotion.free_quantity >= 0) {
      finalPromoBuyQty = subcategoryPromotion.buy_quantity
      finalPromoFreeQty = subcategoryPromotion.free_quantity

      if (subcategoryPromotion.description) {
        promotionDisplayMessage = subcategoryPromotion.description
      } else if (finalPromoFreeQty > 0) {
        promotionDisplayMessage = `Buy ${finalPromoBuyQty}, Get ${finalPromoFreeQty} Free!`
      } else if (finalPromoBuyQty > 0 && finalPromoFreeQty === 0) {
        promotionDisplayMessage = `Special offer when buying ${finalPromoBuyQty} pcs.`
      }
    }

    const displayTitle = product.title_en || product.title
    const displayDescription = product.description_en || product.description
    const categoryTitle = category?.title_en || category?.title
    const subcategoryTitle = subcategory?.title_en || subcategory?.title

    // Generate JSON-LD structured data for product (English)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://madix-groundbaits.bg"
    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": displayTitle,
      "description": product.seo_meta_description || displayDescription,
      "image": product.photourl,
      "sku": product.seo_schema_sku || product.objectid,
      "brand": {
        "@type": "Brand",
        "name": product.seo_schema_brand || "Madix Groundbaits"
      },
      "offers": {
        "@type": "Offer",
        "url": `${baseUrl}/en/product/${product.objectid}`,
        "priceCurrency": "EUR",
        "price": eurPrice || (priceToDisplay ? priceToDisplay / 1.96 : null),
        "availability": `https://schema.org/${product.seo_schema_availability || "InStock"}`,
        "seller": {
          "@type": "Organization",
          "name": "Madix Groundbaits"
        }
      },
      ...(ratingSummary && ratingSummary.review_count > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ratingSummary.average_rating,
          "reviewCount": ratingSummary.review_count
        }
      } : {})
    }

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        
        <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-24 md:pb-0">
          {/* Header */}
          <SiteHeader
            categories={englishCategories}
            subcategories={allSubcategories}
            currentCategoryId={product?.cateid}
            isLoggedIn={isUserLoggedIn}
            userName={user?.name || user?.storeName || ""}
            isEnglish={true}
          />
        <CategoriesNavbar currentCategoryId={product?.cateid} isEnglish={true} />

        {/* Breadcrumb */}
        <div className="border-b border-neutral-200/60 py-3.5">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1.5 text-sm text-neutral-400">
              <Link href="/en" className="transition-colors hover:text-neutral-700">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              {category && (
                <>
                  <Link href={`/en/category/${category.id}`} className="transition-colors hover:text-neutral-700">
                    {categoryTitle}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
              {subcategory && (
                <>
                  <Link href={`/en/subcategory/${subcategory.id}`} className="transition-colors hover:text-neutral-700">
                    {subcategoryTitle}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
              <span className="text-neutral-700 font-medium truncate max-w-[200px]">{displayTitle}</span>
            </div>
          </div>
        </div>

        {/* Product Detail Section */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

              {/* Image Gallery */}
              <div className="relative">
                <div className="sticky top-8">
                  <div className="aspect-square relative rounded-3xl bg-white border border-neutral-200/60 overflow-hidden shadow-sm">
                    <Image
                      src={
                        product.photourl ||
                        `/placeholder.svg?height=700&width=700&query=${encodeURIComponent(displayTitle || "fishing equipment")}`
                      }
                      alt={displayTitle}
                      fill
                      className="object-contain p-8 md:p-12"
                      priority
                      unoptimized
                    />

                    {promotionDisplayMessage && (
                      <div className="absolute left-4 top-4 z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold tracking-wide text-white shadow-lg shadow-amber-500/20">
                          <Tag className="h-3.5 w-3.5" />
                          {promotionDisplayMessage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 leading-tight text-balance">
                  {displayTitle}
                </h1>

                {/* Rating */}
                {ratingSummary && ratingSummary.review_count > 0 && (
                  <div className="mt-3">
                    <StarRating
                      rating={ratingSummary.average_rating}
                      size="md"
                      showValue
                      reviewCount={ratingSummary.review_count}
                      isEnglish={true}
                    />
                  </div>
                )}

                {/* Price Block */}
                <div className="mt-6 pb-6 border-b border-neutral-200/60">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                    {getPriceLabel()}
                  </p>
                  {isUserLoggedIn ? (
                    <>
                      {priceToDisplay !== null ? (
                        <div className="flex items-baseline gap-3">
                          {eurPrice !== null && (
                            <span className="text-4xl font-bold tracking-tight text-neutral-900">
                              {formatDisplayPrice(eurPrice)}
                              <span className="text-xl font-semibold text-neutral-500 ml-1">{"€"}</span>
                            </span>
                          )}
                          <span className="text-lg text-neutral-400 font-medium">
                            {formatDisplayPrice(priceToDisplay)} BGN
                          </span>
                        </div>
                      ) : (
                        <span className="text-4xl font-bold text-neutral-300">N/A</span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold tracking-tight text-neutral-900">
                          {formatDisplayPrice(convertBgnToEur(Number(product.price)))}
                          <span className="text-xl font-semibold text-neutral-500 ml-1">{"€"}</span>
                        </span>
                        <span className="text-lg text-neutral-400 font-medium">
                          {formatDisplayPrice(Number(product.price))} BGN
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
                        Register or log in to your profile for special prices and discounts.
                      </p>
                    </>
                  )}
                </div>

                {/* Description */}
                {displayDescription && (
                  <div className="mt-6 pb-6 border-b border-neutral-200/60">
                    <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                      {displayDescription}
                    </p>
                  </div>
                )}

                {/* Add to Cart */}
                <div className="mt-6 pb-6 border-b border-neutral-200/60">
                  <ProductQuantityControls
                    productId={product["Document ID"] || product.objectid}
                    productTitle={displayTitle}
                    productPrice={priceToDisplay !== null ? priceToDisplay : 0}
                    photoUrl={product.photourl}
                    promo_buy_qty={finalPromoBuyQty}
                    promo_free_qty={finalPromoFreeQty}
                    disabled={priceToDisplay === null}
                    isEnglish={true}
                  />
                </div>

                {/* Product Meta */}
                <div className="mt-6 space-y-3">
                  {category && (
                    <div className="flex items-center gap-3 text-sm">
                      <Layers className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="text-neutral-500">Category:</span>
                      <Link href={`/en/category/${category.id}`} className="font-medium text-neutral-700 hover:text-neutral-900 transition-colors">
                        {categoryTitle}
                      </Link>
                    </div>
                  )}
                  {subcategory && (
                    <div className="flex items-center gap-3 text-sm">
                      <Package className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="text-neutral-500">Subcategory:</span>
                      <Link href={`/en/subcategory/${subcategory.id}`} className="font-medium text-neutral-700 hover:text-neutral-900 transition-colors">
                        {subcategoryTitle}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="h-4 w-4 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500">Product Code:</span>
                    <span className="font-mono text-neutral-700">{product["Document ID"] || product.objectid}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-neutral-500">Availability:</span>
                    <span className="font-medium text-emerald-600">In Stock</span>
                  </div>
                </div>

                {/* Call Button */}
                <div className="mt-6 pt-6 border-t border-neutral-200/60">
                  <p className="text-sm text-neutral-500 mb-3">Have questions? Call us:</p>
                  <a
                    href="tel:+359894352204"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    +359 894 352 204
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <ProductReviewsSection productId={product["Document ID"] || product.objectid} isEnglish={true} />

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="py-12 md:py-16 border-t border-neutral-200/60">
            <div className="container mx-auto px-4">
              <div className="mb-10">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Similar Products</h2>
                <p className="text-neutral-500 mt-1.5 text-sm">
                  Browse other products from this category
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {similarProducts.map((similarProd) => (
                <ProductCard
                  key={similarProd["Document ID"] || similarProd.objectid}
                  id={similarProd["Document ID"] || similarProd.objectid}
                  title={similarProd.title_en || similarProd.title}
                  description={similarProd.description_en || similarProd.description}
                  price={Number(similarProd.price) || 0}
                  retailerprice={Number(similarProd.retailerprice)}
                  wholesalerprice={Number(similarProd.wholesalerprice)}
                  europe_price={Number(similarProd.europe_price)}
                  price_eur={similarProd.price_eur ? Number(similarProd.price_eur) : null}
                  retailerprice_eur={similarProd.retailerprice_eur ? Number(similarProd.retailerprice_eur) : null}
                  wholesalerprice_eur={similarProd.wholesalerprice_eur ? Number(similarProd.wholesalerprice_eur) : null}
                  europe_price_eur={similarProd.europe_price_eur ? Number(similarProd.europe_price_eur) : null}
                  photourl={similarProd.photourl}
                  isLoggedIn={isUserLoggedIn}
                  customerType={user?.customerType}
                  isEnglish={true}
                  />
                ))}
              </div>
              {category && (
                <div className="mt-10 text-center">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl border-neutral-300 hover:bg-neutral-100 text-neutral-700 bg-transparent px-8 py-3 font-medium"
                  >
                    <Link href={`/en/category/${category.id}`}>View all products in {categoryTitle} category</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        <SiteFooter categories={englishCategories} isEnglish={true} />

          {/* Compare Floating Button - Mobile only */}
          <CompareFloatingButton
            product={{
              id: product["Document ID"] || product.objectid,
              title: displayTitle,
              price: priceToDisplay !== null ? priceToDisplay : 0,
              photourl: product.photourl,
              description: displayDescription,
              categoryTitle: categoryTitle,
              subcategoryTitle: subcategoryTitle,
            }}
            isEnglish={true}
          />

          {/* Sticky Buy Button - Mobile only */}
          <StickyBuyButton
            productId={product["Document ID"] || product.objectid}
            productTitle={displayTitle}
            productPrice={priceToDisplay !== null ? priceToDisplay : 0}
            photoUrl={product.photourl}
            promo_buy_qty={finalPromoBuyQty}
            promo_free_qty={finalPromoFreeQty}
            disabled={priceToDisplay === null}
            isEnglish={true}
          />
        </div>
      </>
    )
  } catch (error) {
    console.error("Error loading product page:", error)
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl border border-neutral-200/60 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-red-600 mb-3">Error loading product</h1>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            There was a problem loading the information for this product. Please try again later.
          </p>
          <Button asChild className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3">
            <Link href="/en">Back to homepage</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function EnglishProductPage({ params }: ProductPageProps) {
  const { id } = await params
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full border-2 border-neutral-200 border-t-neutral-600 animate-spin mx-auto mb-4" />
            <p className="text-neutral-500 text-sm">Loading product...</p>
          </div>
        </div>
      }
    >
      <ProductContent productId={id} />
    </Suspense>
  )
}
