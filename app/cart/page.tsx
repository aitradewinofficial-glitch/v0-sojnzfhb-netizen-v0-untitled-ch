import { SiteHeader } from "@/components/site-header"
import { getCategories, getSubcategories } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { CartContent } from "@/components/cart-content"
import { SiteFooter } from "@/components/site-footer"
import { StickyBottomNav } from "@/components/sticky-bottom-nav"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CartPage() {
  // Fetch necessary data
  const categories = await getCategories()
  const subcategories = await getSubcategories()
  const user = await getUser()
  const isUserLoggedIn = !!user

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800 pb-20 md:pb-0">
      <SiteHeader
        categories={categories}
        subcategories={subcategories}
        isLoggedIn={isUserLoggedIn}
        userName={user?.name || user?.storeName || ""}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <CartContent />
      </main>
      <SiteFooter categories={categories || []} isEnglish={false} />

      {/* Sticky Bottom Navigation - Mobile only */}
      <StickyBottomNav isEnglish={false} />
    </div>
  )
}
