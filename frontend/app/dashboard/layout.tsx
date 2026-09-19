"use client";
import Sidebar from "@/components/Sidebar";
import { useRequireAuth } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, logout } = useRequireAuth();

  if (!ready) {
    // Auth check runs client-side (localStorage isn't available at SSR time); this
    // blank frame is on screen only until the token check + redirect resolve.
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar onLogout={logout} />
      <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-background md:rounded-l-[2rem] border-l border-border shadow-2xl">
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
        <div className="relative z-10 flex-1 h-full overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
