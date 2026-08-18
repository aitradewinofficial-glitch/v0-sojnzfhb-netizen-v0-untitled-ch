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
    const { name, email, roleId } = await req.json()
    if (!name || !email) {
      return Response.json({ error: "Име и имейл са задължителни." }, { status: 400 })
    }
    await createUser(String(name), String(email), roleId ? Number(roleId) : null)
    return Response.json({ ok: true })
  } catch (err) {
    console.error("[v0] MADIX AI users POST error:", err)
    return Response.json({ error: "Грешка при създаване на потребител." }, { status: 500 })
  }
}
