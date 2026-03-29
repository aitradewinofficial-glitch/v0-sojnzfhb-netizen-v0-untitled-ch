import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless"
import { unstable_cache as cache } from "next/cache"
import ws from "ws"

console.log("LIB/DB.TS: Module loading...")

// Конфигуриране на WebSocket
if (typeof process !== "undefined" && process.env && !process.env.NEXT_PUBLIC_VERCEL_URL) {
  neonConfig.webSocketConstructor = ws
  console.log("LIB/DB.TS: WebSocket configured with 'ws' for Node.js environment.")
} else if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = globalThis.WebSocket
  console.log("LIB/DB.TS: WebSocket configured with globalThis.WebSocket.")
} else {
  console.warn("LIB/DB.TS: WebSocket constructor could not be determined for Neon.")
}

// Конфигуриране на fetch
if (typeof fetch !== "undefined") {
  neonConfig.fetchFunction = fetch
  console.log("LIB/DB.TS: fetchFunction configured with global fetch.")
} else {
  console.warn("LIB/DB.TS: Global fetch function not available for Neon.")
}

let sql: NeonQueryFunction<false, false>
let dbInitialized = false
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error(
    "LIB/DB.TS: FATAL - DATABASE_URL is not defined in environment variables. Database operations will fail.",
  )
  sql = (async (queryText: string, params?: any[]) => {
    console.error(
      "LIB/DB.TS: Mock SQL Query - Database not initialized (DATABASE_URL missing). Query:",
      queryText,
      "Params:",
      params,
    )
    return []
  }) as any
  dbInitialized = false
} else {
  try {
    console.log("LIB/DB.TS: Attempting to initialize Neon SQL with DATABASE_URL...")
    sql = neon(DATABASE_URL)
    dbInitialized = true
    console.log("LIB/DB.TS: Database connection configured successfully with Neon.")
  } catch (error) {
    console.error("LIB/DB.TS: FATAL - Error during Neon SQL initialization:", error)
    sql = (async (queryText: string, params?: any[]) => {
      console.error(
        "LIB/DB.TS: Mock SQL Query - Database initialization failed. Query:",
        queryText,
        "Params:",
        params,
        "Error:",
        error,
      )
      return []
    }) as any
    dbInitialized = false
  }
}

console.log(`LIB/DB.TS: dbInitialized status after setup: ${dbInitialized}`)

export { dbInitialized }

export function getPool() {
  if (!dbInitialized) {
    console.warn("LIB/DB.TS: getPool - Attempted to get pool, but database is not initialized.")
    return {
      query: async (text: string, params?: any[]) => {
        console.error("LIB/DB.TS: Mock Pool Query - Database not initialized. Query:", text, "Params:", params)
        return []
      },
    }
  }
  return {
    query: async (text: string, params?: any[]) => {
      try {
        const result = await sql.query(text, params)
        return result
      } catch (error) {
        console.error("LIB/DB.TS: Pool Query Error:", error)
        throw error
      }
    },
  }
}

export async function executeQueryWithRetry(query: string, params?: any[], maxRetries = 3) {
  if (!dbInitialized) {
    console.error("LIB/DB.TS: executeQueryWithRetry - Database not initialized. Cannot execute query:", query)
    return []
  }
  let retries = 0
  const correctedQuery = query.replace(/\bproducts\b/g, "new_products")

  while (retries < maxRetries) {
    try {
      return await sql.query(correctedQuery, params)
    } catch (error) {
      retries++
      console.error(`LIB/DB.TS: Query failed (attempt ${retries}/${maxRetries}):`, correctedQuery, params, error)
      if (retries >= maxRetries) {
        console.error(`LIB/DB.TS: All ${maxRetries} attempts failed for query. Giving up.`)
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, retries)))
    }
  }
  throw new Error("LIB/DB.TS: Failed to execute query after retries (unexpected state)")
}

// Categories
export async function getCategories(skipCache = false) {
  console.log(`LIB/DB.TS: getCategories called. skipCache: ${skipCache}, dbInitialized: ${dbInitialized}`)
  async function fetchCategories() {
    if (!dbInitialized) {
      console.error("LIB/DB.TS: fetchCategories - Database not initialized. Cannot fetch categories.")
      return []
    }
    try {
      console.log("LIB/DB.TS: fetchCategories - Извличане на категории от базата данни...")
      const result = await executeQueryWithRetry(`
    SELECT "Document ID" as id, title, title_en, description, photourl, pricefrom, wholesalerpricefrom, retailerpricefrom
    FROM categories
    WHERE (deleted = false OR deleted IS NULL)
    ORDER BY title ASC
  `)
      console.log("LIB/DB.TS: fetchCategories - Намерени категории:", result.length)
      return result || []
    } catch (error) {
      console.error("LIB/DB.TS: fetchCategories - Грешка при извличане на категории:", error)
      return []
    }
  }

  if (skipCache) {
    console.log("LIB/DB.TS: getCategories - Skipping cache for categories...")
    return fetchCategories()
  }

  try {
    return await cache(fetchCategories, ["categories-list-v4"], {
      revalidate: 60, // Намалих от 300 на 60 секунди
      tags: ["categories"],
    })()
  } catch (error) {
    console.error("LIB/DB.TS: getCategories - Cache error, fetching directly:", error)
    return fetchCategories()
  }
}

export async function getCategoryById(id: string) {
  console.log(`LIB/DB.TS: getCategoryById called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getCategoryById - Database not initialized.")
    return null
  }
  if (!id) {
    console.error("LIB/DB.TS: getCategoryById - Category ID is undefined or null.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT "Document ID" as id, title, title_en, description, photourl, pricefrom, wholesalerpricefrom, retailerpricefrom
FROM categories
WHERE "Document ID" = $1 AND (deleted = false OR deleted IS NULL)
`,
      [id],
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: getCategoryById - Error fetching category ${id}:`, error)
    return null
  }
}

// Subcategories
export async function getSubcategories(categoryId?: string) {
  console.log(`LIB/DB.TS: getSubcategories called. categoryId: ${categoryId}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getSubcategories - Database not initialized.")
    return []
  }
  try {
    let query
    const params: any[] = []
    if (categoryId) {
      query = `
  SELECT "Document ID" as id, cateid, title, title_en, description, photourl, pricefrom
  FROM subcategories
  WHERE cateid = $1 AND (deleted = false OR deleted IS NULL)
  ORDER BY title ASC
`
      params.push(categoryId)
    } else {
      query = `
  SELECT "Document ID" as id, cateid, title, title_en, description, photourl, pricefrom
  FROM subcategories
  WHERE (deleted = false OR deleted IS NULL)
  ORDER BY title ASC
`
    }
    const result = await executeQueryWithRetry(query, params)
    return result
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching subcategories:", error)
    return []
  }
}

