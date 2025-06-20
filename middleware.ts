// middleware.ts
import { getToken, type JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET!;

const WINDOW_SIZE_IN_MS = 60 * 1000;
const MAX_REQUESTS = 60;

type Entry = { count: number; firstRequestTime: number };
const ipStore = new Map<string, Entry>();

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  let entry = ipStore.get(ip);
  if (!entry) {
    entry = { count: 1, firstRequestTime: now };
    ipStore.set(ip, entry);
  } else {
    if (now - entry.firstRequestTime > WINDOW_SIZE_IN_MS) {
      entry = { count: 1, firstRequestTime: now };
    } else {
      entry.count++;
    }
    ipStore.set(ip, entry);
  }

  if (entry.count > MAX_REQUESTS) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const { pathname } = request.nextUrl;
  const publicPaths = ["/", "/login", "/unauthorized"];
  const isPublic =
    publicPaths.includes(pathname) || pathname.startsWith("/api/auth/");

  if (isPublic) return NextResponse.next();

  try {
    const token = await getToken({ req: request, secret });
    if (!token) return redirectToLogin(request, pathname);

    const ts = Math.floor(Date.now() / 1000);
    if (token.exp && ts >= token.exp) return redirectToLogin(request, pathname);

    const jwtToken = token as JWT & { role?: string };
    if (pathname.startsWith("/admin") && jwtToken.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware error:", err);
    return redirectToLogin(request, pathname);
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const sessionCookies = request.cookies
    .getAll()
    .filter((c) => c.name.includes("next-auth"));

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);

  const res = NextResponse.redirect(loginUrl);

  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ];

  const allCookiesToClear = [
    ...sessionCookies.map((c) => c.name),
    ...cookieNames,
  ];
  const uniqueCookies = [...new Set(allCookiesToClear)];

  uniqueCookies.forEach((name) => {
    res.cookies.delete(name);

    const cookieOptions = [
      { path: "/", domain: undefined },
      { path: "/", domain: request.nextUrl.hostname },
      { path: "/", domain: `.${request.nextUrl.hostname}` },
    ];

    cookieOptions.forEach((options) => {
      res.cookies.set(name, "", {
        ...options,
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });
  });

  console.warn(`Cleared cookies: ${uniqueCookies.join(", ")}`);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
