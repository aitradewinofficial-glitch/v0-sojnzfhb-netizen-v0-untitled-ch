import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { TrendingUp, Award, Gift, Globe, ArrowRight } from "lucide-react"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { Button } from "@/components/ui/button"
import { getCategories, getSubcategories, getHeroBanners, getBatchProductRatings, getNews, getSeoSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { ProductCard } from "@/components/product-card"
import { HolidayBanner } from "@/components/holiday-banner"
import { HeroBannerCarousel } from "@/components/hero-banner-carousel"
import { StickyBottomNav } from "@/components/sticky-bottom-nav"
import { NewsSection } from "@/components/news-section"

// Маркираме страницата като динамична
export const dynamic = "force-dynamic"

// Dynamic SEO metadata from database
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings("homepage")
  
  const defaultMetadata: Metadata = {
    title: "Мадикс Граундбейтс - Професионални риболовни принадлежности",
    description: "Най-голямата фабрика за захранки в България. Висококачествени риболовни продукти от 1995 година.",
  }

  if (!seo) return defaultMetadata

  return {
    title: seo.meta_title || defaultMetadata.title,
    description: seo.meta_description || defaultMetadata.description,
    keywords: seo.meta_keywords?.split(",").map((k: string) => k.trim()),
    authors: seo.author ? [{ name: seo.author }] : undefined,
    robots: seo.robots || "index, follow",
    alternates: {
      canonical: seo.canonical_url || undefined,
      languages: {
        "bg": seo.hreflang_bg || undefined,
        "en": seo.hreflang_en || undefined,
      },
    },
    openGraph: {
      title: seo.og_title || seo.meta_title || undefined,
      description: seo.og_description || seo.meta_description || undefined,
      url: seo.og_url || undefined,
      siteName: seo.og_site_name || undefined,
      locale: seo.og_locale || "bg_BG",
      type: (seo.og_type as "website" | "article") || "website",
      images: seo.og_image ? [
        {
          url: seo.og_image,
          width: seo.og_image_width || 1200,
          height: seo.og_image_height || 630,
        },
      ] : undefined,
    },
    twitter: {
      card: (seo.twitter_card as "summary_large_image" | "summary") || "summary_large_image",
      title: seo.twitter_title || seo.og_title || seo.meta_title || undefined,
      description: seo.twitter_description || seo.og_description || seo.meta_description || undefined,
      images: seo.twitter_image ? [seo.twitter_image] : seo.og_image ? [seo.og_image] : undefined,
      site: seo.twitter_site || undefined,
      creator: seo.twitter_creator || undefined,
    },
    verification: {
      google: seo.google_site_verification || undefined,
      yandex: seo.yandex_verification || undefined,
      other: seo.bing_site_verification ? { "msvalidate.01": seo.bing_site_verification } : undefined,
    },
    other: {
      "theme-color": seo.theme_color || "#f59e0b",
    },
  }
}

