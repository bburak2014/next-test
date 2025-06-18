import { getToken, type JWT } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const secret = process.env.NEXTAUTH_SECRET!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ["/", "/login", "/unauthorized"]
  const isPublicPath = publicPaths.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/auth"

  if (isPublicPath) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ req: request, secret })

    if (!token) {
      console.warn('No token found, redirecting to login')
      return redirectToLogin(request, pathname)
    }

    const now = Math.floor(Date.now() / 1000)
    if (token.exp && now >= token.exp) {
      console.warn('Token expired, clearing session and redirecting to login')
      return redirectToLogin(request, pathname)
    }

    const jwtToken = token as JWT & { role?: string }
    if (pathname.startsWith("/admin") && jwtToken.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware hatası:", error)
    return redirectToLogin(request, pathname)
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const sessionCookies = request.cookies
    .getAll()
    .filter((c) => c.name.includes("next-auth"))

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("callbackUrl", pathname)
  
  const res = NextResponse.redirect(loginUrl)
  
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url'
  ]
  
  const allCookiesToClear = [...sessionCookies.map(c => c.name), ...cookieNames]
  const uniqueCookies = [...new Set(allCookiesToClear)]
  
  uniqueCookies.forEach((name) => {
    res.cookies.delete(name)
    
    const cookieOptions = [
      { path: '/', domain: undefined },
      { path: '/', domain: request.nextUrl.hostname },
      { path: '/', domain: `.${request.nextUrl.hostname}` },
    ]
    
    cookieOptions.forEach(options => {
      res.cookies.set(name, '', { 
        ...options,
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })
  })
  
  console.warn(`Cleared cookies: ${uniqueCookies.join(', ')}`)
  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}