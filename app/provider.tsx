// app/providers.tsx
"use client"

import { ReactNode } from "react"
import { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"

interface ProvidersProps {
  children: ReactNode
  session: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}