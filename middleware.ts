import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AI_ADMIN_COOKIE = "madix_ai_admin_session"

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  })
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = pathname.startsWith("/admin-panel") || pathname.startsWith("/api/madix-ai/admin")
  if (!isProtected) return NextResponse.next()

  const isMadixAi = pathname.startsWith("/admin-panel/madix-ai") || pathname.startsWith("/api/madix-ai/admin")
  const expectedPassword = isMadixAi ? "boss123" : "ilian123"

  const sessionCookie = request.cookies.get(AI_ADMIN_COOKIE)?.value
  if (sessionCookie === "authenticated" || sessionCookie === "ilian:boss123" || sessionCookie === "ilian:ilian123") {
    return NextResponse.next()
  }

  const authorizationHeader = request.headers.get("authorization")
  if (!authorizationHeader) return unauthorized()

  const [authType, base64Credentials] = authorizationHeader.split(" ")
  if (authType !== "Basic" || !base64Credentials) return unauthorized()

  try {
    const credentials = atob(base64Credentials)
    const separator = credentials.indexOf(":")
    const username = separator >= 0 ? credentials.slice(0, separator) : ""
    const password = separator >= 0 ? credentials.slice(separator + 1) : ""
    if (username !== "ilian" || password !== expectedPassword) return unauthorized()

    const response = NextResponse.next()
    response.cookies.set(AI_ADMIN_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch {
    return unauthorized()
  }
}

export const config = {
  matcher: ["/admin-panel/:path*", "/api/madix-ai/admin/:path*"],
}
