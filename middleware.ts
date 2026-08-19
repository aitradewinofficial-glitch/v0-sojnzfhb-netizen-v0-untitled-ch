import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for the admin panel
  if (
    request.nextUrl.pathname.startsWith("/admin-panel") ||
    request.nextUrl.pathname.startsWith("/api/madix-ai/admin")
  ) {
    const authorizationHeader = request.headers.get("authorization")

    // If no authorization header is present, prompt for credentials
    if (!authorizationHeader) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      })
    }

    // Decode the base64 credentials
    const [authType, base64Credentials] = authorizationHeader.split(" ")

    if (authType !== "Basic" || !base64Credentials) {
      return new NextResponse("Invalid Authorization header", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      })
    }

    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
    const [username, password] = credentials.split(":")

    // Keep the existing admin-panel credentials for the rest of the admin area,
    // while MADIX AI uses its dedicated credentials.
    const isMadixAi = request.nextUrl.pathname.startsWith("/admin-panel/madix-ai") ||
      request.nextUrl.pathname.startsWith("/api/madix-ai/admin")
    const expectedPassword = isMadixAi ? "boss123" : "ilian123"
    if (username === "ilian" && password === expectedPassword) {
      return NextResponse.next()
    } else {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      })
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin-panel/:path*", "/api/madix-ai/admin/:path*"],
}
