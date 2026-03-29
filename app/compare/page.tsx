import type { Metadata } from "next"
import { getCategories, getSubcategories } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { ComparePageClient } from "@/components/compare-page-client"

export const metadata: Metadata = {
  title: "Сравни продукти | Мадикс Граундбейтс",
  description: "Сравнете продуктите, които сте избрали, за да направите най-добрия избор.",
}

export default async function ComparePage() {
  const categories = await getCategories().catch(() => [])
  const subcategories = await getSubcategories().catch(() => [])
  const user = await getUser().catch(() => null)
  const isUserLoggedIn = !!user

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader
        categories={categories}
        subcategories={subcategories}
        isLoggedIn={isUserLoggedIn}
        userName={user?.name || user?.storeName || ""}
      />

      <CategoriesNavbar categories={categories} subcategories={subcategories} isEnglish={false} />

      <ComparePageClient />

      <SiteFooter categories={categories || []} isEnglish={false} />
    </div>
  )
}
