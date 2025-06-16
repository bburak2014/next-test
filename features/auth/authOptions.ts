// features/auth/authOptions.ts
import { NextAuthOptions, DefaultSession, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import Auth0Provider from "next-auth/providers/auth0"

// Auth0 User tipini genişletiyoruz
interface Auth0User extends User {
  role?: string
  "https://myapp.com/roles"?: string[]
}

// 1) Session'ı genişletiyoruz
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & { 
      role?: string
      id?: string
    }
  }
}

// 2) JWT token'a role alanı eklemek için next-auth/jwt'i de augment et
declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    sub?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER_BASE_URL,
      authorization: { 
        params: { 
          scope: "openid profile email",
          audience: process.env.AUTH0_AUDIENCE // API için gerekli olabilir
        } 
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: Auth0User }) {
      // İlk giriş
      if (user) {
        token.sub = user.id
        
        // Auth0'dan role bilgisini al
        // Bu kısım Auth0 metadata konfigürasyonuna göre değişebilir
        const maybeRole = user.role || 
                         user["https://myapp.com/roles"]?.[0] || 
                         "user"
        token.role = maybeRole
      }
      
      return token
    },
    async session({ session, token }) {
      // Token'dan session'a aktarım
      if (token.sub) {
        session.user.id = token.sub
      }
      if (typeof token.role === "string") {
        session.user.role = token.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Callback URL'leri kontrol et
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user }: { user: User }) {
      // Giriş logları
      console.log(`User signed in: ${user.email}`)
    },
    async signOut() {
      // Çıkış logları
      console.log('User signed out')
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}