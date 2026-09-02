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
    console.log("Checking and fixing new_products table schema")

    // Check if the europe_price column exists
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'new_products' 
      AND column_name = 'europe_price'
    `

    if (checkColumn.length > 0) {
      console.log("Column europe_price already exists in new_products table")
    } else {
      console.log("Adding europe_price column to new_products table")

      // Add the new column with a default value of 0
      await sql`
        ALTER TABLE new_products 
        ADD COLUMN europe_price NUMERIC(10, 2) DEFAULT 0
      `

      // Update all existing products to have europe_price = 0
      await sql`
        UPDATE new_products 
        SET europe_price = 0 
        WHERE europe_price IS NULL
      `

      console.log("Successfully added europe_price column to new_products table")
    }

    // Get a sample of products to verify
    const sampleProducts = await sql`
      SELECT objectid, title, price, europe_price 
      FROM new_products 
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      message: "Successfully checked and fixed new_products table schema",
      hasEuropePriceColumn: checkColumn.length > 0,
      sampleProducts: sampleProducts,
    })
  } catch (error) {
    console.error("Error fixing new_products schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix new_products table schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