export async function getSubcategoryById(id: string) {
  console.log(`LIB/DB.TS: getSubcategoryById called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getSubcategoryById - Database not initialized.")
    return null
  }
  if (!id) {
    console.warn("LIB/DB.TS: getSubcategoryById called with undefined or null id")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT "Document ID" as id, title, title_en, cateid 
FROM subcategories 
WHERE "Document ID" = $1 AND (deleted = false OR deleted IS NULL)
`,
      [id],
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching subcategory ${id}:`, error)
    return null
  }
}

// Products
export async function getProductById(id: string) {
  console.log(`LIB/DB.TS: getProductById called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getProductById - Database not initialized.")
    return null
  }
  if (!id) {
    console.error("LIB/DB.TS: getProductById - Product ID is undefined or null.")
    return null
  }
  try {
    let result = await executeQueryWithRetry(`SELECT * FROM new_products WHERE "Document ID" = $1`, [id])
    if (result.length === 0) {
      result = await executeQueryWithRetry(`SELECT * FROM new_products WHERE objectid = $1`, [id])
    }
    if (result.length === 0 && id) {
      result = await executeQueryWithRetry(
        `SELECT * FROM new_products WHERE LOWER(title) = LOWER($1) ORDER BY createdat DESC LIMIT 1`,
        [id.toLowerCase()],
      )
    }
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching product ${id}:`, error)
    return null
  }
}

// Users
export async function getUserByEmail(email: string) {
  console.log(`LIB/DB.TS: getUserByEmail called. Email: ${email}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getUserByEmail - Database not initialized.")
    return null
  }
  if (!email) {
    console.error("LIB/DB.TS: getUserByEmail - Email is undefined or null.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT id, name, email, password, role, approval_status
FROM users
WHERE email = $1
`,
      [email],
    )
    if (result[0]) {
      const customerResult = await executeQueryWithRetry(
        `
  SELECT type, discountpercent, storename, companyname
  FROM customers
  WHERE objectid = $1 AND (deleted = false OR deleted IS NULL)
`,
        [email],
      )
      const customer = customerResult[0]
      return {
        ...result[0],
        customerType: customer?.type || null,
        discountPercent: customer?.discountpercent || 0,
        storeName: customer?.storename || null,
        companyName: customer?.companyname || null,
      }
    }
    return null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching user with email ${email}:`, error)
    return null
  }
}

// Customers
export async function getCustomerByEmail(email: string) {
  console.log(`LIB/DB.TS: getCustomerByEmail called. Email: ${email}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getCustomerByEmail - Database not initialized.")
    return null
  }
  if (!email) {
    console.error("LIB/DB.TS: getCustomerByEmail - Email is undefined or null.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT objectid, storename, companyname, phone, discountpercent, type
FROM customers
WHERE objectid = $1 AND (deleted = false OR deleted IS NULL)
`,
      [email],
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching customer with email ${email}:`, error)
    return null
  }
}

export async function getCustomerByPhone(phone: string) {
  console.log(`LIB/DB.TS: getCustomerByPhone called. Phone: ${phone}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getCustomerByPhone - Database not initialized.")
    return null
  }
  if (!phone) {
    console.error("LIB/DB.TS: getCustomerByPhone - Phone is undefined or null.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT objectid, storename, companyname, phone, discountpercent, type
FROM customers
WHERE phone = $1 AND (deleted = false OR deleted IS NULL)
LIMIT 1 
`,
      [phone],
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching customer with phone ${phone}:`, error)
    return null
  }
}

// Orders
// Тази функция вече е актуализирана да приема `identifier` (имейл или телефон)
// и да търси по `customer_email` ИЛИ `customer_phone` в `simple_orders`
export async function getOrdersByCustomer(identifier: string): Promise<any[]> {
  console.log(`LIB/DB.TS: getOrdersByCustomer called. Identifier: ${identifier}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getOrdersByCustomer - Database not initialized.")
    return []
  }
  if (!identifier) {
    console.error("LIB/DB.TS: getOrdersByCustomer - Identifier is undefined or null.")
    return []
  }

  // Предполагаме, че `simple_orders` има колони `customer_email` и `customer_phone`
  // или една обща колона `customer_identifier`, която може да съдържа едно от двете.
  // За този пример, ще търсим и в двата потенциални колони, ако съществуват.
  // Адаптирайте заявката според вашата актуална схема на `simple_orders`.

  let queryText = `
    SELECT id as objectid, order_id as orderid, status, created_at as createdat, total_amount as bill, items
    FROM simple_orders
    WHERE `
  const queryParams: string[] = []

  if (identifier.includes("@")) {
    // Ако идентификаторът е имейл
    queryText += `customer_email = $1`
    queryParams.push(identifier)
    console.log(`LIB/DB.TS: getOrdersByCustomer - Searching orders by email: ${identifier}`)
  } else {
    // Ако идентификаторът е телефон
    queryText += `customer_phone = $1`
    queryParams.push(identifier)
    console.log(`LIB/DB.TS: getOrdersByCustomer - Searching orders by phone: ${identifier}`)

    // Допълнително: ако телефонът е намерен, може да искаме да намерим и свързания имейл
    // и да търсим поръчки и по него, ако `customer_email` е основният идентификатор в `simple_orders`
    // за някои поръчки. Това зависи от това как се записват поръчките.
    // Засега ще търсим само по телефон, ако идентификаторът не е имейл.
  }

  queryText += ` ORDER BY created_at DESC`

  try {
    const result = await executeQueryWithRetry(queryText, queryParams)
    console.log(`LIB/DB.TS: getOrdersByCustomer - Found ${result.length} orders for identifier ${identifier}.`)
    return result
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching orders for identifier ${identifier}:`, error)
    // Проверка за специфична грешка, ако колоните не съществуват
    if (error instanceof Error) {
      if (
        error.message.includes('column "customer_email" does not exist') ||
        error.message.includes('column "customer_phone" does not exist')
      ) {
        console.warn(
          `LIB/DB.TS: One or both columns 'customer_email' or 'customer_phone' might not exist in 'simple_orders' table. Please check schema.`,
        )
      }
    }
    return []
  }
}

export async function getOrderById(orderId: string) {
  console.log(`LIB/DB.TS: getOrderById called. Order ID: ${orderId}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getOrderById - Database not initialized.")
    return null
  }
  if (!orderId) {
    console.error("LIB/DB.TS: getOrderById - Order ID is undefined or null.")
    return null
  }
  try {
    // Адаптирайте имената на колоните според вашата `simple_orders` таблица
    const result = await executeQueryWithRetry(
      `
SELECT 
  id as objectid, 
  order_id as orderid, 
  customer_email, -- или orderby
  customer_phone,
  status, 
  -- atdiscountrate, -- Ако имате такава колона
  delivery_address as deliveryto, 
  items as carts, -- Ако items е JSON с продуктите
  total_amount as bill, 
  created_at as createdat
FROM simple_orders 
WHERE order_id = $1 OR id::text = $1 -- Търсене по order_id или по primary key id
LIMIT 1
`,
      [orderId],
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching order ${orderId}:`, error)
    return null
  }
}

