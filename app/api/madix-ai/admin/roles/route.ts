import { NextResponse } from "next/server"
import { getRoles, getAreas, getRoleAreas, setRoleAreas } from "@/lib/madix-ai/service"

export async function GET() {
  try {
    const [roles, areas] = await Promise.all([getRoles(), getAreas()])
    const withAreas = await Promise.all(
      roles.map(async (r) => ({
        ...r,
        areaIds: (await getRoleAreas(r.id)).map((a) => a.id),
      })),
    )
    return Response.json({ roles: withAreas, areas })
  } catch (err) {
    console.error("[v0] MADIX AI roles GET error:", err)
    return Response.json({ error: "Грешка при зареждане." }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { roleId, areaIds } = await req.json()
    if (!roleId || !Array.isArray(areaIds)) {
      return Response.json({ error: "Невалидни данни." }, { status: 400 })
    }
    await setRoleAreas(Number(roleId), areaIds.map(Number))
    return Response.json({ ok: true })
  } catch (err) {
    console.error("[v0] MADIX AI roles PUT error:", err)
    return Response.json({ error: "Грешка при запис на правата." }, { status: 500 })
  }
}
