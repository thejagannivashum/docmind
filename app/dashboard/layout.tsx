"use client";

import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#050814] text-slate-100 overflow-hidden">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