// Admin Dashboard related functions
export async function getAdminDashboardStats() {
  console.log(`LIB/DB.TS: getAdminDashboardStats called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getAdminDashboardStats - Database not initialized.")
    return { productCount: 0, categoryCount: 0, subcategoryCount: 0, avgPrice: "0.00", monthlyData: [] }
  }
  try {
    const productsResult = await executeQueryWithRetry(`
SELECT COUNT(*) as total_products
FROM new_products
WHERE deleted = false OR deleted IS NULL
`)
    const productCount = productsResult[0]?.total_products || 0

    const categoriesResult = await executeQueryWithRetry(`
SELECT COUNT(*) as total_categories
FROM categories
WHERE deleted = false OR deleted IS NULL
`)
    const categoryCount = categoriesResult[0]?.total_categories || 0

    const subcategoriesResult = await executeQueryWithRetry(`
SELECT COUNT(*) as total_subcategories
FROM subcategories
WHERE deleted = false OR deleted IS NULL
`)
    const subcategoryCount = subcategoriesResult[0]?.total_subcategories || 0

    const avgPriceResult = await executeQueryWithRetry(`
SELECT AVG(CAST(price AS float)) as avg_price
FROM new_products
WHERE price IS NOT NULL AND (deleted = false OR deleted IS NULL)
`)
    const avgPrice = avgPriceResult[0]?.avg_price || 0

    const monthlyDataResult = await executeQueryWithRetry(`
SELECT 
  EXTRACT(MONTH FROM createdat) as month,
  COUNT(*) as count
FROM new_products
WHERE 
  createdat IS NOT NULL AND 
  EXTRACT(YEAR FROM createdat) = EXTRACT(YEAR FROM CURRENT_DATE) AND
  (deleted = false OR deleted IS NULL)
GROUP BY month
ORDER BY month ASC
`)

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyData = monthNames.map((name, i) => {
      const month = i + 1
      const resultItem = monthlyDataResult.find((item: any) => Number.parseInt(item.month) === month)
      return {
        name,
        count: resultItem ? Number.parseInt(resultItem.count) : 0,
      }
    })

    return {
      productCount,
      categoryCount,
      subcategoryCount,
      avgPrice: Number.parseFloat(avgPrice).toFixed(2),
      monthlyData,
    }
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching admin dashboard stats:", error)
    return { productCount: 0, categoryCount: 0, subcategoryCount: 0, avgPrice: "0.00", monthlyData: [] }
  }
}

export async function getAdminProducts(page = 1, limit = 10, search = "", categoryId: string | null = null) {
  console.log(
    `LIB/DB.TS: getAdminProducts called. Page: ${page}, Limit: ${limit}, Search: ${search}, Category ID: ${categoryId}, dbInitialized: ${dbInitialized}`,
  )
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getAdminProducts - Database not initialized.")
    return { products: [], pagination: { total: 0, pages: 0, page: 1, limit } }
  }
  try {
    const offset = (page - 1) * limit
    let countQuery = `SELECT COUNT(*) as count FROM new_products WHERE (deleted = false OR deleted IS NULL)`
    const queryParams: any[] = []
    let dataQuery = `SELECT * FROM new_products WHERE (deleted = false OR deleted IS NULL)`

    if (search) {
      const searchTerm = `%${search}%`
      countQuery += ` AND title ILIKE $${queryParams.length + 1}`
      dataQuery += ` AND title ILIKE $${queryParams.length + 1}`
      queryParams.push(searchTerm)
    }
    if (categoryId) {
      countQuery += ` AND cateid = $${queryParams.length + 1}`
      dataQuery += ` AND cateid = $${queryParams.length + 1}`
      queryParams.push(categoryId)
    }

    const countResult = await executeQueryWithRetry(countQuery, queryParams)
    const total = Number.parseInt(countResult[0]?.count || "0")

    dataQuery += ` ORDER BY createdat DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit, offset)

    const result = await executeQueryWithRetry(dataQuery, queryParams)

    const products = await Promise.all(
      result.map(async (product: any) => {
        let category_title = "Без категория"
        if (product.cateid) {
          const cat = await getCategoryById(product.cateid)
          if (cat) category_title = cat.title
        }
        let subcategory_title = "Без подкатегория"
        if (product.subcateid) {
          const subcat = await getSubcategoryById(product.subcateid)
          if (subcat) subcategory_title = subcat.title
        }
        return {
          ...product,
          status: "Активен", // Assuming status logic needs to be defined
          category_title,
          subcategory_title,
        }
      }),
    )

    return {
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    }
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching admin products:", error)
    return { products: [], pagination: { total: 0, pages: 0, page: 1, limit } }
  }
}

export async function deleteProduct(id: string) {
  console.log(`LIB/DB.TS: deleteProduct called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: deleteProduct - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  if (!id) {
    console.error("LIB/DB.TS: deleteProduct - Product ID is undefined or null.")
    return { success: false, error: "Product ID is undefined or null" }
  }
  try {
    await executeQueryWithRetry(`UPDATE new_products SET deleted = true WHERE objectid = $1`, [id])
    return { success: true }
  } catch (error) {
    console.error(`LIB/DB.TS: Error deleting product ${id}:`, error)
    return { success: false, error: "Failed to delete product" }
  }
}

export async function getAdminCategories(page = 1, limit = 10, search = "", status: string | null = null) {
  console.log(
    `LIB/DB.TS: getAdminCategories called. Page: ${page}, Limit: ${limit}, Search: ${search}, Status: ${status}, dbInitialized: ${dbInitialized}`,
  )
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getAdminCategories - Database not initialized.")
    return { categories: [], pagination: { total: 0, pages: 0, page: 1, limit } }
  }
  try {
    const offset = (page - 1) * limit
    let countQuery = `SELECT COUNT(*) as count FROM categories WHERE 1=1`
    const queryParams: any[] = []
    let dataQuery = `
SELECT "Document ID" as id, title, title_en, description, photourl, pricefrom, 
       wholesalerpricefrom, retailerpricefrom, createdat, deleted, slug 
FROM categories WHERE 1=1`

    if (search) {
      const searchTerm = `%${search}%`
      countQuery += ` AND title ILIKE $${queryParams.length + 1}`
      dataQuery += ` AND title ILIKE $${queryParams.length + 1}`
      queryParams.push(searchTerm)
    }
    if (status === "active") {
      countQuery += ` AND (deleted = false OR deleted IS NULL)`
      dataQuery += ` AND (deleted = false OR deleted IS NULL)`
    } else if (status === "inactive") {
      countQuery += ` AND deleted = true`
      dataQuery += ` AND deleted = true`
    }

    const countResult = await executeQueryWithRetry(countQuery, queryParams)
    const total = Number.parseInt(countResult[0]?.count || "0")

    dataQuery += ` ORDER BY title ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit, offset)

    const categoriesResult = await executeQueryWithRetry(dataQuery, queryParams)

    const enrichedCategories = await Promise.all(
      categoriesResult.map(async (category: any) => {
        const productsCountResult = await executeQueryWithRetry(
          `SELECT COUNT(*) as count FROM new_products WHERE cateid = $1 AND (deleted = false OR deleted IS NULL)`,
          [category.id],
        )
        const subcategoriesCountResult = await executeQueryWithRetry(
          `SELECT COUNT(*) as count FROM subcategories WHERE cateid = $1 AND (deleted = false OR deleted IS NULL)`,
          [category.id],
        )
        return {
          ...category,
          productCount: Number.parseInt(productsCountResult[0]?.count || "0"),
          subcategoryCount: Number.parseInt(subcategoriesCountResult[0]?.count || "0"),
          status: category.deleted ? "Деактивирана" : "Активна",
        }
      }),
    )
    return {
      categories: enrichedCategories,
      pagination: { total, pages: Math.ceil(total / limit), page, limit },
    }
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching admin categories:", error)
    return { categories: [], pagination: { total: 0, pages: 0, page: 1, limit } }
  }
}

