import { NextResponse } from "next/server"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL!)

// Helper to get table columns (cache this in a real app for performance)
async function getTableColumns(db: NeonQueryFunction<false, false>, tableName: string): Promise<string[]> {
  const result = await db`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName};
  `
  return result.map((row: any) => row.column_name)
}

// Zod schema for basic validation (extend as needed)
const SubcategoryUpdateSchema = z
  .object({
    id: z.string().min(1).optional(), // ID from URL params
    title: z.string().min(1).optional(),
    cateid: z.string().min(1).optional(), // Assuming cateid is also string UUID or similar
    description: z.string().nullable().optional(),
    photourl: z.string().url().or(z.string().nullable()).optional(),
    deleted: z.boolean().optional(),
  })
  .catchall(z.any()) // Allow other dynamic fields

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subcategoryId } = await params
    const body = await request.json()

    if (!subcategoryId) {
      return NextResponse.json({ success: false, error: "ID на подкатегорията е задължително." }, { status: 400 })
    }

    const validationResult = SubcategoryUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.flatten())
      return NextResponse.json(
        { success: false, error: "Невалидни данни.", details: validationResult.error.flatten() },
        { status: 400 },
      )
    }

    const updateData = validationResult.data

    // Remove id from updateData since it's used in WHERE clause
    if (updateData.id) {
      delete updateData.id
    }

    // Fetch valid column names for 'subcategories' table
    const validColumns = await getTableColumns(sql, "subcategories")
    console.log("[v0] Valid columns from DB:", validColumns)
    console.log("[v0] Update data keys:", Object.keys(updateData))
    console.log("[v0] Title in updateData:", updateData.title)
    console.log("[v0] Description in updateData:", updateData.description)

    const setClauses: string[] = []
    const values: any[] = []
    let valueIndex = 1

    // Track if updatedat is already added to avoid duplicates
    let updatedatAdded = false

    for (const key in updateData) {
      if (Object.prototype.hasOwnProperty.call(updateData, key) && validColumns.includes(key)) {
        // Skip 'Document ID', 'objectid' (legacy), and 'createdat' from SET clauses
        if (key === "Document ID" || key === "createdat" || key === "objectid") continue

        // Handle updatedat specially to avoid duplicates
        if (key === "updatedat") {
          if (!updatedatAdded) {
            setClauses.push(`"${key}" = $${valueIndex++}`)
            values.push(updateData[key])
            updatedatAdded = true
          }
          continue
        }

        setClauses.push(`"${key}" = $${valueIndex++}`)
        values.push(updateData[key])
      }
    }

    // Always add updatedat if not already added
    if (validColumns.includes("updatedat") && !updatedatAdded) {
      setClauses.push(`"updatedat" = $${valueIndex++}`)
      values.push(new Date().toISOString())
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, error: "Няма данни за обновяване." }, { status: 400 })
    }

    values.push(subcategoryId) // Add the ID for the WHERE clause

    const query = `UPDATE subcategories SET ${setClauses.join(", ")} WHERE "Document ID" = $${valueIndex} RETURNING *;`

    console.log("[v0] Final SET clauses:", setClauses)
    console.log("[v0] Executing SQL query:", query)
    console.log("[v0] With values:", JSON.stringify(values))
    console.log("[v0] WHERE Document ID =", subcategoryId)

    // First, verify the record exists
    const existingRecord = await sql`SELECT "Document ID", title FROM subcategories WHERE "Document ID" = ${subcategoryId}`
    console.log("[v0] Existing record check:", existingRecord?.length > 0 ? `Found: ${existingRecord[0].title}` : "NOT FOUND")

    if (!existingRecord || existingRecord.length === 0) {
      console.log("[v0] No record found with Document ID:", subcategoryId)
      return NextResponse.json(
        { success: false, error: `Подкатегорията с ID ${subcategoryId} не е намерена.` },
        { status: 404 },
      )
    }

    // Execute the update - build a parameterized query manually since we have dynamic columns
    try {
      // Use a raw SQL approach with direct template literal for better neon compatibility
      // First, construct the SET part as a string with actual values for simpler execution
      const updateParts: string[] = []
      
      // Re-build the SET clauses with direct value insertion for the tagged template approach
      let paramIndex = 0
      const updateValues: any[] = []
      
      for (const key in updateData) {
        if (Object.prototype.hasOwnProperty.call(updateData, key) && validColumns.includes(key)) {
          if (key === "Document ID" || key === "createdat" || key === "objectid") continue
          updateValues.push(updateData[key])
          paramIndex++
        }
      }
      
      // Add updatedat
      if (validColumns.includes("updatedat")) {
        updateValues.push(new Date().toISOString())
      }
      
      console.log("[v0] Executing UPDATE with sql.unsafe")
      console.log("[v0] SET clauses:", setClauses.join(", "))
      console.log("[v0] Values count:", values.length)
      
      // Execute the update
      const updateResult = await sql.unsafe(
        `UPDATE subcategories SET ${setClauses.join(", ")} WHERE "Document ID" = $${valueIndex}`,
        values
      )
      
      console.log("[v0] UPDATE raw result:", JSON.stringify(updateResult))
      
      // Always fetch the updated record after update to verify and return
      const updatedRecord = await sql`SELECT * FROM subcategories WHERE "Document ID" = ${subcategoryId}`
      console.log("[v0] Fetched updated record title:", updatedRecord?.[0]?.title)
      console.log("[v0] Fetched updated record description:", updatedRecord?.[0]?.description)

      if (updatedRecord && updatedRecord.length > 0) {
        // Verify the update actually happened by comparing with what we sent
        const actualTitle = updatedRecord[0]?.title
        const expectedTitle = updateData.title
        console.log("[v0] Verification - Expected title:", expectedTitle, "Actual title:", actualTitle)
        
        if (expectedTitle && actualTitle !== expectedTitle) {
          console.error("[v0] UPDATE did not persist! Expected:", expectedTitle, "Got:", actualTitle)
          // Try alternative update method
          console.log("[v0] Attempting direct update with template literal")
          
          // For critical fields, do a direct update
          if (updateData.title !== undefined) {
            await sql`UPDATE subcategories SET title = ${updateData.title}, updatedat = ${new Date().toISOString()} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.description !== undefined) {
            await sql`UPDATE subcategories SET description = ${updateData.description} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.cateid !== undefined) {
            await sql`UPDATE subcategories SET cateid = ${updateData.cateid} WHERE "Document ID" = ${subcategoryId}`
          }
          
          // SEO fields direct update
          if (updateData.seo_meta_title !== undefined) {
            await sql`UPDATE subcategories SET seo_meta_title = ${updateData.seo_meta_title} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_meta_description !== undefined) {
            await sql`UPDATE subcategories SET seo_meta_description = ${updateData.seo_meta_description} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_meta_keywords !== undefined) {
            await sql`UPDATE subcategories SET seo_meta_keywords = ${updateData.seo_meta_keywords} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_meta_title_bg !== undefined) {
            await sql`UPDATE subcategories SET seo_meta_title_bg = ${updateData.seo_meta_title_bg} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_meta_description_bg !== undefined) {
            await sql`UPDATE subcategories SET seo_meta_description_bg = ${updateData.seo_meta_description_bg} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_meta_keywords_bg !== undefined) {
            await sql`UPDATE subcategories SET seo_meta_keywords_bg = ${updateData.seo_meta_keywords_bg} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_og_title !== undefined) {
            await sql`UPDATE subcategories SET seo_og_title = ${updateData.seo_og_title} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_og_description !== undefined) {
            await sql`UPDATE subcategories SET seo_og_description = ${updateData.seo_og_description} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_og_image !== undefined) {
            await sql`UPDATE subcategories SET seo_og_image = ${updateData.seo_og_image} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_og_title_bg !== undefined) {
            await sql`UPDATE subcategories SET seo_og_title_bg = ${updateData.seo_og_title_bg} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_og_description_bg !== undefined) {
            await sql`UPDATE subcategories SET seo_og_description_bg = ${updateData.seo_og_description_bg} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_twitter_card !== undefined) {
            await sql`UPDATE subcategories SET seo_twitter_card = ${updateData.seo_twitter_card} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_twitter_title !== undefined) {
            await sql`UPDATE subcategories SET seo_twitter_title = ${updateData.seo_twitter_title} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_twitter_description !== undefined) {
            await sql`UPDATE subcategories SET seo_twitter_description = ${updateData.seo_twitter_description} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_twitter_image !== undefined) {
            await sql`UPDATE subcategories SET seo_twitter_image = ${updateData.seo_twitter_image} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_canonical_url !== undefined) {
            await sql`UPDATE subcategories SET seo_canonical_url = ${updateData.seo_canonical_url} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_robots !== undefined) {
            await sql`UPDATE subcategories SET seo_robots = ${updateData.seo_robots} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_schema_type !== undefined) {
            await sql`UPDATE subcategories SET seo_schema_type = ${updateData.seo_schema_type} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_focus_keyword !== undefined) {
            await sql`UPDATE subcategories SET seo_focus_keyword = ${updateData.seo_focus_keyword} WHERE "Document ID" = ${subcategoryId}`
          }
          if (updateData.seo_secondary_keywords !== undefined) {
            await sql`UPDATE subcategories SET seo_secondary_keywords = ${updateData.seo_secondary_keywords} WHERE "Document ID" = ${subcategoryId}`
          }
          
          // Fetch again after direct update
          const finalRecord = await sql`SELECT * FROM subcategories WHERE "Document ID" = ${subcategoryId}`
          console.log("[v0] After direct update - title:", finalRecord?.[0]?.title)
          
          return NextResponse.json({
            success: true,
            message: "Подкатегорията беше обновена успешно.",
            subcategory: finalRecord[0],
          })
        }
        
        return NextResponse.json({
          success: true,
          message: "Подкатегорията беше обновена успешно.",
          subcategory: updatedRecord[0],
        })
      }

      return NextResponse.json(
        { success: false, error: "Неуспешно обновяване на подкатегорията." },
        { status: 500 },
      )
    } catch (sqlError) {
      console.error("[v0] SQL execution error:", sqlError)
      throw sqlError
    }
  } catch (error) {
    console.error("Error updating subcategory:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json(
      {
        success: false,
        error: `Грешка при обновяване на подкатегорията: ${errorMessage}`,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}

// GET method for fetching single subcategory (if needed)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subcategoryId } = await params

    if (!subcategoryId) {
      return NextResponse.json({ success: false, error: "ID на подкатегорията е задължително." }, { status: 400 })
    }

    const result = await sql`
      SELECT s.*, c.title as categoryTitle 
      FROM subcategories s
      LEFT JOIN categories c ON s.cateid = c."Document ID"
      WHERE s."Document ID" = ${subcategoryId}
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, error: "Подкатегорията не е намерена." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      subcategory: result[0],
    })
  } catch (error) {
    console.error("Error fetching subcategory:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json(
      {
        success: false,
        error: `Грешка при зареждане на подкатегорията: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
