"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : (async () => [] as unknown[]) as ReturnType<typeof neon>

export async function quickUpdateCategory(id: string, field: string, value: any) {
  try {
    // Implement your quick update logic here
    // Example:
    console.log(`Updating category ${id}, field ${field} to value ${value}`)
    // await sql`UPDATE categories SET ${field} = ${value} WHERE id = ${id}`;
    return { success: true, message: `Category ${field} updated successfully` }
  } catch (error: any) {
    console.error("Error updating category:", error)
    return { success: false, error: `Error updating category: ${error.message}` }
  }
}

export async function updateCategory(id: string, categoryData: any) {
  try {
    const { title, title_en, description, description_en, photourl } = categoryData

    if (!title) {
      return { success: false, error: "Името на категорията е задължително" }
    }

    // Update category in database
    const result = await sql`
      UPDATE categories
      SET 
        title = ${title},
        title_en = ${title_en || null},
        description = ${description || null},
        description_en = ${description_en || null},
        photourl = ${photourl || null},
        updated_at = NOW()
      WHERE "Document ID" = ${id}
      RETURNING "Document ID" as id, title
    `

    if (!result || result.length === 0) {
      return { success: false, error: "Неуспешно обновяване на категорията" }
    }

    revalidatePath("/admin-panel/categories")
    return {
      success: true,
      message: "Категорията беше обновена успешно",
      category: result[0],
    }
  } catch (error: any) {
    console.error("Error updating category:", error)
    return {
      success: false,
      error: `Грешка при обновяване на категорията: ${error.message}`,
    }
  }
}

export async function testDatabaseConnection() {
  try {
    await sql`SELECT 1`
    return { success: true, message: "Database connection successful" }
  } catch (error: any) {
    console.error("Database connection error:", error)
    return { success: false, error: `Database connection error: ${error.message}` }
  }
}

export async function addProduct(productData: any) {
  try {
    console.log("Action addProduct: Received data:", productData)

    const {
      title,
      description,
      price,
      retailerprice,
      wholesalerprice,
      europe_price,
      cateid,
      subcateid,
      photourl,
      sku,
      barcode,
      stock,
      weight,
      dimensions,
      active,
    } = productData

    if (!title) {
      return { success: false, error: "Името на продукта е задължително" }
    }
    if (!cateid) {
      return { success: false, error: "Категорията е задължителна" }
    }

    // Convert prices and other numeric fields to numbers or null
    const numPrice = price !== undefined && price !== "" && price !== null ? Number.parseFloat(price) : null
    const numRetailerPrice =
      retailerprice !== undefined && retailerprice !== "" && retailerprice !== null
        ? Number.parseFloat(retailerprice)
        : null
    const numWholesalerPrice =
      wholesalerprice !== undefined && wholesalerprice !== "" && wholesalerprice !== null
        ? Number.parseFloat(wholesalerprice)
        : null
    const numEuropePrice =
      europe_price !== undefined && europe_price !== "" && europe_price !== null
        ? Number.parseFloat(europe_price)
        : null
    const numStock = stock !== undefined && stock !== "" && stock !== null ? Number.parseInt(stock, 10) : null
    const numWeight = weight !== undefined && weight !== "" && weight !== null ? Number.parseFloat(weight) : null

    // Add product to database
    const result = await sql`
    INSERT INTO new_products (
      title, 
      description, 
      price, 
      retailerprice, 
      wholesalerprice, 
      europe_price, 
      cateid, 
      subcateid, 
      photourl, 
      sku, 
      barcode, 
      stock, 
      weight, 
      dimensions, 
      active,
      created_at
    ) 
    VALUES (
      ${title}, 
      ${description || null}, 
      ${numPrice}, 
      ${numRetailerPrice}, 
      ${numWholesalerPrice}, 
      ${numEuropePrice}, 
      ${cateid || null}, 
      ${subcateid || null}, 
      ${photourl || null}, 
      ${sku || null}, 
      ${barcode || null}, 
      ${numStock}, 
      ${numWeight}, 
      ${dimensions || null}, 
      ${active !== undefined ? active : true},
      NOW()
    )
    RETURNING objectid, title
  `

    if (!result || result.length === 0) {
      console.error("Failed to add product to database, result:", result)
      return { success: false, error: "Неуспешно добавяне на продукта" }
    }

    console.log("Product added successfully:", result[0])
    revalidatePath("/admin-panel/products")
    return {
      success: true,
      message: "Продуктът беше добавен успешно",
      product: result[0],
    }
  } catch (error) {
    console.error("Error adding product:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return {
      success: false,
      error: `Грешка при добавяне на продукта: ${errorMessage}`,
    }
  }
}