export async function toggleCategoryStatus(id: string, currentStatus: boolean) {
  console.log(
    `LIB/DB.TS: toggleCategoryStatus called. ID: ${id}, Current Status: ${currentStatus}, dbInitialized: ${dbInitialized}`,
  )
  if (!dbInitialized) {
    console.error("LIB/DB.TS: toggleCategoryStatus - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  if (!id) {
    console.error("LIB/DB.TS: toggleCategoryStatus - Category ID is undefined or null.")
    return { success: false, error: "Category ID is undefined or null" }
  }
  try {
    await executeQueryWithRetry(`UPDATE categories SET deleted = $1 WHERE "Document ID" = $2`, [!currentStatus, id])
    return { success: true }
  } catch (error) {
    console.error(`LIB/DB.TS: Error updating category status ${id}:`, error)
    return { success: false, error: "Failed to update category status" }
  }
}

export async function deleteCategory(id: string) {
  console.log(`LIB/DB.TS: deleteCategory called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: deleteCategory - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  if (!id) {
    console.error("LIB/DB.TS: deleteCategory - Category ID is undefined or null.")
    return { success: false, error: "Category ID is undefined or null" }
  }
  try {
    await executeQueryWithRetry(`UPDATE categories SET deleted = true WHERE "Document ID" = $1`, [id])
    return { success: true }
  } catch (error) {
    console.error(`LIB/DB.TS: Error deleting category ${id}:`, error)
    return { success: false, error: "Failed to delete category" }
  }
}

export async function getRecentOrders(limit = 5) {
  console.log(`LIB/DB.TS: getRecentOrders called. Limit: ${limit}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getRecentOrders - Database not initialized.")
    return []
  }
  try {
    // Адаптирайте имената на колоните според вашата `simple_orders` таблица
    const orders = await executeQueryWithRetry(
      `
SELECT 
  id as objectid, 
  order_id as orderid, 
  customer_email, -- или orderby
  customer_phone,
  status, 
  total_amount as bill, 
  created_at as createdat
FROM simple_orders
ORDER BY created_at DESC
LIMIT $1
`,
      [limit],
    )
    return Promise.all(
      orders.map(async (order: any) => {
        // Опит да се намери клиент по имейл или телефон
        let customerName = order.customer_email || order.customer_phone || "Unknown"
        if (order.customer_email) {
          const customerByEmail = await getCustomerByEmail(order.customer_email)
          if (customerByEmail) {
            customerName = customerByEmail.storename || customerByEmail.companyname || order.customer_email
          }
        } else if (order.customer_phone) {
          const customerByPhone = await getCustomerByPhone(order.customer_phone)
          if (customerByPhone) {
            customerName = customerByPhone.storename || customerByPhone.companyname || order.customer_phone
          }
        }

        return {
          id: order.orderid || order.objectid,
          customer: customerName,
          date: order.createdat ? new Date(order.createdat).toISOString().split("T")[0] : "Unknown",
          status: order.status || "Обработва се",
          amount: Number.parseFloat(order.bill || 0).toFixed(2),
        }
      }),
    )
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching recent orders:", error)
    return []
  }
}

export async function getTopProducts(limit = 5) {
  console.log(`LIB/DB.TS: getTopProducts called. Limit: ${limit}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getTopProducts - Database not initialized.")
    return []
  }
  try {
    const products = await executeQueryWithRetry(
      `
SELECT objectid as id, title, price
FROM new_products
WHERE (deleted = false OR deleted IS NULL)
ORDER BY price DESC -- This might need adjustment based on actual sales data
LIMIT $1
`,
      [limit],
    )
    return products.map((product: any) => ({
      id: product.id,
      name: product.title,
      sales: Math.floor(Math.random() * 30) + 1, // Placeholder sales data
      price: Number.parseFloat(product.price || 0).toFixed(2),
    }))
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching top products:", error)
    return []
  }
}

export async function getHomePageImage(): Promise<string | null> {
  console.log(`LIB/DB.TS: getHomePageImage called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getHomePageImage - Database not initialized.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(`
      SELECT image_url
      FROM home_page_image
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `)
    return result[0]?.image_url || null
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching home page image:", error)
    if (error instanceof Error && error.message.includes('relation "home_page_image" does not exist')) {
      console.warn("LIB/DB.TS: Table 'home_page_image' might not exist. Please run the setup script.")
    }
    return null
  }
}

export async function getHomePageImages() {
  console.log(`LIB/DB.TS: getHomePageImages called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getHomePageImages - Database not initialized.")
    return []
  }
  try {
    const result = await executeQueryWithRetry(`
      SELECT id, image_url, is_active, sort_order, link_url, created_at
      FROM home_page_image
      ORDER BY sort_order ASC, created_at DESC
    `)
    return result || []
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching home page images:", error)
    // Fallback without sort_order/link_url columns
    try {
      const fallback = await executeQueryWithRetry(`
        SELECT id, image_url, is_active, created_at
        FROM home_page_image
        ORDER BY created_at DESC
      `)
      return (fallback || []).map((r: any) => ({ ...r, sort_order: 0, link_url: null }))
    } catch {
      return []
    }
  }
}

export async function addHomePageImage(imageUrl: string) {
  console.log(`LIB/DB.TS: addHomePageImage called. imageUrl: ${imageUrl}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: addHomePageImage - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  try {
    const result = await executeQueryWithRetry(
      `INSERT INTO home_page_image (image_url, is_active) VALUES ($1, false) RETURNING *`,
      [imageUrl],
    )
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("LIB/DB.TS: Error adding home page image:", error)
    return { success: false, error: "Failed to add image" }
  }
}

export async function setActiveHomePageImage(id: number) {
  console.log(`LIB/DB.TS: setActiveHomePageImage called. id: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: setActiveHomePageImage - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  try {
    // Transaction
    await executeQueryWithRetry("BEGIN", [])
    await executeQueryWithRetry(`UPDATE home_page_image SET is_active = false`, [])
    await executeQueryWithRetry(`UPDATE home_page_image SET is_active = true WHERE id = $1`, [id])
    await executeQueryWithRetry("COMMIT", [])
    return { success: true }
  } catch (error) {
    await executeQueryWithRetry("ROLLBACK", [])
    console.error(`LIB/DB.TS: Error setting active home page image ${id}:`, error)
    return { success: false, error: "Failed to set active image" }
  }
}

export async function deleteHomePageImage(id: number, url: string) {
  console.log(`LIB/DB.TS: deleteHomePageImage called. id: ${id}, url: ${url}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: deleteHomePageImage - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  try {
    await executeQueryWithRetry(`DELETE FROM home_page_image WHERE id = $1`, [id])
    return { success: true }
  } catch (error) {
    console.error("LIB/DB.TS: Error deleting home page image:", error)
    return { success: false, error: "Failed to delete image" }
  }
}

// Banner settings management functions
export async function getBannerSettings() {
  console.log(`LIB/DB.TS: getBannerSettings called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getBannerSettings - Database not initialized.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(`
      SELECT id, start_date, end_date, message, is_visible, created_at, updated_at
      FROM banner_settings
      ORDER BY id DESC
      LIMIT 1
    `)
    return result[0] || null
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching banner settings:", error)
    if (error instanceof Error && error.message.includes('relation "banner_settings" does not exist')) {
      console.warn("LIB/DB.TS: Table 'banner_settings' might not exist. Please run the setup script.")
    }
    return null
  }
}

export async function updateBannerSettings(settings: {
  start_date: string
  end_date: string
  message: string
  is_visible: boolean
}) {
  console.log(`LIB/DB.TS: updateBannerSettings called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: updateBannerSettings - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  try {
    const result = await executeQueryWithRetry(
      `
      UPDATE banner_settings 
      SET start_date = $1, end_date = $2, message = $3, is_visible = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM banner_settings ORDER BY id DESC LIMIT 1)
      RETURNING *
    `,
      [settings.start_date, settings.end_date, settings.message, settings.is_visible],
    )
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("LIB/DB.TS: Error updating banner settings:", error)
    return { success: false, error: "Failed to update banner settings" }
  }
}

export async function toggleBannerVisibility(isVisible: boolean) {
  console.log(`LIB/DB.TS: toggleBannerVisibility called. isVisible: ${isVisible}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: toggleBannerVisibility - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  try {
    await executeQueryWithRetry(
      `
      UPDATE banner_settings 
      SET is_visible = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM banner_settings ORDER BY id DESC LIMIT 1)
    `,
      [isVisible],
    )
    return { success: true }
  } catch (error) {
    console.error("LIB/DB.TS: Error toggling banner visibility:", error)
    return { success: false, error: "Failed to toggle banner visibility" }
  }
}

export async function checkProductsSchema() {
  console.log(`LIB/DB.TS: checkProductsSchema called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: checkProductsSchema - Database not initialized.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(`
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'new_products'
AND column_name IN ('price', 'retailerprice', 'wholesalerprice', 'europe_price')
ORDER BY ordinal_position
`)
    const sampleProduct = await executeQueryWithRetry(`
SELECT objectid, title, price, retailerprice, wholesalerprice, europe_price
FROM new_products
WHERE wholesalerprice IS NOT NULL OR europe_price IS NOT NULL
LIMIT 1
`)
    return { schema: result, sample: sampleProduct.length > 0 ? sampleProduct[0] : null }
  } catch (error) {
    console.error("LIB/DB.TS: Error checking products schema:", error)
    return null
  }
}

export { sql }

export async function getProductsByCategory(categoryId: string) {
  console.log(`LIB/DB.TS: getProductsByCategory called. CategoryId: ${categoryId}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getProductsByCategory - Database not initialized.")
    return []
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT * 
FROM new_products
WHERE cateid = $1 AND (deleted = false OR deleted IS NULL)
ORDER BY title ASC
`,
      [categoryId],
    )
    return result
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching products by category ${categoryId}:`, error)
    return []
  }
}
export async function getFeaturedProducts(limit = 100) {
  console.log(`LIB/DB.TS: getFeaturedProducts called. Limit: ${limit}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getFeaturedProducts - Database not initialized.")
    return []
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT * 
FROM new_products
WHERE (deleted = false OR deleted IS NULL)
ORDER BY createdat DESC
LIMIT $1
`,
      [limit],
    )
    return result
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching featured products:", error)
    return []
  }
}
export async function searchProducts(query: string) {
  console.log(`LIB/DB.TS: searchProducts called. Query: ${query}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: searchProducts - Database not initialized.")
    return []
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT * 
FROM new_products
WHERE (title ILIKE $1 OR description ILIKE $1) AND (deleted = false OR deleted IS NULL)
ORDER BY title ASC
`,
      [`%${query}%`],
    )
    return result
  } catch (error) {
    console.error(`LIB/DB.TS: Error searching products with query ${query}:`, error)
    return []
  }
}
export async function getProductsBySubcategory(subcategoryId: string) {
  console.log(
    `LIB/DB.TS: getProductsBySubcategory called. SubcategoryId: ${subcategoryId}, dbInitialized: ${dbInitialized}`,
  )
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getProductsBySubcategory - Database not initialized.")
    return []
  }
  try {
    const result = await executeQueryWithRetry(
      `
SELECT * 
FROM new_products
WHERE subcateid = $1 AND (deleted = false OR deleted IS NULL)
ORDER BY title ASC
`,
      [subcategoryId],
    )
    return result
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching products by subcategory ${subcategoryId}:`, error)
    return []
  }
}

export async function getActiveQuantityPromotionForSubcategory(
  subcategoryId: string | null | undefined,
  userCustomerType: string | null | undefined,
): Promise<{ buy_quantity: number; free_quantity: number; description?: string | null } | null> {
  console.log(
    `[DB getActiveQuantityPromotionForSubcategory] Called with subcategoryId: ${subcategoryId}, userCustomerType: ${userCustomerType}`,
  )
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getActiveQuantityPromotionForSubcategory - Database not initialized.")
    return null
  }
  if (!subcategoryId) {
    console.warn("[DB getActiveQuantityPromotionForSubcategory] subcategoryId is null or undefined. Returning null.")
    return null
  }

  try {
    let promo = null

    // Robust normalization of customer type
    let normalizedUserCustomerType: string | null = null
    if (userCustomerType) {
      const lowerCaseType = userCustomerType.toLowerCase()
      if (lowerCaseType === "дребно") {
        normalizedUserCustomerType = "retailer"
        console.log(`[DB getActiveQuantityPromotionForSubcategory] Normalized 'дребно' to 'retailer'.`)
      } else {
        normalizedUserCustomerType = lowerCaseType
        console.log(
          `[DB getActiveQuantityPromotionForSubcategory] Normalized '${userCustomerType}' to '${lowerCaseType}'.`,
        )
      }
    } else {
      console.log(`[DB getActiveQuantityPromotionForSubcategory] userCustomerType is null or undefined.`)
    }

    if (normalizedUserCustomerType) {
      console.log(
        `[DB getActiveQuantityPromotionForSubcategory] Checking for specific promotion for customerType: ${normalizedUserCustomerType}`,
      )
      const specificPromoResult = await executeQueryWithRetry(
        `
      SELECT min_quantity, bonus_quantity, description
      FROM quantity_promotions
      WHERE subcategory_id = $1
        AND customer_type = $2
        AND is_active = true
        AND (deleted = false OR deleted IS NULL)
      ORDER BY created_at DESC
      LIMIT 1;
    `,
        [subcategoryId, normalizedUserCustomerType],
      )
      console.log(
        `[DB getActiveQuantityPromotionForSubcategory] Specific promo query result for ${subcategoryId} & ${normalizedUserCustomerType}:`,
        JSON.stringify(specificPromoResult, null, 2),
      )
      if (specificPromoResult.length > 0) {
        promo = specificPromoResult[0]
        console.log(
          "[DB getActiveQuantityPromotionForSubcategory] Found specific promotion:",
          JSON.stringify(promo, null, 2),
        )
      } else {
        console.log("[DB getActiveQuantityPromotionForSubcategory] No specific promotion found.")
      }
    } else {
      console.log(
        "[DB getActiveQuantityPromotionForSubcategory] userCustomerType is null or undefined after normalization. Skipping specific promotion check.",
      )
    }

    if (!promo) {
      console.log(
        "[DB getActiveQuantityPromotionForSubcategory] No specific promo found or userCustomerType was null. Checking for general promotion (customer_type IS NULL).",
      )
      const generalPromoResult = await executeQueryWithRetry(
        `
      SELECT min_quantity, bonus_quantity, description
      FROM quantity_promotions
      WHERE subcategory_id = $1
        AND customer_type IS NULL
        AND is_active = true
        AND (deleted = false OR deleted IS NULL)
      ORDER BY created_at DESC
      LIMIT 1;
    `,
        [subcategoryId],
      )
      console.log(
        `[DB getActiveQuantityPromotionForSubcategory] General promo query result for ${subcategoryId}:`,
        JSON.stringify(generalPromoResult, null, 2),
      )
      if (generalPromoResult.length > 0) {
        promo = generalPromoResult[0]
        console.log(
          "[DB getActiveQuantityPromotionForSubcategory] Found general promotion:",
          JSON.stringify(promo, null, 2),
        )
      } else {
        console.log("[DB getActiveQuantityPromotionForSubcategory] No general promotion found.")
      }
    }

    if (promo) {
      console.log(
        "[DB getActiveQuantityPromotionForSubcategory] Final promo object to return:",
        JSON.stringify(promo, null, 2),
      )
      return {
        buy_quantity: Number(promo.min_quantity),
        free_quantity: Number(promo.bonus_quantity),
        description: promo.description || null,
      }
    }
    console.log("[DB getActiveQuantityPromotionForSubcategory] No promotion found. Returning null.")
    return null
  } catch (error) {
    console.error(
      `LIB/DB.TS: Error fetching quantity promotion for subcategory ${subcategoryId} and customer type ${userCustomerType}:`,
      error,
    )
    if (
      error instanceof Error &&
      (error.message.includes('relation "quantity_promotions" does not exist') ||
        error.message.includes('column "subcategory_id" does not exist') ||
        error.message.includes('column "min_quantity" does not exist') ||
        error.message.includes('column "bonus_quantity" does not exist') ||
        error.message.includes('column "customer_type" does not exist'))
    ) {
      console.warn(
        `LIB/DB.TS: Table 'quantity_promotions' or its columns (subcategory_id, min_quantity, bonus_quantity, customer_type, is_active, deleted) might not exist or match. Please ensure it's created correctly.`,
      )
    }
    return null
  }
}

