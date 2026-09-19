"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Files,
  BookOpen,
  BarChart2,
  Settings,
  LogOut,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();
  const routes = [
    { label: "Research Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Chat Lab (RAG)", icon: MessageSquare, href: "/dashboard/chat" },
    { label: "Document Corpus", icon: Files, href: "/dashboard/documents" },
    { label: "Study & Synthesis", icon: BookOpen, href: "/dashboard/study" },
    { label: "Pipeline Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  ];

  return (
    <div className="w-72 h-full flex flex-col bg-slate-950/80 border-r border-cyan-500/10 backdrop-blur-2xl relative select-none">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 mb-6 group">
          <div className="w-10 h-10 bg-cyan-500/15 border border-cyan-400/40 rounded-2xl flex items-center justify-center text-cyan-400 font-mono font-bold text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:scale-105 transition-transform">
            DM
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              DocMind <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">LAB</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">OFFLINE RAG FRAMEWORK</span>
          </div>
        </Link>

        {/* Local Enclave Status Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs font-mono text-emerald-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AIR-GAPPED ENCLAVE
          </span>
          <ShieldCheck size={14} />
        </div>
      </div>

      {/* Navigation Routes */}
      <div className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3 mt-2">
          Research Console
        </p>
        {routes.map((route) => {
          const isActive =
            pathname === route.href ||
            (pathname.startsWith(route.href) && route.href !== "/dashboard");
          return (
            <Link key={route.href} href={route.href} className="relative block">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/30 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <route.icon className={cn("w-4 h-4", isActive ? "text-cyan-400" : "text-slate-400")} />
                {route.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Info & Actions */}
      <div className="p-4 mt-auto border-t border-white/5 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 transition-colors"
        >
          <Layers className="w-4 h-4 text-cyan-400" /> 3D Architecture Overview
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 transition-colors"
        >
          <Settings className="w-4 h-4" /> Node Settings
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-950/30 hover:border hover:border-rose-500/20 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" /> Disconnect Session
        </button>
      </div>
    </div>
  );
}
