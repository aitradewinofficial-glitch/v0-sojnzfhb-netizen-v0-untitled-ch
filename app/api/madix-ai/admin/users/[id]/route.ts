import { updateUser, deleteUser } from "@/lib/madix-ai/service"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const fields: { name?: string; roleId?: number | null; active?: boolean; username?: string; password?: string } = {}
    if (body.name !== undefined) fields.name = String(body.name)
    if (body.roleId !== undefined) fields.roleId = body.roleId === null ? null : Number(body.roleId)
    if (body.active !== undefined) fields.active = Boolean(body.active)
    if (body.username !== undefined) fields.username = String(body.username)
    if (body.password !== undefined) fields.password = String(body.password)
    await updateUser(Number(id), fields)
    return Response.json({ ok: true })
  } catch (err) {
    console.error("[v0] MADIX AI user PATCH error:", err)
    return Response.json({ error: "Грешка при обновяване." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteUser(Number(id))
    return Response.json({ ok: true })
  } catch (err) {
    console.error("[v0] MADIX AI user DELETE error:", err)
    return Response.json({ error: "Грешка при изтриване." }, { status: 500 })
  }
}