export async function updateHomePageImageUrl(id: number, newUrl: string) {
console.log(`LIB/DB.TS: updateHomePageImageUrl called. id: ${id}, newUrl: ${newUrl}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
console.error("LIB/DB.TS: updateHomePageImageUrl - Database not initialized.")
  return { success: false, error: "Database not initialized" }
  }
  try {
    await executeQueryWithRetry(`UPDATE home_page_image SET image_url = $1 WHERE id = $2`, [newUrl, id])
    return { success: true }
  } catch (error) {
    console.error(`LIB/DB.TS: Error updating home page image URL for id ${id}:`, error)
    return { success: false, error: "Failed to update image URL" }
  }
}

// Hero Banner Carousel functions
export async function getHeroBanners() {
  console.log(`LIB/DB.TS: getHeroBanners called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getHeroBanners - Database not initialized.")
    return []
  }
  try {
    const result = await executeQueryWithRetry(`
      SELECT id, image_url, is_active, sort_order, link_url, created_at
      FROM home_page_image
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at DESC
    `)
    return result || []
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching hero banners:", error)
    // Fallback: try without sort_order/link_url columns (pre-migration)
    try {
      const fallbackResult = await executeQueryWithRetry(`
        SELECT id, image_url, is_active, created_at
        FROM home_page_image
        WHERE is_active = true
        ORDER BY created_at DESC
      `)
      return (fallbackResult || []).map((r: any) => ({ ...r, sort_order: 0, link_url: null }))
    } catch {
      return []
    }
  }
}

