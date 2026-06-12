"use server"

import { sql } from "@vercel/postgres"
import bcrypt from "bcryptjs"

interface RegisterCustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  companyName: string
  companyAddress: string
  companyPhone: string
  customerType: string // Добавяме поле за тип клиент
}

export async function registerCustomer(data: RegisterCustomerData) {
  try {
    // Проверяваме дали клиентът вече съществува по имейл
    const existingCustomerByEmail = await sql`
      SELECT "Document ID" FROM customers WHERE "Document ID" = ${data.email}
    `

    if (existingCustomerByEmail.rows.length > 0) {
      return {
        error: true,
        message: "Клиент с този имейл вече съществува.",
      }
    }

    // Проверяваме дали клиентът вече съществува по телефон
    const existingCustomerByPhone = await sql`
      SELECT "Document ID" FROM customers WHERE "Phone" = ${data.phone}
    `

    if (existingCustomerByPhone.rows.length > 0) {
      return {
        error: true,
        message: "Клиент с този телефон вече съществува.",
      }
    }

    // Хеширане на паролата
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Генериране на уникален Document ID
    const documentId = data.email // Използваме имейла като Document ID

    // Валидиране на типа клиент
    const validTypes = ["standard", "retailer", "wholesaler"]
    const customerType = validTypes.includes(data.customerType) ? data.customerType : "standard"

    // Създаване на нов клиент
    const result = await sql`
      INSERT INTO customers (
        "Document ID",
        "Store Name",
        "Company Name", 
        "Phone",
        "Address",
        "Password",
        "First Name",
        "Last Name",
        "Status",
        "type"
      ) VALUES (
        ${documentId},
        ${data.companyName},
        ${data.companyName},
        ${data.phone},
        ${data.companyAddress},
        ${hashedPassword},
        ${data.firstName},
        ${data.lastName},
        'pending',
        ${customerType}
      )
      RETURNING "Document ID"
    `

    if (result.rows.length > 0) {
      return {
        success: true,
        message: "Регистрацията е успешна! Вашият акаунт чака одобрение от администратор.",
      }
    } else {
      return {
        error: true,
        message: "Възникна грешка при създаването на акаунта.",
      }
    }
  } catch (error) {
    console.error("Грешка при регистрация:", error)
    return {
      error: true,
      message: "Възникна техническа грешка. Моля опитайте отново.",
    }
  }
}

export async function loginCustomer(phone: string, password: string) {
  try {
    // Намираме клиента по телефон
    const customer = await sql`
      SELECT "Document ID", "Password", "Status", "Store Name", "First Name", "Last Name", "Phone", "type"
      FROM customers 
      WHERE "Phone" = ${phone}
    `

    if (customer.rows.length === 0) {
      return {
        error: true,
        message: "Невалиден телефон или парола.",
      }
    }

    const customerData = customer.rows[0]

    // Проверяваме статуса на акаунта
    if (customerData.Status === "pending") {
      return {
        error: true,
        message: "Вашият акаунт все още чака одобрение от администратор.",
      }
    }

    if (customerData.Status === "inactive" || customerData.Status === "suspended") {
      return {
        error: true,
        message: "Вашият акаунт е деактивиран. Свържете се с администратор.",
      }
    }

    // Проверяваме паролата
    const isPasswordValid = await bcrypt.compare(password, customerData.Password)

    if (!isPasswordValid) {
      return {
        error: true,
        message: "Невалиден телефон или парола.",
      }
    }

    return {
      success: true,
      customer: {
        id: customerData["Document ID"],
        email: customerData["Document ID"],
        phone: customerData["Phone"],
        storeName: customerData["Store Name"],
        firstName: customerData["First Name"],
        lastName: customerData["Last Name"],
        status: customerData.Status,
        type: customerData.type, // Добавяме типа клиент в отговора
      },
    }
  } catch (error) {
    console.error("Грешка при вход:", error)
    return {
      error: true,
      message: "Възникна техническа грешка. Моля опитайте отново.",
    }
  }
}
