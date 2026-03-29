import { cookies } from "next/headers"
import { jwtVerify } from "jose"

// Използваме същата константа за JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || "madix-groundbaits-secret-key-2024"

export type User = {
  id: string
  name?: string
  email?: string
  phone?: string
  role?: string
  isCustomer?: boolean
  customerType?: string | null
  discountPercent?: number
  storeName?: string | null
  companyName?: string | null
  deliveryAddress?: string | null // Добавяме deliveryAddress
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")

    if (!token || !token.value) {
      return null
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token.value, secret)

    if (!payload.id) {
      return null
    }

    // Log the payload to check the customerType
    console.log("JWT Payload:", payload)

    // Извличаме customerType и го нормализираме
    let customerType = (payload.customerType as string) || null

    // Проверяваме дали customerType съдържа "european" или "europen" (с различни варианти на главни/малки букви)
    const isEuropean = customerType?.toLowerCase().includes("europ")

    // Ако е европейски клиент, нормализираме стойността
    if (isEuropean) {
      customerType = "european"
      console.log("Normalized customer type to 'european'")
    }

    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      phone: payload.phone as string,
      role: payload.role as string,
      isCustomer: payload.isCustomer as boolean,
      customerType: customerType,
      discountPercent: (payload.discountPercent as number) || 0,
      storeName: (payload.storeName as string) || null,
      companyName: (payload.companyName as string) || null,
      deliveryAddress: (payload.deliveryAddress as string) || null, // Извличаме deliveryAddress
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return user !== null
}

export async function getUserRole(): Promise<string | null> {
  const user = await getUser()
  return user ? user.role : null
}