export async function toggleBannerActive(id: number, isActive: boolean) {
  console.log(`LIB/DB.TS: toggleBannerActive called. id: ${id}, isActive: ${isActive}`)
  if (!dbInitialized) {
    return { success: false, error: "Database not initialized" }
  }
  try {
    await executeQueryWithRetry(`UPDATE home_page_image SET is_active = $1 WHERE id = $2`, [isActive, id])
    return { success: true }
  } catch (error) {
    console.error("LIB/DB.TS: Error toggling banner active:", error)
    return { success: false, error: "Failed to toggle banner" }
  }
}

export async function updateBannerSortOrder(id: number, sortOrder: number) {
  console.log(`LIB/DB.TS: updateBannerSortOrder called. id: ${id}, sortOrder: ${sortOrder}`)
  if (!dbInitialized) {
    return { success: false, error: "Database not initialized" }
  }
  try {
    await executeQueryWithRetry(`UPDATE home_page_image SET sort_order = $1 WHERE id = $2`, [sortOrder, id])
    return { success: true }
  } catch (error) {
    console.error("LIB/DB.TS: Error updating banner sort order:", error)
    return { success: false, error: "Failed to update sort order" }
  }
}

export async function updateBannerLinkUrl(id: number, linkUrl: string | null) {
  console.log(`LIB/DB.TS: updateBannerLinkUrl called. id: ${id}, linkUrl: ${linkUrl}`)
  if (!dbInitialized) {
    return { success: false, error: "Database not initialized" }
  }
  try {
    await executeQueryWithRetry(`UPDATE home_page_image SET link_url = $1 WHERE id = $2`, [linkUrl, id])
    return { success: true }
  } catch (error) {
    console.error("LIB/DB.TS: Error updating banner link URL:", error)
    return { success: false, error: "Failed to update link URL" }
  }
}

export async function getProducts({
  category,
  subcategory,
  search,
}: { category?: string; subcategory?: string; search?: string } = {}) {
  console.log(
    `LIB/DB.TS: getProducts called. Category: ${category}, Subcategory: ${subcategory}, Search: ${search}, dbInitialized: ${dbInitialized}`,
  )
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getProducts - Database not initialized.")
    return []
  }
  try {
    let query = `
SELECT p.*, c.title as category_title, s.title as subcategory_title
FROM new_products p
LEFT JOIN categories c ON p.cateid = c."Document ID"
LEFT JOIN subcategories s ON p.subcateid = s."Document ID"
WHERE (p.deleted = false OR p.deleted IS NULL)
`
    const params: any[] = []
    if (category) {
      query += ` AND p.cateid = $${params.length + 1}`
      params.push(category)
    }
    if (subcategory) {
      query += ` AND p.subcateid = $${params.length + 1}`
      params.push(subcategory)
    }
    if (search) {
      query += ` AND (p.title ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }
    query += ` ORDER BY p.title ASC`
    const result = await executeQueryWithRetry(query, params)
    return result
  } catch (error) {
    console.error("LIB/DB.TS: Database error in getProducts:", error)
    return []
  }
}

export async function getTableSchema(tableName: string) {
  console.log(`LIB/DB.TS: getTableSchema called. Table: ${tableName}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getTableSchema - Database not initialized.")
    return { columns: [] }
  }
  try {
    const result = await executeQueryWithRetry(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `,
      [tableName],
    )
    return { columns: result || [] }
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching schema for table ${tableName}:`, error)
    return { columns: [] }
  }
}

// Product Reviews
export interface ProductReview {
  id: number
  product_id: string
  rating: number
  reviewer_name: string | null
  reviewer_email: string | null
  review_text: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface ProductRatingSummary {
  product_id: string
  review_count: number
  average_rating: number
}

export async function getProductReviews(productId: string, approvedOnly = true): Promise<ProductReview[]> {
  console.log(`LIB/DB.TS: getProductReviews called. Product ID: ${productId}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getProductReviews - Database not initialized.")
    return []
  }
  if (!productId) {
    console.error("LIB/DB.TS: getProductReviews - Product ID is undefined or null.")
    return []
  }
  try {
    let query = `SELECT * FROM product_reviews WHERE product_id = $1`
    if (approvedOnly) {
      query += ` AND is_approved = true`
    }
    query += ` ORDER BY created_at DESC`
    const result = await executeQueryWithRetry(query, [productId])
    return result as ProductReview[]
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching reviews for product ${productId}:`, error)
    return []
  }
}

export async function getProductRatingSummary(productId: string): Promise<ProductRatingSummary | null> {
  console.log(`LIB/DB.TS: getProductRatingSummary called. Product ID: ${productId}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getProductRatingSummary - Database not initialized.")
    return null
  }
  if (!productId) {
    console.error("LIB/DB.TS: getProductRatingSummary - Product ID is undefined or null.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `SELECT product_id, review_count, average_rating FROM product_rating_summary WHERE product_id = $1`,
      [productId],
    )
    if (result[0]) {
      return {
        product_id: result[0].product_id,
        review_count: parseInt(result[0].review_count),
        average_rating: parseFloat(result[0].average_rating),
      }
    }
    return null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching rating summary for product ${productId}:`, error)
    return null
  }
}

