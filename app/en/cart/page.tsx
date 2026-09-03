import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { CartContent } from "@/components/cart-content"
import { sql } from "@vercel/postgres"
import { StickyBottomNav } from "@/components/sticky-bottom-nav"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"
export const revalidate = 0

interface Category {
  id: string
  title: string
  deleted?: boolean
}

interface Subcategory {
  id: string
  cateid: string
  title: string
}

async function getCategories(): Promise<Category[]> {
  try {
    const result = await sql`
      SELECT objectid as id, title, deleted 
      FROM categories 
      WHERE deleted = false OR deleted IS NULL
      ORDER BY title
    `
    return result.rows as Category[]
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

async function getSubcategories(): Promise<Subcategory[]> {
  try {
    const result = await sql`
      SELECT objectid as id, cateid, title 
      FROM subcategories 
      WHERE deleted = false OR deleted IS NULL
      ORDER BY title
    `
    return result.rows as Subcategory[]
  } catch (error) {
    console.error("Error fetching subcategories:", error)
    return []
  }
}

export default async function EnglishCartPage() {
  const [categories, subcategories] = await Promise.all([getCategories(), getSubcategories()])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SiteHeader categories={categories} subcategories={subcategories} isEnglish={true} />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading cart...</div>}>
          <CartContent isEnglish={true} />
        </Suspense>
      </main>

      {/* Sticky Bottom Navigation - Mobile only */}
      <StickyBottomNav isEnglish={true} />
    </div>
  )
}
