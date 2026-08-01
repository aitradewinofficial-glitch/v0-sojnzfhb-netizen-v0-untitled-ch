import { sql } from "@/lib/db"

const RECIPE_SLOTS = [
  { matCol: "label1_material_id", qtyCol: "label1_qty" },
  { matCol: "label2_material_id", qtyCol: "label2_qty" },
  { matCol: "sticker_material_id", qtyCol: "sticker_qty" },
  { matCol: "packaging_material_id", qtyCol: "packaging_qty" },
  { matCol: "box_material_id", qtyCol: "box_qty" },
] as const

/**
 * Коригира наличностите на материалите според рецептата на даден
 * производствен продукт.
 *
 * @param productKey  ключът на продукта от productions.product_name (напр. "production-12")
 * @param quantity    брой произведени изделия. Положително = изразходване
 *                    (намалява наличността); отрицателно = връщане.
 */
export async function applyMaterialUsage(productKey: string | null | undefined, quantity: number) {
  try {
    if (!productKey || typeof productKey !== "string" || !productKey.startsWith("production-")) {
      return
    }

    const producedQty = Number(quantity)
    if (!producedQty || Number.isNaN(producedQty)) return

    const productId = Number(productKey.replace("production-", ""))
    if (Number.isNaN(productId)) return

    const rows = await sql`
      SELECT
        label1_material_id, label1_qty,
        label2_material_id, label2_qty,
        sticker_material_id, sticker_qty,
        packaging_material_id, packaging_qty,
        box_material_id, box_qty
      FROM production_products
      WHERE id = ${productId}
    `

    if (rows.length === 0) return
    const recipe = rows[0] as Record<string, number | null>

    for (const slot of RECIPE_SLOTS) {
      const materialId = recipe[slot.matCol]
      const perUnit = Number(recipe[slot.qtyCol] || 0)
      if (!materialId || perUnit <= 0) continue

      const used = perUnit * producedQty
      await sql`
        UPDATE supply_materials
        SET stock = stock - ${used}, updated_at = NOW()
        WHERE id = ${materialId}
      `
    }
  } catch (error) {
    // Не спираме производството, ако корекцията на материали се провали
    console.error("[supply] applyMaterialUsage error:", error)
  }
}