export async function createProductReview(
  productId: string,
  rating: number,
  reviewerName?: string,
  reviewerEmail?: string,
  reviewText?: string,
): Promise<ProductReview | null> {
  console.log(`LIB/DB.TS: createProductReview called. Product ID: ${productId}, Rating: ${rating}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: createProductReview - Database not initialized.")
    return null
  }
  if (!productId || rating < 1 || rating > 5) {
    console.error("LIB/DB.TS: createProductReview - Invalid product ID or rating.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `INSERT INTO product_reviews (product_id, rating, reviewer_name, reviewer_email, review_text, is_approved) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING *`,
      [productId, rating, reviewerName || null, reviewerEmail || null, reviewText || null],
    )
    return result[0] as ProductReview
  } catch (error) {
    console.error(`LIB/DB.TS: Error creating review for product ${productId}:`, error)
    return null
  }
}

export async function updateProductReviewApproval(reviewId: number, isApproved: boolean): Promise<boolean> {
  console.log(`LIB/DB.TS: updateProductReviewApproval called. Review ID: ${reviewId}, Approved: ${isApproved}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: updateProductReviewApproval - Database not initialized.")
    return false
  }
  try {
    await executeQueryWithRetry(
      `UPDATE product_reviews SET is_approved = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [reviewId, isApproved],
    )
    return true
  } catch (error) {
    console.error(`LIB/DB.TS: Error updating review approval ${reviewId}:`, error)
    return false
  }
}

export async function deleteProductReview(reviewId: number): Promise<boolean> {
  console.log(`LIB/DB.TS: deleteProductReview called. Review ID: ${reviewId}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: deleteProductReview - Database not initialized.")
    return false
  }
  try {
    await executeQueryWithRetry(`DELETE FROM product_reviews WHERE id = $1`, [reviewId])
    return true
  } catch (error) {
    console.error(`LIB/DB.TS: Error deleting review ${reviewId}:`, error)
    return false
  }
}

export async function getAllReviews(page = 1, limit = 20): Promise<{ reviews: ProductReview[]; total: number }> {
  console.log(`LIB/DB.TS: getAllReviews called. Page: ${page}, Limit: ${limit}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getAllReviews - Database not initialized.")
    return { reviews: [], total: 0 }
  }
  try {
    const offset = (page - 1) * limit
    const countResult = await executeQueryWithRetry(`SELECT COUNT(*) as count FROM product_reviews`)
    const total = parseInt(countResult[0]?.count || "0")
    
    const result = await executeQueryWithRetry(
      `SELECT * FROM product_reviews ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    )
    return { reviews: result as ProductReview[], total }
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching all reviews:", error)
    return { reviews: [], total: 0 }
  }
}

export async function updateProductReview(
  reviewId: number,
  rating: number,
  reviewerName?: string,
  reviewText?: string,
  isApproved?: boolean,
): Promise<boolean> {
  console.log(`LIB/DB.TS: updateProductReview called. Review ID: ${reviewId}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: updateProductReview - Database not initialized.")
    return false
  }
  try {
    await executeQueryWithRetry(
      `UPDATE product_reviews 
       SET rating = $2, reviewer_name = $3, review_text = $4, is_approved = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [reviewId, rating, reviewerName || null, reviewText || null, isApproved ?? true],
    )
    return true
  } catch (error) {
    console.error(`LIB/DB.TS: Error updating review ${reviewId}:`, error)
    return false
  }
}

export async function getBatchProductRatings(productIds: string[]): Promise<Map<string, ProductRatingSummary>> {
  console.log(`LIB/DB.TS: getBatchProductRatings called. Product count: ${productIds.length}`)
  const ratingsMap = new Map<string, ProductRatingSummary>()
  
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getBatchProductRatings - Database not initialized.")
    return ratingsMap
  }
  
  if (productIds.length === 0) {
    return ratingsMap
  }
  
  try {
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(", ")
    const result = await executeQueryWithRetry(
      `SELECT product_id, review_count, average_rating 
       FROM product_rating_summary 
       WHERE product_id IN (${placeholders})`,
      productIds,
    )
    
    for (const row of result) {
      ratingsMap.set(row.product_id, {
        product_id: row.product_id,
        review_count: parseInt(row.review_count),
        average_rating: parseFloat(row.average_rating),
      })
    }
    
    return ratingsMap
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching batch product ratings:", error)
    return ratingsMap
  }
}

// News functions
export async function getNews(activeOnly = true) {
  console.log(`LIB/DB.TS: getNews called. activeOnly: ${activeOnly}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getNews - Database not initialized.")
    return []
  }
  try {
    const whereClause = activeOnly ? "WHERE is_active = true" : ""
    const result = await executeQueryWithRetry(`
      SELECT * FROM news
      ${whereClause}
      ORDER BY sort_order ASC, created_at DESC
    `)
    return result || []
  } catch (error) {
    console.error("LIB/DB.TS: Error fetching news:", error)
    return []
  }
}

export async function getNewsById(id: number) {
  console.log(`LIB/DB.TS: getNewsById called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getNewsById - Database not initialized.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `SELECT * FROM news WHERE id = $1`,
      [id]
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching news ${id}:`, error)
    return null
  }
}

export async function getNewsBySlug(slug: string) {
  console.log(`LIB/DB.TS: getNewsBySlug called. Slug: ${slug}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getNewsBySlug - Database not initialized.")
    return null
  }
  try {
    // Try to find by slug first, if slug column exists
    const result = await executeQueryWithRetry(
      `SELECT * FROM news WHERE slug = $1 AND is_active = true`,
      [slug]
    )
    if (result && result[0]) return result[0]
    
    // Fallback: try to find by ID if slug is numeric
    const numericId = parseInt(slug, 10)
    if (!isNaN(numericId)) {
      const byIdResult = await executeQueryWithRetry(
        `SELECT * FROM news WHERE id = $1 AND is_active = true`,
        [numericId]
      )
      return byIdResult[0] || null
    }
    
    return null
  } catch (error) {
    // If slug column doesn't exist, try by ID
    const numericId = parseInt(slug, 10)
    if (!isNaN(numericId)) {
      try {
        const byIdResult = await executeQueryWithRetry(
          `SELECT * FROM news WHERE id = $1 AND is_active = true`,
          [numericId]
        )
        return byIdResult[0] || null
      } catch {
        console.error(`LIB/DB.TS: Error fetching news by slug/id ${slug}:`, error)
        return null
      }
    }
    console.error(`LIB/DB.TS: Error fetching news by slug ${slug}:`, error)
    return null
  }
}

export async function createNews(data: {
  title: string
  title_en?: string
  summary?: string
  summary_en?: string
  content?: string
  content_en?: string
  image_url?: string
  link_url?: string
  is_active?: boolean
  is_featured?: boolean
  sort_order?: number
  slug?: string
  meta_title?: string
  meta_title_en?: string
  meta_description?: string
  meta_description_en?: string
  meta_keywords?: string
  meta_keywords_en?: string
  content_blocks?: any[]
  content_blocks_en?: any[]
  related_products?: string[]
  gallery_images?: string[]
}) {
  console.log(`LIB/DB.TS: createNews called. dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: createNews - Database not initialized.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `INSERT INTO news (title, title_en, summary, summary_en, content, content_en, image_url, link_url, 
                         is_active, is_featured, sort_order, slug, meta_title, meta_title_en, 
                         meta_description, meta_description_en, meta_keywords, meta_keywords_en,
                         content_blocks, content_blocks_en, related_products, gallery_images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        data.title,
        data.title_en || null,
        data.summary || null,
        data.summary_en || null,
        data.content || null,
        data.content_en || null,
        data.image_url || null,
        data.link_url || null,
        data.is_active ?? true,
        data.is_featured ?? false,
        data.sort_order ?? 0,
        data.slug || null,
        data.meta_title || null,
        data.meta_title_en || null,
        data.meta_description || null,
        data.meta_description_en || null,
        data.meta_keywords || null,
        data.meta_keywords_en || null,
        JSON.stringify(data.content_blocks || []),
        JSON.stringify(data.content_blocks_en || []),
        JSON.stringify(data.related_products || []),
        JSON.stringify(data.gallery_images || []),
      ]
    )
    return result[0] || null
  } catch (error) {
    console.error("LIB/DB.TS: Error creating news:", error)
    return null
  }
}

