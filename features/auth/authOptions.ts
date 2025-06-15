// features/auth/authOptions.ts
import { NextAuthOptions, DefaultSession } from "next-auth"
import Auth0Provider from "next-auth/providers/auth0"

// 1) Session’ı genişletiyoruz
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & { role?: string }
  }
}

// 2) JWT token’a role alanı eklemek için next-auth/jwt’i de augment et
declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER_BASE_URL,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  callbacks: {
    async jwt({ token, user }) {
      // 3) user objesinin tipi DefaultUser; burada role bilgisini
      //    metadata’dan ya da user.profile’den çekiyorsan öncelikle
      //    uygun bir tip tanımı yapman lazım. Biz basitçe:
      if (user) {
        // Farz edelim Auth0 metadata içinde `role` gönderiyor:
        const maybeRole = (user as { role?: string }).role
        token.role = maybeRole ?? "user"
      }
      return token
    },
    async session({ session, token }) {
      // token.role artık string | undefined tipinde
      if (typeof token.role === "string") {
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}