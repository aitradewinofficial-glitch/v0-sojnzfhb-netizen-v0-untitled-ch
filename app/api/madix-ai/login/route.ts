import { NextResponse } from "next/server"

const SESSION_COOKIE = "madix_ai_admin_session"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (username !== "ilian" || password !== "boss123") {
      return NextResponse.json({ error: "Невалидни данни за вход." }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, "authenticated", {
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