export async function updateNews(
  id: number,
  data: {
    title?: string
    title_en?: string
    summary?: string
    summary_en?: string
    content?: string
    content_en?: string
    image_url?: string
    link_url?: string
    is_active?: boolean
    is_featured?: boolean
    sort_order?: number
    slug?: string
    meta_title?: string
    meta_title_en?: string
    meta_description?: string
    meta_description_en?: string
    meta_keywords?: string
    meta_keywords_en?: string
    content_blocks?: any[]
    content_blocks_en?: any[]
    related_products?: string[]
    gallery_images?: string[]
  }
) {
  console.log(`LIB/DB.TS: updateNews called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: updateNews - Database not initialized.")
    return null
  }
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(data.title)
    }
    if (data.title_en !== undefined) {
      fields.push(`title_en = $${paramIndex++}`)
      values.push(data.title_en)
    }
    if (data.summary !== undefined) {
      fields.push(`summary = $${paramIndex++}`)
      values.push(data.summary)
    }
    if (data.summary_en !== undefined) {
      fields.push(`summary_en = $${paramIndex++}`)
      values.push(data.summary_en)
    }
    if (data.content !== undefined) {
      fields.push(`content = $${paramIndex++}`)
      values.push(data.content)
    }
    if (data.content_en !== undefined) {
      fields.push(`content_en = $${paramIndex++}`)
      values.push(data.content_en)
    }
    if (data.image_url !== undefined) {
      fields.push(`image_url = $${paramIndex++}`)
      values.push(data.image_url)
    }
    if (data.link_url !== undefined) {
      fields.push(`link_url = $${paramIndex++}`)
      values.push(data.link_url)
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`)
      values.push(data.is_active)
    }
    if (data.is_featured !== undefined) {
      fields.push(`is_featured = $${paramIndex++}`)
      values.push(data.is_featured)
    }
    if (data.sort_order !== undefined) {
      fields.push(`sort_order = $${paramIndex++}`)
      values.push(data.sort_order)
    }
    if (data.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`)
      values.push(data.slug)
    }
    if (data.meta_title !== undefined) {
      fields.push(`meta_title = $${paramIndex++}`)
      values.push(data.meta_title)
    }
    if (data.meta_title_en !== undefined) {
      fields.push(`meta_title_en = $${paramIndex++}`)
      values.push(data.meta_title_en)
    }
    if (data.meta_description !== undefined) {
      fields.push(`meta_description = $${paramIndex++}`)
      values.push(data.meta_description)
    }
    if (data.meta_description_en !== undefined) {
      fields.push(`meta_description_en = $${paramIndex++}`)
      values.push(data.meta_description_en)
    }
    if (data.meta_keywords !== undefined) {
      fields.push(`meta_keywords = $${paramIndex++}`)
      values.push(data.meta_keywords)
    }
    if (data.meta_keywords_en !== undefined) {
      fields.push(`meta_keywords_en = $${paramIndex++}`)
      values.push(data.meta_keywords_en)
    }
    if (data.content_blocks !== undefined) {
      fields.push(`content_blocks = $${paramIndex++}`)
      values.push(JSON.stringify(data.content_blocks))
    }
    if (data.content_blocks_en !== undefined) {
      fields.push(`content_blocks_en = $${paramIndex++}`)
      values.push(JSON.stringify(data.content_blocks_en))
    }
    if (data.related_products !== undefined) {
      fields.push(`related_products = $${paramIndex++}`)
      values.push(JSON.stringify(data.related_products))
    }
    if (data.gallery_images !== undefined) {
      fields.push(`gallery_images = $${paramIndex++}`)
      values.push(JSON.stringify(data.gallery_images))
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await executeQueryWithRetry(
      `UPDATE news SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error updating news ${id}:`, error)
    return null
  }
}

export async function deleteNews(id: number) {
  console.log(`LIB/DB.TS: deleteNews called. ID: ${id}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: deleteNews - Database not initialized.")
    return false
  }
  try {
    await executeQueryWithRetry(`DELETE FROM news WHERE id = $1`, [id])
    return true
  } catch (error) {
    console.error(`LIB/DB.TS: Error deleting news ${id}:`, error)
    return false
  }
}

// SEO Settings
export interface SeoSettings {
  id?: number
  page_key: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  og_title?: string
  og_description?: string
  og_image?: string
  og_image_width?: number
  og_image_height?: number
  og_type?: string
  og_site_name?: string
  og_locale?: string
  og_url?: string
  twitter_card?: string
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  twitter_site?: string
  twitter_creator?: string
  canonical_url?: string
  robots?: string
  author?: string
  schema_type?: string
  schema_name?: string
  schema_description?: string
  schema_logo?: string
  schema_same_as?: string[]
  schema_address_locality?: string
  schema_address_region?: string
  schema_address_country?: string
  schema_postal_code?: string
  schema_street_address?: string
  schema_telephone?: string
  schema_email?: string
  hreflang_en?: string
  hreflang_bg?: string
  google_site_verification?: string
  bing_site_verification?: string
  yandex_verification?: string
  theme_color?: string
  background_color?: string
  ga_tracking_id?: string
  gtm_id?: string
  fb_pixel_id?: string
  created_at?: string
  updated_at?: string
}

export async function getSeoSettings(pageKey: string = 'homepage'): Promise<SeoSettings | null> {
  console.log(`LIB/DB.TS: getSeoSettings called. pageKey: ${pageKey}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: getSeoSettings - Database not initialized.")
    return null
  }
  try {
    const result = await executeQueryWithRetry(
      `SELECT * FROM seo_settings WHERE page_key = $1`,
      [pageKey]
    )
    return result[0] || null
  } catch (error) {
    console.error(`LIB/DB.TS: Error fetching SEO settings for ${pageKey}:`, error)
    return null
  }
}

export async function updateSeoSettings(pageKey: string, data: Partial<SeoSettings>): Promise<{ success: boolean; data?: SeoSettings; error?: string }> {
  console.log(`LIB/DB.TS: updateSeoSettings called. pageKey: ${pageKey}, dbInitialized: ${dbInitialized}`)
  if (!dbInitialized) {
    console.error("LIB/DB.TS: updateSeoSettings - Database not initialized.")
    return { success: false, error: "Database not initialized" }
  }
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build dynamic update query
    const updateableFields = [
      'meta_title', 'meta_description', 'meta_keywords',
      'og_title', 'og_description', 'og_image', 'og_image_width', 'og_image_height',
      'og_type', 'og_site_name', 'og_locale', 'og_url',
      'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image',
      'twitter_site', 'twitter_creator',
      'canonical_url', 'robots', 'author',
      'schema_type', 'schema_name', 'schema_description', 'schema_logo',
      'schema_same_as', 'schema_address_locality', 'schema_address_region',
      'schema_address_country', 'schema_postal_code', 'schema_street_address',
      'schema_telephone', 'schema_email',
      'hreflang_en', 'hreflang_bg',
      'google_site_verification', 'bing_site_verification', 'yandex_verification',
      'theme_color', 'background_color',
      'ga_tracking_id', 'gtm_id', 'fb_pixel_id'
    ]

    for (const field of updateableFields) {
      if (data[field as keyof SeoSettings] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`)
        const value = data[field as keyof SeoSettings]
        // Handle array fields
        if (Array.isArray(value)) {
          values.push(value)
        } else {
          values.push(value)
        }
      }
    }

    if (fields.length === 0) {
      return { success: false, error: "No fields to update" }
    }

    fields.push(`updated_at = NOW()`)
    values.push(pageKey)

    const result = await executeQueryWithRetry(
      `UPDATE seo_settings SET ${fields.join(", ")} WHERE page_key = $${paramIndex} RETURNING *`,
      values
    )

    if (result.length === 0) {
      // Insert if doesn't exist
      const insertResult = await executeQueryWithRetry(
        `INSERT INTO seo_settings (page_key) VALUES ($1) RETURNING *`,
        [pageKey]
      )
      // Then update
      return updateSeoSettings(pageKey, data)
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error(`LIB/DB.TS: Error updating SEO settings for ${pageKey}:`, error)
    return { success: false, error: String(error) }
  }
}
