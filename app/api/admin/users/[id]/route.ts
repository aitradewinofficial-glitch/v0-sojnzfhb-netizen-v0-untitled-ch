import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// GET /api/admin/users/[id] - Извличане на потребител по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`Извличане на потребител с ID: ${id}`)

    const result = await sql`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        created_at, 
        approval_status,
        first_name,
        last_name,
        phone,
        is_active,
        email_verified,
        updated_at
      FROM users
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error(`Грешка при извличане на потребител с ID ${params.id}:`, error)
    return NextResponse.json({ error: "Грешка при извличане на потребител" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Обновяване на потребител
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { name, email, password, role, first_name, last_name, phone, is_active, email_verified, approval_status } =
      body

    console.log(`Обновяване на потребител с ID: ${id}`)

    // Проверка дали потребителят съществува
    const existingUser = await sql`SELECT id FROM users WHERE id = ${id}`
    if (existingUser.length === 0) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 })
    }

    // Изграждане на заявката за обновяване
    let updateQuery = `
      UPDATE users
      SET updated_at = CURRENT_TIMESTAMP
    `
    const queryParams: any[] = []
    let paramIndex = 1

    // Добавяне на полетата за обновяване
    if (name !== undefined) {
      updateQuery += `, name = $${paramIndex}`
      queryParams.push(name)
      paramIndex++
    }

    if (email !== undefined) {
      updateQuery += `, email = $${paramIndex}`
      queryParams.push(email)
      paramIndex++
    }

    if (password !== undefined && password !== "") {
      updateQuery += `, password = $${paramIndex}`
      queryParams.push(password)
      paramIndex++
    }

    if (role !== undefined) {
      updateQuery += `, role = $${paramIndex}`
      queryParams.push(role)
      paramIndex++
    }

    if (first_name !== undefined) {
      updateQuery += `, first_name = $${paramIndex}`
      queryParams.push(first_name)
      paramIndex++
    }

    if (last_name !== undefined) {
      updateQuery += `, last_name = $${paramIndex}`
      queryParams.push(last_name)
      paramIndex++
    }

    if (phone !== undefined) {
      updateQuery += `, phone = $${paramIndex}`
      queryParams.push(phone)
      paramIndex++
    }

    if (is_active !== undefined) {
      updateQuery += `, is_active = $${paramIndex}`
      queryParams.push(is_active)
      paramIndex++
    }

    if (email_verified !== undefined) {
      updateQuery += `, email_verified = $${paramIndex}`
      queryParams.push(email_verified)
      paramIndex++
    }

    if (approval_status !== undefined) {
      updateQuery += `, approval_status = $${paramIndex}`
      queryParams.push(approval_status)
      paramIndex++
    }

    // Добавяне на условието WHERE и RETURNING
    updateQuery += `
      WHERE id = $${paramIndex}
      RETURNING id, name, email, role, updated_at
    `
    queryParams.push(id)

    // Изпълнение на заявката
    const result = await sql.unsafe(updateQuery, queryParams)

    // Обновяване на кеша
    revalidatePath("/admin-panel/users")
    revalidatePath(`/admin-panel/users/edit/${id}`)

    return NextResponse.json({ success: true, user: result[0] })
  } catch (error) {
    console.error(`Грешка при обновяване на потребител с ID ${params.id}:`, error)
    return NextResponse.json({ error: "Грешка при обновяване на потребител" }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Изтриване на потребител
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`Изтриване на потребител с ID: ${id}`)

    // Проверка дали потребителят съществува
    const existingUser = await sql`SELECT id FROM users WHERE id = ${id}`
    if (existingUser.length === 0) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 })
    }

    // Изтриване на потребителя (или деактивиране)
    // Вариант 1: Физическо изтриване
    // await sql`DELETE FROM users WHERE id = ${id}`

    // Вариант 2: Логическо изтриване (препоръчително)
    await sql`UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`

    // Обновяване на кеша
    revalidatePath("/admin-panel/users")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Грешка при изтриване на потребител с ID ${params.id}:`, error)
    return NextResponse.json({ error: "Грешка при изтриване на потребител" }, { status: 500 })
  }
}
