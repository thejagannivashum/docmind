"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Server,
  ShieldCheck,
  LogOut,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile, getMe, checkBackendHealth, clearToken } from "@/lib/api";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch((err) =>
        setProfileError(err instanceof Error ? err.message : "Couldn't load profile.")
      )
      .finally(() => setLoading(false));
    checkBackendHealth().then(setBackendUp);
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto space-y-6 bg-[#050814]/60">
      <header className="pb-6 border-b border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
          <Cpu className="w-3.5 h-3.5" />
          SYSTEM CONFIGURATION
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
          Node Settings
        </h1>
        <p className="text-sm text-slate-400">
          Manage your research session, node connection, and enclave preferences.
        </p>
      </header>

      <div className="max-w-2xl space-y-6">
        <Section icon={User} title="Research Profile">
          {loading ? (
            <div className="text-xs font-mono text-slate-500">LOADING PROFILE...</div>
          ) : profileError ? (
            <div className="flex items-center gap-2 text-sm text-rose-400">
              <AlertCircle className="w-4 h-4" /> {profileError}
            </div>
          ) : profile ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold font-mono text-lg shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                {profile.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-200">{profile.email}</p>
                <p className="text-xs font-mono text-emerald-400">
                  {profile.is_active ? "ACTIVE ENCLAVE SESSION" : "INACTIVE"}
                </p>
              </div>
            </div>
          ) : null}
        </Section>

        <Section icon={Server} title="API & Enclave Endpoint">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 mb-1">DOCMIND ENGINE API</p>
              <p className="font-mono text-sm text-cyan-300">
                {process.env.NEXT_PUBLIC_API_URL || "Same-origin (Next.js API routes)"}
              </p>
            </div>
            {backendUp === null ? (
              <span className="text-xs font-mono text-slate-500">Checking…</span>
            ) : backendUp ? (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-950/30 px-3 py-1.5 rounded-full border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Offline
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            The API endpoint serves authentication, vector chunk searches, chat streaming, and document parsing routes.
          </p>
        </Section>

        <Section icon={ShieldCheck} title="Zero Data Exfiltration Enclave">
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Documents uploaded to this station are parsed and stored in memory. Embedding indexing and pairwise contradiction arbitration run strictly inside this process. External requests only occur if a GEMINI_API_KEY is configured for generative synthesis.
          </p>
        </Section>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-mono text-xs gap-2"
          >
            <LogOut className="w-4 h-4" /> Disconnect Session
          </Button>
        </div>
      </div>
    </div>
  );
}
