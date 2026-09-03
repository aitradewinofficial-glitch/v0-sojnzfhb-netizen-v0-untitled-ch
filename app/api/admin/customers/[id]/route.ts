import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`[API GET /api/admin/customers/${params.id}] Received GET request. Target ID: ${params.id}`)
  try {
    const customerId = params.id
    let result = await sql`
      SELECT *
      FROM customers
      WHERE "Document ID" = ${customerId}
    `

    if (result.length === 0) {
      console.log(`[API GET /api/admin/customers/${params.id}] Customer not found by Document ID, trying by objectid.`)
      result = await sql`
        SELECT *
        FROM customers
        WHERE objectid = ${customerId}
      `
    }

    if (result.length === 0) {
      console.warn(`[API GET /api/admin/customers/${params.id}] Customer not found by either ID.`)
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 })
    }

    const customerData = {
      ...result[0],
      id: result[0]["Document ID"],
      marshrut: result[0].marshrut || "",
      password: result[0].password || "",
    }
    console.log(`[API GET /api/admin/customers/${params.id}] Returning customer data`)
    return NextResponse.json(customerData)
  } catch (error) {
    console.error(`[API GET /api/admin/customers/${params.id}] Error fetching customer:`, error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json({ error: "Грешка при извличане на клиента", details: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`[API PUT /api/admin/customers/${params.id}] Received PUT request. Target ID: ${params.id}`)
  try {
    const body = await request.json()
    console.log(`[API PUT /api/admin/customers/${params.id}] Request body:`, body)

    const customerId = params.id

    // First, let's find the customer to make sure they exist
    let existingCustomer = await sql`
      SELECT "Document ID", objectid
      FROM customers
      WHERE "Document ID" = ${customerId}
    `

    if (existingCustomer.length === 0) {
      existingCustomer = await sql`
        SELECT "Document ID", objectid
        FROM customers
        WHERE objectid = ${customerId}
      `
    }

    if (existingCustomer.length === 0) {
      console.warn(`[API PUT /api/admin/customers/${params.id}] Customer not found`)
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 })
    }

    const targetDocumentId = existingCustomer[0]["Document ID"]
    console.log(`[API PUT /api/admin/customers/${params.id}] Found customer with Document ID: ${targetDocumentId}`)

    // Update only the columns that exist in the database
    const result = await sql`
      UPDATE customers
      SET 
        objectid = ${body.objectid || null},
        storename = ${body.storename || ""},
        companyname = ${body.companyname || null},
        phone = ${body.phone || null},
        marshrut = ${body.marshrut || null},
        type = ${body.type || "standard"},
        discountpercent = ${body.discountpercent || "0"},
        password = ${body.password || ""},
        pending = ${body.pending || false},
        deleted = ${body.deleted || false},
        createdbyadmin = ${body.createdbyadmin || true}
      WHERE "Document ID" = ${targetDocumentId}
      RETURNING "Document ID", password, phone, storename, marshrut, type, discountpercent
    `

    console.log(`[API PUT /api/admin/customers/${params.id}] Update result:`, result)

    if (result.rowCount === 0) {
      console.warn(`[API PUT /api/admin/customers/${params.id}] No rows updated`)
      return NextResponse.json({ error: "Не успях да обновя клиента" }, { status: 500 })
    }

    const updatedCustomer = result[0]
    console.log(`[API PUT /api/admin/customers/${params.id}] Successfully updated customer:`, updatedCustomer)

    revalidatePath("/admin-panel/users")
    revalidatePath(`/admin-panel/users/edit/${params.id}`)

    return NextResponse.json({
      success: true,
      message: "Клиентът беше обновен успешно",
      updatedCustomer: updatedCustomer,
    })
  } catch (error) {
    console.error(`[API PUT /api/admin/customers/${params.id}] Error during update:`, error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна сървърна грешка"
    return NextResponse.json({ error: "Грешка при обновяване на клиента", details: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`[API DELETE /api/admin/customers/${params.id}] Received DELETE request. Target ID: ${params.id}`)
  try {
    const result = await sql`
      DELETE FROM customers
      WHERE ("Document ID" = ${params.id} OR objectid = ${params.id})
      RETURNING "Document ID"
    `
    console.log(`[API DELETE /api/admin/customers/${params.id}] SQL Execution Result:`, result)
    if (result.rowCount === 0) {
      console.warn(
        `[API DELETE /api/admin/customers/${params.id}] No rows deleted. Customer ID ${params.id} might not exist.`,
      )
      return NextResponse.json({ error: "Клиентът не е намерен с посоченото ID" }, { status: 404 })
    }

    revalidatePath("/admin-panel/users")
    console.log(`[API DELETE /api/admin/customers/${params.id}] Path revalidated. Sending success response.`)
    return NextResponse.json({ success: true, deletedCustomerId: result[0] ? result[0]["Document ID"] : null })
  } catch (error) {
    console.error(`[API DELETE /api/admin/customers/${params.id}] Error during deletion:`, error)
    const errorMessage = error instanceof Error ? error.message : "Неизвестна грешка"
    return NextResponse.json({ error: "Грешка при изтриване на клиента", details: errorMessage }, { status: 500 })
  }
}
