import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured")
  return neon(databaseUrl)
}

export async function GET(request: Request) {
  try {
    const sql = getSql()
    console.log("Adding europe_price column to new_products table with default value 0")

    // Check if the column already exists
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'new_products' 
      AND column_name = 'europe_price'
    `

    if (checkColumn.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Column europe_price already exists in new_products table",
      })
    }

    // Add the new column with a default value of 0
    await sql`
      ALTER TABLE new_products 
      ADD COLUMN IF NOT EXISTS europe_price NUMERIC(10, 2) DEFAULT 0
    `

    // Update all existing products to have europe_price = 0
    await sql`
      UPDATE new_products 
      SET europe_price = 0 
      WHERE europe_price IS NULL
    `

    // Remove the default constraint for future inserts (optional)
    await sql`
      ALTER TABLE new_products 
      ALTER COLUMN europe_price DROP DEFAULT
    `

    // Verify the column was added
    const verifyColumn = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'new_products' 
      AND column_name = 'europe_price'
    `

    if (verifyColumn.length > 0) {
      console.log("Successfully added europe_price column:", verifyColumn[0])

      // Get a sample of products to verify
      const sampleProducts = await sql`
        SELECT objectid, title, price, europe_price 
        FROM new_products 
        LIMIT 5
      `

      console.log("Sample products with new column:", sampleProducts)

      return NextResponse.json({
        success: true,
        message: "Successfully added europe_price column to new_products table with default value 0",
        columnInfo: verifyColumn[0],
        sampleProducts: sampleProducts,
      })
    } else {
      throw new Error("Column was not added successfully")
    }
  } catch (error) {
    console.error("Error adding europe_price column:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add europe_price column to new_products table",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST method to update existing products with sample European prices (optional)
export async function POST(request: Request) {
  try {
    const sql = getSql()
    const body = await request.json()
    const { addSamplePrices = false } = body

    if (addSamplePrices) {
      console.log("Adding sample European prices to products...")

      // Update products with sample European prices (20% higher than regular price)
      await sql`
        UPDATE new_products 
        SET europe_price = ROUND(CAST(price AS NUMERIC) * 1.2, 2)
        WHERE price IS NOT NULL 
        AND europe_price IS NULL
        AND (deleted = false OR deleted IS NULL)
      `

      const updatedProducts = await sql`
        SELECT COUNT(*) as count 
        FROM new_products 
        WHERE europe_price IS NOT NULL
      `

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedProducts[0].count} products with sample European prices`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "No action taken. Set addSamplePrices to true to add sample prices.",
    })
  } catch (error) {
    console.error("Error updating European prices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update European prices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
