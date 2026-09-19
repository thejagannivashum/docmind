"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Files, BookOpen, BarChart2, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();
  const routes = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Chat", icon: MessageSquare, href: "/dashboard/chat" },
    { label: "Documents", icon: Files, href: "/dashboard/documents" },
    { label: "Study Tools", icon: BookOpen, href: "/dashboard/study" },
    { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  ];

  return (
    <div className="w-72 h-full flex flex-col bg-background/50 border-r border-border backdrop-blur-xl">
      <div className="p-6 pb-2">
        <Link href="/dashboard" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">D</div>
          <span className="text-2xl font-bold tracking-tight">DocMind</span>
        </Link>
      </div>
      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-2">Menu</p>
        {routes.map((route) => {
          const isActive = pathname === route.href || (pathname.startsWith(route.href) && route.href !== '/dashboard');
          return (
            <Link key={route.href} href={route.href} className="relative block">
              {isActive && (
                <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-xl" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
              <div className={cn("relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
                <route.icon className="w-5 h-5" />
                {route.label}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 mt-auto">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Settings className="w-5 h-5" /> Settings
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors mt-1"
        >
          <LogOut className="w-5 h-5" /> Log out
        </button>
      </div>
    </div>
  );
}