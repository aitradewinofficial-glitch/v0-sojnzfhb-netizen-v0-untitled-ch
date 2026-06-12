"use server"

import { dbInitialized, getSubcategories as fetchAllSubcategories, executeQueryWithRetry } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { QueryResultRow } from "@vercel/postgres" // Променено от @neondatabase/serverless, ако използвате Vercel Postgres

interface FetchedSubcategory {
  id: string
  title: string
}

interface QuantityPromotionRow extends QueryResultRow {
  id: number // promotion_id
  subcategory_id: string
  customer_type: string | null
  min_quantity: number
  bonus_quantity: number
  description: string | null
  is_active: boolean
  deleted: boolean
  created_at: Date
  updated_at: Date
}

export interface ActivePromotionInfo {
  promotion_id: number
  customer_type: string | null
  min_quantity: number
  bonus_quantity: number
  description: string | null
}

export interface SubcategoryPromotionDisplay {
  id: string // subcategory_id
  title: string // subcategory_title
  active_promotions: ActivePromotionInfo[]
}

type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

async function checkDb(): Promise<ActionResult> {
  if (!dbInitialized) {
    console.error("[ACTION CHECKDB] Database not initialized.")
    return { success: false, error: "Базата данни не е инициализирана." }
  }
  // console.log("[ACTION CHECKDB] Database is initialized.");
  return { success: true }
}

export async function getSubcategoriesWithActivePromotions(): Promise<
  ActionResult & { data?: SubcategoryPromotionDisplay[] }
