"use client";
import { useEffect, useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { checkBackendHealth } from "@/lib/api";

export default function ChatPage() {
  const [backendUp, setBackendUp] = useState<boolean | null>(null); // null = still checking

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      checkBackendHealth().then((ok) => {
        if (!cancelled) setBackendUp(ok);
      });
    };
    check();
    const interval = setInterval(check, 15000); // re-check periodically, not just once at load
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      <div className="glass flex-1 rounded-[2.5rem] border border-border shadow-xl overflow-hidden flex flex-col relative bg-background/60">
        <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/40 backdrop-blur-md absolute top-0 w-full z-10">
          <h2 className="font-bold text-lg">AI Research Assistant</h2>
          {backendUp === null ? (
            <div className="ml-auto flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-full border border-border">
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" /> Checking connection…
            </div>
          ) : backendUp ? (
            <div className="ml-auto flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Backend connected
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2 text-sm font-medium text-red-600 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Backend unreachable
            </div>
          )}
        </header>
        <div className="flex-1 mt-16 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}