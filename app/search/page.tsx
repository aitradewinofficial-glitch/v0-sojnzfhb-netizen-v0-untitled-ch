import Link from "next/link"
import { ChevronRight, Search, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCategories, getSubcategories, searchProducts, getBatchProductRatings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { ProductCard } from "@/components/product-card"
import { getUser } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default async function SearchPage({ searchParams }: { searchParams: { q: string } }) {
  const query = searchParams.q || ""
  const products = query ? await searchProducts(query) : []
  const categories = await getCategories()
  const allSubcategories = await getSubcategories()
  
  // Fetch ratings for all products
  const productIds = (products || []).map((p) => p.objectid)
  const ratingsMap = await getBatchProductRatings(productIds)

  // Извличане на информация за потребителя - същата логика като на home page
  const user = await getUser()
  const isLoggedIn = !!user
  const userRole = user?.role || null

  // Функция за определяне дали продуктът е нов (създаден през последните 14 дни)
  const isNewProduct = (createdAt: string) => {
    if (!createdAt) return false
    const productDate = new Date(createdAt)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return productDate > twoWeeksAgo
  }

  // Функция за генериране на случайна отстъпка за някои продукти - същата като на home page
  const getRandomDiscount = () => {
    // 20% от продуктите ще имат отстъпка
    if (Math.random() < 0.2) {
      // Отстъпки между 5% и 30%
      return Math.floor(Math.random() * 26) + 5
    }
    return 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Using the same components as home page */}
      <SiteHeader categories={categories} subcategories={allSubcategories} />
      <CategoriesNavbar categories={categories} subcategories={allSubcategories} isEnglish={false} />

      {/* Search Header with improved design */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-yellow-400 transition-colors">
              Начало
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-yellow-400">Търсене</span>
            {query && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-white">{query}</span>
              </>
            )}
          </div>

          {/* Search Title and Stats */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {query ? `Резултати за "${query}"` : "Търсене на продукти"}
            </h1>
            {query && products.length > 0 && (
              <p className="text-gray-300">
                Намерени <span className="text-yellow-400 font-semibold">{products.length}</span> продукта
              </p>
            )}
          </div>

          {/* Search Form */}
          <form action="/search" className="max-w-3xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                name="q"
                placeholder="Търсете продукти, категории или марки..."
                defaultValue={query}
                className="w-full px-6 py-4 pl-14 pr-32 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full px-6"
              >
                Търси
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {query ? (
            <>
              {products.length > 0 ? (
                <>
                  {/* Results Grid */}
                  <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {products.map((product) => {
                      const rating = ratingsMap.get(product.objectid)
                      return (
                        <ProductCard
                          key={product.objectid}
                          id={product.objectid}
                          title={product.title}
                          description={product.description}
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
                          averageRating={rating?.average_rating}
                          reviewCount={rating?.review_count}
                        />
                      )
                    })}
                  </div>

                  {/* Load More Button */}
                  {products.length >= 12 && (
                    <div className="text-center mt-12">
                      <Button variant="outline" size="lg" className="border-gray-300 hover:border-gray-400">
                        Зареди още продукти
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* No Results State */
                <div className="max-w-2xl mx-auto text-center py-16">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Няма намерени продукти</h3>
                    <p className="text-gray-600 mb-8">
                      Не намерихме продукти, съответстващи на вашето търсене за "{query}".
                      <br />
                      Опитайте с други ключови думи или разгледайте нашите категории.
                    </p>

                    {/* Suggestions */}
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 font-medium">Предложения:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                          Въдици
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                          Макари
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                          Куки
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                          Примамки
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    <div className="flex gap-4 justify-center">
                      <Button asChild className="bg-red-600 hover:bg-red-700">
                        <Link href="/">Към началната страница</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/categories">Разгледай категориите</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty Search State */
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Започнете вашето търсене</h3>
                <p className="text-gray-600 mb-8">
                  Въведете ключова дума в полето за търсене по-горе,
                  <br />
                  за да намерите продуктите, които търсите.
                </p>

                {/* Popular Categories */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 font-medium">Популярни категории:</p>
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {categories.slice(0, 4).map((category) => (
                      <Link
                        key={category.cateid}
                        href={`/category/${category.cateid}`}
                        className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 transition-colors"
                      >
                        {category.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
