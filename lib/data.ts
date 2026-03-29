import { sql } from "@/lib/db"

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Utility function for retrying database operations
async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(`Database operation failed (attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error)

    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return retryOperation(operation, retries - 1)
    }

    throw error
  }
}

// Product interfaces
export interface Product {
  objectid: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  price: string
  retailerprice?: string
  wholesalerprice?: string
  europe_price?: string
  photourl?: string
  cateid?: string
  subcateid?: string
  createdat?: string
  deleted: boolean
  promo_buy_qty?: number
  promo_free_qty?: number
  promo_description?: string
}

export interface Category {
  id: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  photourl?: string
  // SEO fields
  seo_meta_title?: string
  seo_meta_title_bg?: string
  seo_meta_description?: string
  seo_meta_description_bg?: string
  seo_meta_keywords?: string
  seo_meta_keywords_bg?: string
  seo_og_title?: string
  seo_og_title_bg?: string
  seo_og_description?: string
  seo_og_description_bg?: string
  seo_og_image?: string
  seo_twitter_card?: string
  seo_twitter_title?: string
  seo_twitter_description?: string
  seo_twitter_image?: string
  seo_canonical_url?: string
  seo_robots?: string
  seo_schema_type?: string
  seo_focus_keyword?: string
  seo_secondary_keywords?: string
}

export interface Subcategory {
  id: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  photourl?: string
  cateid: string
  // SEO fields
  seo_meta_title?: string
  seo_meta_title_bg?: string
  seo_meta_description?: string
  seo_meta_description_bg?: string
  seo_meta_keywords?: string
  seo_meta_keywords_bg?: string
  seo_og_title?: string
  seo_og_title_bg?: string
  seo_og_description?: string
  seo_og_description_bg?: string
  seo_og_image?: string
  seo_twitter_card?: string
  seo_twitter_title?: string
  seo_twitter_description?: string
  seo_twitter_image?: string
  seo_canonical_url?: string
  seo_robots?: string
  seo_schema_type?: string
  seo_focus_keyword?: string
  seo_secondary_keywords?: string
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[]
}

// Utility functions for language transformation
export function transformCategoriesToBulgarian(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    title: category.title, // Assuming original 'title' is Bulgarian
    description: category.description, // Assuming original 'description' is Bulgarian
  }))
}

export function transformCategoriesToEnglish(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    title: category.title_en || category.title, // Use English title if available, otherwise fallback to Bulgarian
    description: category.description_en || category.description, // Use English description if available
  }))
}

export async function fetchCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
  return retryOperation(async () => {
    console.log(`[fetchCategoriesWithSubcategories] Fetching categories with subcategories`)

    // First get all categories
    const categories = await getCategories()

    // Then get all subcategories
    const allSubcategories = await getSubcategories()

    // Group subcategories by category ID
    const categoriesWithSubcategories: CategoryWithSubcategories[] = categories.map((category) => ({
      ...category,
      subcategories: allSubcategories.filter((sub) => sub.cateid === category.id),
    }))

    console.log(
      `[fetchCategoriesWithSubcategories] Found ${categoriesWithSubcategories.length} categories with subcategories`,
    )

    return categoriesWithSubcategories
  })
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | null> {
  return retryOperation(async () => {
    console.log(`[getProductById] Fetching product with ID: ${id}`)

    const result = await sql`
      SELECT 
        "Document ID" as objectid,
        title,
        title_en,
        description,
        description_en,
        price,
        retailerprice,
        wholesalerprice,
        europe_price,
        photourl,
        cateid,
        subcateid,
        createdat,
        deleted
      FROM new_products 
      WHERE "Document ID" = ${id} AND deleted = false
    `

    const product = result[0] || null
    console.log(`[getProductById] Found product:`, product ? `${product.title} (${product.objectid})` : "null")

    return product
  })
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  return retryOperation(async () => {
    console.log(`[getCategoryById] Fetching category with ID: ${id}`)

    const result = await sql`
      SELECT 
        "Document ID" as id,
        title,
        title_en,
        description,
        description_en,
        photourl,
        seo_meta_title,
        seo_meta_title_bg,
        seo_meta_description,
        seo_meta_description_bg,
        seo_meta_keywords,
        seo_meta_keywords_bg,
        seo_og_title,
        seo_og_title_bg,
        seo_og_description,
        seo_og_description_bg,
        seo_og_image,
        seo_twitter_card,
        seo_twitter_title,
        seo_twitter_description,
        seo_twitter_image,
        seo_canonical_url,
        seo_robots,
        seo_schema_type,
        seo_focus_keyword,
        seo_secondary_keywords
      FROM categories 
      WHERE "Document ID" = ${id}
    `

    const category = result[0] || null
    console.log(`[getCategoryById] Found category:`, category ? `${category.title} (${category.id})` : "null")

    return category
  })
}

// Get subcategory by ID
export async function getSubcategoryById(id: string): Promise<Subcategory | null> {
  return retryOperation(async () => {
    console.log(`[getSubcategoryById] Fetching subcategory with ID: ${id}`)

    const result = await sql`
      SELECT 
        "Document ID" as id,
        title,
        title_en,
        description,
        description_en,
        photourl,
        cateid,
        seo_meta_title,
        seo_meta_title_bg,
        seo_meta_description,
        seo_meta_description_bg,
        seo_meta_keywords,
        seo_meta_keywords_bg,
        seo_og_title,
        seo_og_title_bg,
        seo_og_description,
        seo_og_description_bg,
        seo_og_image,
        seo_twitter_card,
        seo_twitter_title,
        seo_twitter_description,
        seo_twitter_image,
        seo_canonical_url,
        seo_robots,
        seo_schema_type,
        seo_focus_keyword,
        seo_secondary_keywords
      FROM subcategories 
      WHERE "Document ID" = ${id}
    `

    const subcategory = result[0] || null
    console.log(
      `[getSubcategoryById] Found subcategory:`,
      subcategory ? `${subcategory.title} (${subcategory.id})` : "null",
    )

    return subcategory
  })
}

// Get products by category
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return retryOperation(async () => {
    console.log(`[getProductsByCategory] Fetching products for category: ${categoryId}`)

    const result = await sql`
      SELECT 
        "Document ID" as objectid,
        title,
        title_en,
        description,
        description_en,
        price,
        retailerprice,
        wholesalerprice,
        europe_price,
        photourl,
        cateid,
        subcateid,
        createdat,
        deleted
      FROM new_products 
      WHERE cateid = ${categoryId} AND deleted = false
      ORDER BY title
    `

    console.log(`[getProductsByCategory] Found ${result.length} products for category ${categoryId}`)

    return result || []
  })
}

// Get subcategories by category ID
export async function getSubcategories(categoryId?: string): Promise<Subcategory[]> {
  return retryOperation(async () => {
    console.log(`[getSubcategories] Fetching subcategories${categoryId ? ` for category: ${categoryId}` : " (all)"}`)

    const result = categoryId
      ? await sql`
          SELECT 
            "Document ID" as id,
            title,
            title_en,
            description,
            description_en,
            photourl,
            cateid,
            deleted,
            seo_meta_title,
            seo_meta_title_bg,
            seo_meta_description,
            seo_meta_description_bg,
            seo_og_title,
            seo_og_title_bg,
            seo_og_image
          FROM subcategories 
          WHERE cateid = ${categoryId} AND deleted = false
          ORDER BY title
        `
      : await sql`
          SELECT 
            "Document ID" as id,
            title,
            title_en,
            description,
            description_en,
            photourl,
            cateid,
            deleted,
            seo_meta_title,
            seo_meta_title_bg,
            seo_meta_description,
            seo_meta_description_bg,
            seo_og_title,
            seo_og_title_bg,
            seo_og_image
          FROM subcategories 
          WHERE deleted = false
          ORDER BY title
        `

    console.log(`[getSubcategories] Found ${result.length} subcategories`)

    return result || []
  })
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  return retryOperation(async () => {
    console.log(`[getCategories] Fetching all categories`)

    const result = await sql`
      SELECT 
        "Document ID" as id,
        title,
        title_en,
        description,
        description_en,
        photourl
      FROM categories 
      ORDER BY title
    `

    console.log(`[getCategories] Found ${result.length} categories`)

    return result || []
  })
}

// Search products
export async function searchProducts(query: string, limit = 20): Promise<Product[]> {
  return retryOperation(async () => {
    console.log(`[searchProducts] Searching for: "${query}" (limit: ${limit})`)

    const searchTerm = `%${query.toLowerCase()}%`

    const result = await sql`
      SELECT 
        "Document ID" as objectid,
        title,
        title_en,
        description,
        description_en,
        price,
        retailerprice,
        wholesalerprice,
        europe_price,
        photourl,
        cateid,
        subcateid,
        createdat,
        deleted
      FROM new_products 
      WHERE deleted = false 
        AND (
          LOWER(title) LIKE ${searchTerm} 
          OR LOWER(title_en) LIKE ${searchTerm}
          OR LOWER(description) LIKE ${searchTerm}
          OR LOWER(description_en) LIKE ${searchTerm}
        )
      ORDER BY 
        CASE 
          WHEN LOWER(title) LIKE ${`%${query.toLowerCase()}%`} THEN 1
          WHEN LOWER(title_en) LIKE ${`%${query.toLowerCase()}%`} THEN 2
          ELSE 3
        END,
        title
      LIMIT ${limit}
    `

    console.log(`[searchProducts] Found ${result.length} products matching "${query}"`)

    return result || []
  })
}

// Get products by subcategory
export async function getProductsBySubcategory(subcategoryId: string): Promise<Product[]> {
  return retryOperation(async () => {
    console.log(`[getProductsBySubcategory] Fetching products for subcategory: ${subcategoryId}`)

    const result = await sql`
      SELECT 
        "Document ID" as objectid,
        title,
        title_en,
        description,
        description_en,
        price,
        retailerprice,
        wholesalerprice,
        europe_price,
        photourl,
        cateid,
        subcateid,
        createdat,
        deleted
      FROM new_products 
      WHERE subcateid = ${subcategoryId} AND deleted = false
      ORDER BY title
    `

    console.log(`[getProductsBySubcategory] Found ${result.length} products for subcategory ${subcategoryId}`)

    return result || []
  })
}

// Get featured products
export async function getFeaturedProducts(limit = 16): Promise<Product[]> {
  return retryOperation(async () => {
    console.log(`[getFeaturedProducts] Fetching ${limit} featured products`)

    const result = await sql`
      SELECT 
        "Document ID" as objectid,
        title,
        title_en,
        description,
        description_en,
        price,
        retailerprice,
        wholesalerprice,
        europe_price,
        photourl,
        cateid,
        subcateid,
        createdat,
        deleted
      FROM new_products 
      WHERE deleted = false
      ORDER BY RANDOM()
      LIMIT ${limit}
    `

    console.log(`[getFeaturedProducts] Found ${result.length} featured products`)

    return result || []
  })
}

// Get related products
export async function getRelatedProducts(categoryId: string, currentProductId: string, limit = 4): Promise<Product[]> {
  return retryOperation(async () => {
    console.log(
      `[getRelatedProducts] Fetching ${limit} related products for category ${categoryId}, excluding product ${currentProductId}`,
    )

    const result = await sql`
      SELECT 
        "Document ID" as objectid,
        title,
        title_en,
        description,
        description_en,
        price,
        retailerprice,
        wholesalerprice,
        europe_price,
        photourl,
        cateid,
        subcateid,
        createdat,
        deleted
      FROM new_products 
      WHERE cateid = ${categoryId} 
        AND "Document ID" != ${currentProductId} 
        AND deleted = false
      ORDER BY RANDOM()
      LIMIT ${limit}
    `

    console.log(`[getRelatedProducts] Found ${result.length} related products`)

    return result || []
  })
}
