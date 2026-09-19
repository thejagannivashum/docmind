"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { User, Palette, Server, ShieldCheck, LogOut, Sun, Moon, Laptop, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserProfile, getMe, checkBackendHealth } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-auth";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { logout } = useRequireAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch((err) => setProfileError(err instanceof Error ? err.message : "Couldn't load profile."))
      .finally(() => setLoading(false));
    checkBackendHealth().then(setBackendUp);
  }, []);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account, appearance, and connection.</p>
      </header>

      <div className="max-w-2xl space-y-6">
        <Section icon={User} title="Profile">
          {loading ? (
            <Skeleton className="h-14 w-full" />
          ) : profileError ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" /> {profileError}
            </div>
          ) : profile ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
                {profile.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{profile.email}</p>
                <p className="text-sm text-muted-foreground">{profile.is_active ? "Active account" : "Inactive account"}</p>
              </div>
            </div>
          ) : null}
        </Section>

        <Section icon={Palette} title="Appearance">
          <p className="text-sm text-muted-foreground mb-4">Choose how DocMind AI looks on this device.</p>
          <div className="flex gap-2">
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Laptop },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  theme === opt.value ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-background/50 border-border hover:bg-secondary/50"
                }`}
              >
                <opt.icon className="w-4 h-4" /> {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Server} title="Backend Connection">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">DocMind AI API</p>
              <p className="font-mono text-sm">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</p>
            </div>
            {backendUp === null ? (
              <span className="text-sm text-muted-foreground">Checking…</span>
            ) : backendUp ? (
              <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Unreachable
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            The AI model (Ollama) itself isn&apos;t independently pingable from the frontend — this status reflects
            whether the DocMind AI backend API is reachable, not whether Ollama specifically is running.
          </p>
        </Section>

        <Section icon={ShieldCheck} title="Privacy">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Documents you upload are processed and stored locally by your own backend — embeddings, chunks, and chat
            history all live in your local database and vector store. Nothing is sent to a third-party AI provider;
            generation runs through your local Ollama instance.
          </p>
        </Section>

        <div className="flex justify-end">
          <Button onClick={logout} variant="destructive" className="rounded-xl gap-2">
            <LogOut className="w-4 h-4" /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
