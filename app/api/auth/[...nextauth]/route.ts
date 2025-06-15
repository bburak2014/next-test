// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next"
import { authOptions } from "@/features/auth/authOptions"

const handler = NextAuth(authOptions)

// Next.js App Router’da hem GET hem POST handler olarak export edin
export { handler as GET, handler as POST }