import { getUsers, getRoles, getAreas } from "@/lib/madix-ai/service"

export async function GET() {
  try {
    const [users, roles, areas] = await Promise.all([getUsers(), getRoles(), getAreas()])
    return Response.json({ users, roles, areas })
  } catch (err) {
    console.error("[v0] MADIX AI meta error:", err)
    return Response.json({ error: "Грешка при зареждане на данните." }, { status: 500 })
  }
}