> {
  console.log("[ACTION LOG] getSubcategoriesWithActivePromotions: Called")
  const dbCheckResult = await checkDb()
  if (!dbCheckResult.success) {
    console.error("[ACTION LOG] getSubcategoriesWithActivePromotions: Database check failed.")
    return dbCheckResult
  }

  try {
    const subcategoriesFromDb: FetchedSubcategory[] = await fetchAllSubcategories()
    console.log(
      `[ACTION LOG] getSubcategoriesWithActivePromotions: Fetched ${subcategoriesFromDb?.length || 0} subcategories from DB.`,
    )

    if (!subcategoriesFromDb) {
      console.error("[ACTION LOG] getSubcategoriesWithActivePromotions: fetchAllSubcategories returned null/undefined.")
      return { success: false, error: "Грешка при извличане на подкатегории от lib/db." }
    }
    if (subcategoriesFromDb.length === 0) {
      console.log("[ACTION LOG] getSubcategoriesWithActivePromotions: No subcategories found.")
      return { success: true, data: [] }
    }

    const enrichedSubcategories: SubcategoryPromotionDisplay[] = []

    for (const sc of subcategoriesFromDb) {
      if (!sc || typeof sc.id === "undefined" || typeof sc.title === "undefined") {
        console.warn("[ACTION LOG] getSubcategoriesWithActivePromotions: Invalid subcategory data encountered:", sc)
        enrichedSubcategories.push({
          id: sc?.id || `invalid_id_${Math.random().toString(36).substring(7)}`,
          title: sc?.title || "Невалидна подкатегория",
          active_promotions: [],
        })
        continue // Skip to the next subcategory
      }

      // console.log(`[ACTION LOG] getSubcategoriesWithActivePromotions: Processing subcategory ID: ${sc.id}, Title: ${sc.title}`);
      let activePromotionsForSc: ActivePromotionInfo[] = []
      try {
        const promoQueryString = `
          SELECT id as promotion_id, subcategory_id, customer_type, min_quantity, bonus_quantity, description, is_active, deleted
          FROM quantity_promotions
          WHERE subcategory_id = $1
            AND is_active = true
            AND (deleted = false OR deleted IS NULL)
          ORDER BY customer_type ASC NULLS FIRST, updated_at DESC, created_at DESC
        `
        // console.log(`[ACTION LOG] getSubcategoriesWithActivePromotions: Attempting to execute query for subcategory ${sc.id}: SQL: "${promoQueryString}" PARAMS: [${sc.id}]`);

        // Използваме executeQueryWithRetry от lib/db.ts, ако е налично и подходящо, или директно sql.query
        // const promoResult = await sql.query(promoQueryString, [sc.id]); // Vercel Postgres
        const promoResult = await executeQueryWithRetry(promoQueryString, [sc.id]) // Neon specific from your lib/db

        // console.log(`[ACTION LOG] getSubcategoriesWithActivePromotions: Raw promoResult for subcategory ID ${sc.id}:`, JSON.stringify(promoResult, null, 2));

        // executeQueryWithRetry от вашия lib/db.ts връща директно масива с редове, а не обект с .rows
        if (promoResult && Array.isArray(promoResult)) {
          // console.log(`[ACTION LOG] getSubcategoriesWithActivePromotions: For subcategory ID ${sc.id}, fetched ${promoResult.length} active promotions. Rows:`, JSON.stringify(promoResult, null, 2));
          activePromotionsForSc = promoResult.map((p: any) => ({
            // Добавяме 'any' тук, тъй като структурата на p идва директно от executeQueryWithRetry
            promotion_id: p.promotion_id, // Уверете се, че имената на колоните съвпадат с тези в SELECT заявката
            customer_type: p.customer_type,
            min_quantity: p.min_quantity,
            bonus_quantity: p.bonus_quantity,
            description: p.description,
          }))
        } else {
          console.warn(
            `[ACTION LOG] getSubcategoriesWithActivePromotions: promoResult is not an array or promoResult is undefined/null for subcategory ID ${sc.id}. promoResult:`,
            promoResult,
          )
        }
      } catch (innerError) {
        console.error(
          `[ACTION LOG] getSubcategoriesWithActivePromotions: Error during DB query or processing for subcategory id: ${sc.id}, title: ${sc.title}:`,
          innerError,
        )
        // Дори при грешка, добавяме подкатегорията с празен списък промоции, за да не се счупи Promise.all
      }
      enrichedSubcategories.push({
        id: sc.id,
        title: sc.title,
        active_promotions: activePromotionsForSc,
      })
    }

    // console.log("[ACTION LOG] getSubcategoriesWithActivePromotions: Enriched subcategories data:", JSON.stringify(enrichedSubcategories, null, 2));
    return { success: true, data: enrichedSubcategories }
  } catch (error) {
    console.error("[ACTION LOG] getSubcategoriesWithActivePromotions: Critical error in outer try-catch:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестна критична грешка при извличане на подкатегориите."
    return { success: false, error: errorMessage }
  }
}

export async function applyPromotion(
  subcategoryIds: string[],
  minQuantity: number,
  bonusQuantity: number,
  customerType: string | null,
  description?: string | null,
): Promise<ActionResult> {
  console.log(
    `[ACTION LOG] applyPromotion: Called with subcategoryIds: ${subcategoryIds.join(", ")}, minQty: ${minQuantity}, bonusQty: ${bonusQuantity}, customerType: ${customerType}, description: ${description}`,
  )
  const dbCheck = await checkDb()
  if (!dbCheck.success) return dbCheck

  if (!subcategoryIds || subcategoryIds.length === 0) {
    return { success: false, error: "Моля, изберете поне една подкатегория." }
  }
  if (minQuantity == null || bonusQuantity == null || minQuantity <= 0 || bonusQuantity < 0) {
    return { success: false, error: "Количествата трябва да са валидни числа (купи > 0, безплатно >= 0)." }
  }

  try {
    for (const subcategoryId of subcategoryIds) {
      console.log(`[ACTION LOG] applyPromotion: Processing subcategory ${subcategoryId}`)
      const updateParams = customerType === null ? [subcategoryId] : [subcategoryId, customerType]
      const updateQueryString =
        customerType === null
          ? `UPDATE quantity_promotions
            SET is_active = false, deleted = true, updated_at = CURRENT_TIMESTAMP
            WHERE subcategory_id = $1 AND customer_type IS NULL AND is_active = true;`
          : `UPDATE quantity_promotions
            SET is_active = false, deleted = true, updated_at = CURRENT_TIMESTAMP
            WHERE subcategory_id = $1 AND customer_type = $2 AND is_active = true;`

      const updateResult = await executeQueryWithRetry(updateQueryString, updateParams)
      console.log(
        `[ACTION LOG] applyPromotion: Deactivated existing promotions for subcategory ${subcategoryId}, type ${customerType || "general"}. Rows affected: ${updateResult.rowCount || updateResult.length}`, // .rowCount за Vercel PG, .length за Neon директно
      )

      const insertParams = [subcategoryId, customerType, minQuantity, bonusQuantity, description || null]
      const insertQueryString = `
        INSERT INTO quantity_promotions (
          subcategory_id, customer_type, min_quantity, bonus_quantity, description,
          is_active, deleted, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
      `
      const insertResult = await executeQueryWithRetry(insertQueryString, insertParams)
      console.log(
        `[ACTION LOG] applyPromotion: Inserted new promotion for subcategory ${subcategoryId}, type ${customerType || "general"}. Rows affected: ${insertResult.rowCount || insertResult.length}`,
      )
    }
    revalidatePath("/admin-panel/promotions")
    revalidatePath("/product", "layout")
    revalidatePath("/category", "layout")
    revalidatePath("/subcategory", "layout")
    console.log("[ACTION LOG] applyPromotion: Successfully applied promotion and revalidated paths.")
    return { success: true }
  } catch (error) {
    console.error("[ACTION LOG] applyPromotion: Error applying promotion:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка при прилагане на промоцията."
    return { success: false, error: errorMessage }
  }
}

export async function removePromotion(subcategoryIds: string[], customerType: string | null): Promise<ActionResult> {
  console.log(
    `[ACTION LOG] removePromotion: Called with subcategoryIds: ${subcategoryIds.join(", ")}, customerType: ${customerType}`,
  )
  const dbCheck = await checkDb()
  if (!dbCheck.success) return dbCheck

  if (!subcategoryIds || subcategoryIds.length === 0) {
    return { success: false, error: "Моля, изберете поне една подкатегория." }
  }

  try {
    for (const subcategoryId of subcategoryIds) {
      console.log(`[ACTION LOG] removePromotion: Processing subcategory ${subcategoryId}`)
      const updateParams = customerType === null ? [subcategoryId] : [subcategoryId, customerType]
      const updateQueryString =
        customerType === null
          ? `UPDATE quantity_promotions
            SET is_active = false, deleted = true, updated_at = CURRENT_TIMESTAMP
            WHERE subcategory_id = $1 AND customer_type IS NULL AND is_active = true;`
          : `UPDATE quantity_promotions
            SET is_active = false, deleted = true, updated_at = CURRENT_TIMESTAMP
            WHERE subcategory_id = $1 AND customer_type = $2 AND is_active = true;`

      const updateResult = await executeQueryWithRetry(updateQueryString, updateParams)
      console.log(
        `[ACTION LOG] removePromotion: Removed promotion for subcategory ${subcategoryId}, type ${customerType || "general"}. Rows affected: ${updateResult.rowCount || updateResult.length}`,
      )
    }
    revalidatePath("/admin-panel/promotions")
    revalidatePath("/product", "layout")
    revalidatePath("/category", "layout")
    revalidatePath("/subcategory", "layout")
    console.log("[ACTION LOG] removePromotion: Successfully removed promotion and revalidated paths.")
    return { success: true }
  } catch (error) {
    console.error("[ACTION LOG] removePromotion: Error removing promotion:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка при премахване на промоцията."
    return { success: false, error: errorMessage }
  }
}

export async function removePromotionById(promotionId: number): Promise<ActionResult> {
  console.log(`[ACTION LOG] removePromotionById: Called with promotionId: ${promotionId}`)
  const dbCheck = await checkDb()
  if (!dbCheck.success) return dbCheck

  try {
    const updateQueryString = `
      UPDATE quantity_promotions
      SET is_active = false, deleted = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true;
    `
    const updateResult = await executeQueryWithRetry(updateQueryString, [promotionId])
    console.log(
      `[ACTION LOG] removePromotionById: Removed promotion by ID ${promotionId}. Rows affected: ${updateResult.rowCount || updateResult.length}`,
    )
    revalidatePath("/admin-panel/promotions")
    revalidatePath("/product", "layout")
    revalidatePath("/category", "layout")
    revalidatePath("/subcategory", "layout")
    console.log("[ACTION LOG] removePromotionById: Successfully removed promotion by ID and revalidated paths.")
    return { success: true }
  } catch (error) {
    console.error("[ACTION LOG] removePromotionById: Error removing promotion by ID:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестна грешка при премахване на промоцията по ID."
    return { success: false, error: errorMessage }
  }
}
