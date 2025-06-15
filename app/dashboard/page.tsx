// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Oturum yoksa login sayfasına yönlendir
  if (!session) {
    redirect(`/login?callbackUrl=/dashboard`);
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="mb-6">
          Hoş geldin,{" "}
          <span className="font-semibold">{session.user?.name}</span>!
        </p>
        <ul className="mb-6 space-y-2">
          <li>Email: {session.user?.email}</li>
          <li>Rol: {session.user?.role}</li>
        </ul>
        <div className="space-x-4">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Ana Sayfa
          </Link>
                   <LogoutButton />  {/* İstemci tarafı buton */}

        </div>
      </div>
    </div>
  );
}
