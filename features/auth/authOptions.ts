import { NextAuthOptions, DefaultSession, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import Auth0Provider from "next-auth/providers/auth0";

interface Auth0User extends User {
  role?: string;
  "https://myapp.com/roles"?: string[];
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      role?: string;
      id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sub?: string;
    exp?: number;
    iat?: number;
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
          audience: process.env.AUTH0_AUDIENCE,
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        const auth0User = user as Auth0User;
        const maybeRole =
          auth0User.role || auth0User["https://myapp.com/roles"]?.[0] || "user";
        token.role = maybeRole;

        const now = Math.floor(Date.now() / 1000);
        token.iat = now;
        token.exp = now + 60;
      }

      const now = Math.floor(Date.now() / 1000);
      if (token.exp && now >= token.exp) {
        return {} as JWT;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token || Object.keys(token).length === 0) {
        return {
          ...session,
          expires: new Date(0).toISOString(),
        };
      }

      if (token.sub) {
        session.user.id = token.sub;
      }
      if (typeof token.role === "string") {
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      console.warn(`User signed in: ${user.email}`);
    },
    async signOut() {
      console.warn("User signed out");
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
