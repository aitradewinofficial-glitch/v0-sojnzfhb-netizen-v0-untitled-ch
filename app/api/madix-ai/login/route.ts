import { NextResponse } from "next/server"

const AI_ADMIN_COOKIE = "madix_ai_admin_session"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (username !== "ilian" || password !== "boss123") {
      return NextResponse.json({ error: "Невалидно потребителско име или парола." }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(AI_ADMIN_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch {
    return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(AI_ADMIN_COOKIE)
  return response
}
