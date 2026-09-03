import { getUsers, createUser } from "@/lib/madix-ai/service"

export async function GET() {
  try {
    return Response.json({ users: await getUsers() })
  } catch (err) {
    console.error("[v0] MADIX AI users GET error:", err)
    return Response.json({ error: "Грешка при зареждане." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, roleId, username, password } = await req.json()
    if (!name || !email || !username || !password) {
      return Response.json({ error: "Име, имейл, потребителско име и парола са задължителни." }, { status: 400 })
    }
    await createUser(String(name), String(email), roleId ? Number(roleId) : null, String(username), String(password))
    return Response.json({ ok: true })
  } catch (err) {
    console.error("[v0] MADIX AI users POST error:", err)
    return Response.json({ error: "Грешка при създаване на потребител." }, { status: 500 })
  }
}