export default async function Home() {
  const locale = "bg" // Bulgarian locale

  // Fetch data from the database
  const categories = await getCategories()
  const allSubcategories = await getSubcategories()
  const heroBanners = await getHeroBanners()
  const newsItems = await getNews(true) // Get only active news
  const seoSettings = await getSeoSettings("homepage")

  // Generate JSON-LD structured data
  const jsonLd = seoSettings ? {
    "@context": "https://schema.org",
    "@type": seoSettings.schema_type || "Organization",
    "name": seoSettings.schema_name || "Мадикс Граундбейтс",
    "description": seoSettings.schema_description || seoSettings.meta_description,
    "url": seoSettings.og_url || seoSettings.canonical_url,
    "logo": seoSettings.schema_logo,
    "telephone": seoSettings.schema_telephone,
    "email": seoSettings.schema_email,
    ...(seoSettings.schema_street_address || seoSettings.schema_address_locality ? {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": seoSettings.schema_street_address,
        "addressLocality": seoSettings.schema_address_locality,
        "addressRegion": seoSettings.schema_address_region,
        "postalCode": seoSettings.schema_postal_code,
        "addressCountry": seoSettings.schema_address_country || "Bulgaria",
      }
    } : {}),
    ...(seoSettings.schema_same_as && seoSettings.schema_same_as.length > 0 ? {
      "sameAs": seoSettings.schema_same_as
    } : {}),
  } : null

  // Извличане на информация за потребителя
  const user = await getUser()
  const isLoggedIn = !!user
  const userRole = user?.role || null

  // Calculate products for exactly 4 rows on desktop (lg breakpoint has 4 columns)
  const desktopColumns = 4
  const numberOfRows = 4
  const totalProducts = desktopColumns * numberOfRows // 16 products for 4 rows on desktop

  // Извличане на точно определен брой произволни продукта за 4 реда на десктоп
  const featuredProducts = await sql`
SELECT 
objectid as id, 
title, 
description, 
price, 
retailerprice, 
wholesalerprice,
europe_price,
price_eur,
retailerprice_eur,
wholesalerprice_eur,
europe_price_eur,
photourl,
createdat
FROM new_products
WHERE deleted = false
ORDER BY RANDOM()
LIMIT ${totalProducts}
`

  // Fetch ratings for all featured products
  const productIds = (featuredProducts || []).map((p) => p.id)
  const ratingsMap = await getBatchProductRatings(productIds)

  // Извличане на продукти за всяка категория, за да вземем снимки
  const categoryProductsMap = new Map()

  for (const category of categories || []) {
    try {
      const products = await sql`
SELECT objectid, photourl
FROM new_products
WHERE cateid = ${category.id} AND photourl IS NOT NULL AND photourl != ''
LIMIT 1
`
      if (products.length > 0) {
        categoryProductsMap.set(category.id, products[0].photourl)
      }
    } catch (error) {
      console.error(`Error fetching products for category ${category.id}:`, error)
    }
  }

  // Проверяваме дали потребителят е логнат
  const isUserLoggedIn = !!user

  // Функция за избор на подходяща снимка според категорията
  const getCategoryImage = (category: { id: string; title: string; photourl?: string }) => {
    // Първо проверяваме дали имаме снимка на продукт от тази категория
    const productImage = categoryProductsMap.get(category.id)
    if (productImage) return productImage

    // Ако имаме снимка на категорията, използваме нея
    if (category.photourl) return category.photourl

    // Съпоставяме категориите със съответните изображения
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

    // Връщаме специфично изображение ако има съвпадение, иначе използваме общо
    return categoryImages[category.title] || "/images/category-default.png"
  }

  // Функция за определяне дали продуктът е нов (създаден през последните 14 дни)
  const isNewProduct = (createdAt: string) => {
    const productDate = new Date(createdAt)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return productDate > twoWeeksAgo
  }

  // Функция за генериране на случайна отстъпка за някои продукти
  const getRandomDiscount = () => {
    // 20% от продуктите ще имат отстъпка
    if (Math.random() < 0.2) {
      // Отстъпки между 5% и 30%
      return Math.floor(Math.random() * 26) + 5
    }
    return 0
  }

