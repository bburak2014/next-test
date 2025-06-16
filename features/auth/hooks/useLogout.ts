// features/auth/hooks/useLogout.ts
import { signOut } from "next-auth/react"

export const useLogout = () => {
  return () => {
    const AUTH0_LOGOUT_URL = `${process.env.NEXT_PUBLIC_AUTH0_ISSUER}/v2/logout?client_id=${process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}&returnTo=${window.location.origin}`

    signOut({
      redirect: true,
      callbackUrl: AUTH0_LOGOUT_URL,
    })
  }
}
