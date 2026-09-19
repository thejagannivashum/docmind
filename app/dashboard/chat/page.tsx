"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { checkBackendHealth } from "@/lib/api";

export default function ChatPage() {
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      checkBackendHealth().then((ok) => {
        if (!cancelled) setBackendUp(ok);
      });
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-[#050814]/60">
      <div className="flex-1 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col relative bg-slate-950/60 backdrop-blur-xl">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-slate-950/40 backdrop-blur-md absolute top-0 w-full z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-white">AI Research Assistant</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              RAG ENCLAVE
            </span>
          </div>

          <div className="ml-auto">
            {backendUp === null ? (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                Checking API…
              </div>
            ) : backendUp ? (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-950/30 px-3 py-1.5 rounded-full border border-rose-500/30">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                API Offline
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 mt-16 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
