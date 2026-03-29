import { NextResponse } from "next/server"
import { executeQueryWithRetry, dbInitialized } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

// Helper to get the site base URL - ALWAYS use production domain for Meta feeds
// This ensures product links in Facebook ads always point to the production site
function getSiteUrl(): string {
  // ALWAYS use the production domain for Meta product feeds
  // This is critical because these URLs appear in Facebook/Instagram ads
  // DO NOT use environment variables here as they may contain preview URLs
  return "https://www.madiks.bg"
}

// Convert BGN to EUR (1 EUR = 1.96 BGN)
function convertBgnToEur(bgnPrice: number): string {
  return (bgnPrice / 1.96).toFixed(2)
}

// Escape XML special characters
function escapeXml(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Meta Product Catalog Feed (XML/RSS format)
 * 
 * This endpoint generates an XML feed compatible with Meta Business Suite / Commerce Manager.
 * 
 * Usage in Meta Business Suite:
 * 1. Go to Commerce Manager > Catalog > Data Sources
 * 2. Add Data Feed > Scheduled Feed
 * 3. Enter URL: https://www.madiks.bg/api/meta-product-feed
 * 4. Set schedule (e.g., every hour or daily)
 * 
 * Supports optional query parameters:
 * - ?format=csv  - Returns CSV format instead of XML
 * - ?currency=EUR - Prices in EUR (default: BGN)
 */
export async function GET(request: Request) {
  try {
    console.log("[v0] META FEED: Starting. dbInitialized:", dbInitialized, "DATABASE_URL set:", !!process.env.DATABASE_URL)

    if (!dbInitialized || !process.env.DATABASE_URL) {
      console.log("[v0] META FEED: DB not initialized, returning empty feed")
      return new NextResponse(generateEmptyXml(), {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get("format") || "xml"
    const currency = url.searchParams.get("currency")?.toUpperCase() || "BGN"
    const siteUrl = getSiteUrl()

    console.log("[v0] META FEED: Fetching products from DB...")

    // Fetch all active products - simple query first to avoid column issues
    const products = await executeQueryWithRetry(`
      SELECT 
        p.objectid,
        p.title,
        p.description,
        p.price,
        p.retailerprice,
        p.photourl,
        p.cateid,
        p.subcateid,
        c.title as category_name,
        s.title as subcategory_name
      FROM new_products p
      LEFT JOIN categories c ON p.cateid = c."Document ID"
      LEFT JOIN subcategories s ON p.subcateid = s."Document ID"
      WHERE (p.deleted = false OR p.deleted IS NULL)
        AND p.price IS NOT NULL
        AND p.title IS NOT NULL
      ORDER BY p.title ASC
    `)

    console.log("[v0] META FEED: Query returned", products?.length || 0, "products")

    if (!products || products.length === 0) {
      if (format === "csv") {
        return new NextResponse("id,title,description,availability,condition,price,link,image_link,brand\n", {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=meta-product-feed.csv",
          },
        })
      }
      return new NextResponse(generateEmptyXml(), {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      })
    }

    if (format === "csv") {
      return generateCsvResponse(products, siteUrl, currency)
    }

    return generateXmlResponse(products, siteUrl, currency)
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.error("[v0] META FEED ERROR:", errorMsg, error?.stack)
    // Return error details as XML comment for debugging
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>Madiks Groundbaits - Product Feed</title>
  <link rel="self" href="https://www.madiks.bg/api/meta-product-feed"/>
  <updated>${new Date().toISOString()}</updated>
  <!-- Feed Error: ${escapeXml(errorMsg)} -->
</feed>`
    return new NextResponse(errorXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    })
  }
}

function generateEmptyXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>Madiks Groundbaits - Product Feed</title>
  <link rel="self" href="https://www.madiks.bg/api/meta-product-feed"/>
  <updated>${new Date().toISOString()}</updated>
</feed>`
}

function generateXmlResponse(products: any[], siteUrl: string, currency: string): NextResponse {
  const items = products.map((product) => {
    const productId = product.objectid
    const price = Number(product.price) || 0
    const displayPrice = currency === "EUR" ? convertBgnToEur(price) : price.toFixed(2)
    const displayCurrency = currency === "EUR" ? "EUR" : "BGN"
    
    // Build product URL - using objectid for the product page
    const productUrl = `${siteUrl}/product/${encodeURIComponent(productId)}`
    
    // Build image URL
    let imageUrl = product.photourl || ""
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${siteUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
    }

    // Build category path: "Category > Subcategory"
    const categoryParts: string[] = []
    if (product.category_name) categoryParts.push(product.category_name)
    if (product.subcategory_name) categoryParts.push(product.subcategory_name)
    const productType = categoryParts.join(" > ") || "Риболовни принадлежности"

    // Build description - use description or fall back to title
    const description = product.description || product.title || ""
    // Meta requires description to be between 1-9999 characters
    const truncatedDescription = description.substring(0, 9999)

    return `  <entry>
    <g:id>${escapeXml(productId)}</g:id>
    <g:title>${escapeXml(product.title)}</g:title>
    <g:description>${escapeXml(truncatedDescription)}</g:description>
    <g:link>${escapeXml(productUrl)}</g:link>
    <g:image_link>${escapeXml(imageUrl)}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:price>${displayPrice} ${displayCurrency}</g:price>
    <g:condition>new</g:condition>
    <g:brand>Madiks</g:brand>
    <g:product_type>${escapeXml(productType)}</g:product_type>
    <g:google_product_category>3379</g:google_product_category>
    <g:custom_label_0>${escapeXml(product.category_name || "")}</g:custom_label_0>
    <g:custom_label_1>${escapeXml(product.subcategory_name || "")}</g:custom_label_1>
  </entry>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>Madiks Groundbaits - Product Feed</title>
  <link rel="self" href="${siteUrl}/api/meta-product-feed"/>
  <updated>${new Date().toISOString()}</updated>
${items.join("\n")}
</feed>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}

function generateCsvResponse(products: any[], siteUrl: string, currency: string): NextResponse {
  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "product_type",
    "google_product_category",
    "custom_label_0",
    "custom_label_1",
  ]

  const rows = products.map((product) => {
    const productId = product.objectid
    const price = Number(product.price) || 0
    const displayPrice = currency === "EUR" ? convertBgnToEur(price) : price.toFixed(2)
    const displayCurrency = currency === "EUR" ? "EUR" : "BGN"
    
    const productUrl = `${siteUrl}/product/${encodeURIComponent(productId)}`

    let imageUrl = product.photourl || ""
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${siteUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
    }

    const categoryParts: string[] = []
    if (product.category_name) categoryParts.push(product.category_name)
    if (product.subcategory_name) categoryParts.push(product.subcategory_name)
    const productType = categoryParts.join(" > ") || "Риболовни принадлежности"

    const description = (product.description || product.title || "").substring(0, 9999)

    return [
      csvEscape(productId),
      csvEscape(product.title),
      csvEscape(description),
      "in stock",
      "new",
      `${displayPrice} ${displayCurrency}`,
      csvEscape(productUrl),
      csvEscape(imageUrl),
      "Madiks",
      csvEscape(productType),
      "3379",
      csvEscape(product.category_name || ""),
      csvEscape(product.subcategory_name || ""),
    ].join(",")
  })

  const csv = [headers.join(","), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=meta-product-feed.csv",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}

function csvEscape(value: string | null | undefined): string {
  if (!value) return '""'
  const str = String(value)
  // If the value contains commas, quotes, or newlines, wrap in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}