return (
  <>
    {/* JSON-LD Structured Data */}
    {jsonLd && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    )}
    
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col pb-20 md:pb-0">
      <HolidayBanner />

      {/* Header */}
      <SiteHeader categories={categories || []} subcategories={allSubcategories || []} />

      {/* Динамична лента с категории, която се обновява при всяко зареждане */}
      <CategoriesNavbar categories={categories || []} subcategories={allSubcategories || []} isEnglish={false} />

      {/* Main content - flex-1 to push footer to bottom */}
      <main className="flex-1">
        {/* Hero Banner Carousel - Apple-style, image only */}
        <div className="group">
          <HeroBannerCarousel banners={heroBanners} autoPlayInterval={5000} />
        </div>

        {/* Stats Section - standalone below carousel */}
        <section className="bg-gray-900">
          <div className="container mx-auto py-5 sm:py-7 px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">30</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">Години опит</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">1000+</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">Продукта</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">{"2М+"}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">Доволни клиенти годишно</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">10+</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">Страни за износ</p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section - Препоръчани продукти */}
        <section className="py-12 sm:py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-gray-800">
                  Препоръчани продукти
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
                  Открийте нашата селекция от висококачествени риболовни продукти, специално подбрани за вас
                </p>
              </div>
            </div>

            {/* Products grid - Оптимизиран за точно 4 реда на десктоп */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {(featuredProducts || []).map((product) => {
                const rating = ratingsMap.get(product.id)
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title || "Продукт"}
                    description={product.description || ""}
                    price={product.price}
                    retailerprice={product.retailerprice}
                    wholesalerprice={product.wholesalerprice}
                    europe_price={product.europe_price}
                    price_eur={product.price_eur}
                    retailerprice_eur={product.retailerprice_eur}
                    wholesalerprice_eur={product.wholesalerprice_eur}
                    europe_price_eur={product.europe_price_eur}
                    photourl={product.photourl}
                    isLoggedIn={isLoggedIn}
                    customerType={user?.customerType}
                    discountPercent={user?.discountPercent}
                    isNew={product.createdat ? isNewProduct(product.createdat) : false}
                    discount={getRandomDiscount()}
                    isEnglish={false}
                    averageRating={rating?.average_rating}
                    reviewCount={rating?.review_count}
                  />
                )
              })}
            </div>
          </div>
        </section>

        {/* Categories - Нашите категории */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block mb-3 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700 tracking-wide uppercase">
                Каталог
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 text-balance">
                Нашите категории
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                Разгледайте нашата богата колекция от риболовни принадлежности, организирани в удобни категории
              </p>
            </div>

            {/* Categories Grid - Masonry-inspired layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {(categories || []).map((category, index) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className={`group block ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl bg-white h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                      index === 0 ? "min-h-[280px] sm:min-h-[400px]" : "min-h-[180px] sm:min-h-[240px]"
                    }`}
                  >
                    {/* Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={getCategoryImage(category) || "/placeholder.svg"}
                        alt={category.title}
                        fill
                        sizes={
                          index === 0
                            ? "(max-width: 768px) 100vw, 50vw"
                            : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        }
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 md:p-6">
                      <div className="transform transition-transform duration-500 group-hover:translate-y-0 translate-y-1">
                        <h3
                          className={`font-bold text-white mb-2 line-clamp-2 leading-tight ${
                            index === 0
                              ? "text-xl sm:text-2xl md:text-3xl"
                              : "text-sm sm:text-base md:text-lg"
                          }`}
                        >
                          {category.title}
                        </h3>
                        <div className="flex items-center gap-2 text-amber-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <span>Разгледай</span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>

                    {/* Accent corner */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-45">
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* News Section - Новини */}
        <NewsSection news={newsItems} isEnglish={false} />

        {/* Catalog Section - Каталог 2025 - Apple-inspired design */}
        <section className="py-20 sm:py-28 md:py-36 bg-black overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              {/* Headline */}
              <p className="text-amber-400 text-sm sm:text-base font-medium tracking-widest uppercase mb-4">
                Нова колекция
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight text-balance">
                Каталог 2025
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed text-pretty">
                Разгледайте нашия пълен каталог с всички продукти за 2025 година. Открийте новите артикули и специални оферти.
              </p>
              
              {/* CTA Buttons - Apple style */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <a
                  href="https://96ghfafarqg1wwmp.public.blob.vercel-storage.com/Catalog%202025%20Web.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-full text-base sm:text-lg transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2.5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Изтегли каталога
                </a>
                <a
                  href="https://96ghfafarqg1wwmp.public.blob.vercel-storage.com/Catalog%202025%20Web.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center text-amber-400 hover:text-amber-300 font-semibold text-base sm:text-lg transition-colors duration-300"
                >
                  Прегледай онлайн
                  <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
              
              {/* Decorative gradient orbs */}
              <div className="relative mt-16 sm:mt-20">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-10 left-1/3 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </section>




        {/* Legal Links Section */}
        <section className="py-6 bg-gray-200 border-t border-gray-300">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-900 underline transition-colors">
                Политика за поверителност
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/terms" className="hover:text-gray-900 underline transition-colors">
                Общи условия
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/delivery-returns" className="hover:text-gray-900 underline transition-colors">
                Доставка и връщане
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/contact" className="hover:text-gray-900 underline transition-colors">
                Контак��и
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - САМО ЕДИН ФУТЕР */}
      <SiteFooter categories={categories || []} isEnglish={false} />

      {/* Sticky Bottom Navigation - Mobile only */}
<StickyBottomNav isEnglish={false} />
    </div>
  </>
  )
}
