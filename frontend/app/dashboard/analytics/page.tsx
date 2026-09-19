"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Files, Layers, MessageSquare, Activity, ShieldAlert, HardDrive, AlertCircle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsOverview, getAnalytics } from "@/lib/api";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: LucideIcon; label: string; value: string; color: string; bg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-3xl border-border shadow-sm flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="font-semibold text-muted-foreground">{label}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load analytics."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Analytics</h1>
        <p className="text-muted-foreground">Real usage from your account.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <p className="font-semibold mb-1">Couldn&apos;t load analytics</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={load} variant="outline" className="rounded-xl">Try again</Button>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Files} label="Documents indexed" value={`${data.indexed_documents} / ${data.total_documents}`} color="text-blue-500" bg="bg-blue-500/10" />
          <StatCard icon={Layers} label="Total chunks" value={data.total_chunks.toLocaleString()} color="text-violet-500" bg="bg-violet-500/10" />
          <StatCard icon={MessageSquare} label="Questions asked" value={String(data.questions_asked)} color="text-purple-500" bg="bg-purple-500/10" />
          <StatCard icon={Activity} label="Avg. confidence" value={`${Math.round(data.avg_confidence * 100)}%`} color="text-emerald-500" bg="bg-emerald-500/10" />
          <StatCard icon={ShieldAlert} label="Conflict rate" value={`${Math.round(data.conflict_rate * 100)}%`} color="text-red-500" bg="bg-red-500/10" />
          <StatCard icon={HardDrive} label="Storage used" value={formatBytes(data.storage_bytes)} color="text-cyan-500" bg="bg-cyan-500/10" />
        </div>
      ) : null}
    </div>
  );
}
