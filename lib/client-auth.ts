import type { User } from "./auth"

/**
 * Тази функция се изпълнява на клиента (в браузъра)
 * и извлича данните за текущия потребител, като прави заявка към API.
 */
export async function getUser(): Promise<User | null> {
  try {
    // Правим заявка към нашия API ендпойнт, който проверява бисквитката на сървъра
    const response = await fetch("/api/auth/check", {
      cache: "no-store", // Винаги взимай най-актуалния статус
    })

    if (!response.ok) {
      console.error("Failed to fetch user status:", response.statusText)
      return null
    }

    const data = await response.json()
    // Връщаме потребителските данни, ако потребителят е удостоверен
    return data.isAuthenticated ? data.user : null
  } catch (error) {
    console.error("Error fetching user status:", error)
    return null
  }
}

/**
 * Определя дали текущият контекст е за европейски клиент.
 * Тази функция може да се базира на localStorage или други клиентски индикатори.
 * За по-точна проверка, базирана на потребителски данни, използвайте user.customerType.
 */
export function isEuropeanCustomer(): boolean {
  if (typeof window !== "undefined") {
    const storedPreference = localStorage.getItem("isEuropeanCustomer")
    if (storedPreference) {
      try {
        return JSON.parse(storedPreference)
      } catch (e) {
        console.error("Error parsing isEuropeanCustomer from localStorage", e)
        // В случай на грешка при парсване, връщаме false, за да избегнем счупване.
        return false
      }
    }
  }
  // По подразбиране, ако няма настройка, приемаме, че не е европейски клиент.
  // Това може да се промени според нуждите на приложението.
  return false
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
    // Можете да добавите пренасочване или обновяване на UI тук
    window.location.href = "/" // Пренасочване към началната страница след изход
  } catch (error) {
    console.error("Error during logout:", error)
    // Добре е да информирате потребителя за грешката, ако е необходимо
    // toast({ title: "Грешка при изход", description: "Моля, опитайте отново.", variant: "destructive" })
  }
}