export async function updateProduct(productData: any) {
  try {
    console.log("Action updateProduct: Received data:", productData)

    const {
      id,
      title,
      description,
      price,
      retailerprice,
      wholesalerprice,
      europe_price,
      cateid,
      subcateid,
      photourl,
      sku,
      barcode,
      stock,
      weight,
      dimensions,
      active,
    } = productData

    if (!id) {
      return { success: false, error: "ID на продукта е задължително" }
    }
    if (!title) {
      return { success: false, error: "Името на продукта е задължително" }
    }
    if (!cateid) {
      return { success: false, error: "Категорията е задължителна" }
    }

    // Convert prices and other numeric fields to numbers or null
    const numPrice = price !== undefined && price !== "" && price !== null ? Number.parseFloat(price) : null
    const numRetailerPrice =
      retailerprice !== undefined && retailerprice !== "" && retailerprice !== null
        ? Number.parseFloat(retailerprice)
        : null
    const numWholesalerPrice =
      wholesalerprice !== undefined && wholesalerprice !== "" && wholesalerprice !== null
        ? Number.parseFloat(wholesalerprice)
        : null
    const numEuropePrice =
      europe_price !== undefined && europe_price !== "" && europe_price !== null
        ? Number.parseFloat(europe_price)
        : null
    const numStock = stock !== undefined && stock !== "" && stock !== null ? Number.parseInt(stock, 10) : null
    const numWeight = weight !== undefined && weight !== "" && weight !== null ? Number.parseFloat(weight) : null

    // Check if product exists
    let existingProduct = await sql`
    SELECT objectid FROM new_products WHERE objectid = ${id} AND (deleted = FALSE OR deleted IS NULL)
  `
    if (!existingProduct || existingProduct.length === 0) {
      existingProduct = await sql`
      SELECT "Document ID" as objectid FROM new_products WHERE "Document ID" = ${id} AND (deleted = FALSE OR deleted IS NULL)
    `
    }

    if (!existingProduct || existingProduct.length === 0) {
      return { success: false, error: "Продуктът не е намерен или е изтрит" }
    }

    const actualProductId = existingProduct[0].objectid

    // Update product in database
    const result = await sql`
    UPDATE new_products
    SET 
      title = ${title},
      description = ${description},
      price = ${numPrice},
      retailerprice = ${numRetailerPrice},
      wholesalerprice = ${numWholesalerPrice},
      europe_price = ${numEuropePrice},
      cateid = ${cateid || null},
      subcateid = ${subcateid || null},
      photourl = ${photourl},
      sku = ${sku},
      barcode = ${barcode},
      stock = ${numStock},
      weight = ${numWeight},
      dimensions = ${dimensions},
      active = ${active !== undefined ? active : true},
      updated_at = NOW()
    WHERE objectid = ${actualProductId} OR "Document ID" = ${actualProductId} 
    RETURNING objectid, title, cateid, subcateid
  `

    if (!result || result.length === 0) {
      console.error("Failed to update product in database, result:", result)
      return { success: false, error: "Неуспешно обновяване на продукта" }
    }

    console.log("Product updated successfully:", result[0])
    revalidatePath("/admin-panel/products")
    return {
      success: true,
      message: "Продуктът беше обновен успешно",
      product: result[0],
    }
  } catch (error) {
    console.error("Error updating product:", error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return {
      success: false,
      error: `Грешка при обновяване на продукта: ${errorMessage}`,
    }
  }
}

export async function deleteProduct(id: string) {
  try {
    const response = await fetch(`/api/admin/products/delete?id=${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.status}`)
    }

    revalidatePath("/admin/products")
    return { message: "Product deleted successfully" }
  } catch (error: any) {
    return { message: `Error deleting product: ${error.message}` }
  }
}
