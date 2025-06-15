// app/login/page.tsx  (server component)
import LoginForm from "@/features/auth/components/LoginForm"

export const metadata = { title: "Giriş | MyApp" }

export default function LoginPage() {
  return <LoginForm />
}