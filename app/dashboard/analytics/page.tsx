"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Files,
  Layers,
  MessageSquare,
  Activity,
  ShieldAlert,
  HardDrive,
  AlertCircle,
  LucideIcon,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsOverview, getAnalytics } from "@/lib/api";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  border,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-3xl border ${border} bg-slate-950/60 backdrop-blur-xl flex items-center gap-5`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}
      >
        <Icon size={26} />
      </div>
      <div>
        <p className="font-mono text-xs text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <h3 className="text-3xl font-extrabold text-white font-mono">{value}</h3>
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
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Couldn't load analytics.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto space-y-6 bg-[#050814]/60">
      <header className="pb-6 border-b border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
          <Cpu className="w-3.5 h-3.5" />
          SYSTEM TELEMETRY
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
          Pipeline Analytics
        </h1>
        <p className="text-sm text-slate-400">
          Real-time metrics from your local offline knowledge base and RAG pipeline.
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
          <Activity className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
          GATHERING SYSTEM METRICS...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
          <p className="font-semibold mb-1 text-slate-200">
            Couldn&apos;t load analytics
          </p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <Button
            onClick={load}
            variant="outline"
            className="rounded-xl border-slate-800"
          >
            Try again
          </Button>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={Files}
            label="Documents Indexed"
            value={`${data.indexed_documents} / ${data.total_documents}`}
            color="text-cyan-400"
            bg="bg-cyan-500/10"
            border="border-cyan-500/20"
          />
          <StatCard
            icon={Layers}
            label="Total Chunks"
            value={data.total_chunks.toLocaleString()}
            color="text-purple-400"
            bg="bg-purple-500/10"
            border="border-purple-500/20"
          />
          <StatCard
            icon={MessageSquare}
            label="Questions Asked"
            value={String(data.questions_asked)}
            color="text-blue-400"
            bg="bg-blue-500/10"
            border="border-blue-500/20"
          />
          <StatCard
            icon={Activity}
            label="Avg. Confidence"
            value={`${Math.round(data.avg_confidence * 100)}%`}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
            border="border-emerald-500/20"
          />
          <StatCard
            icon={ShieldAlert}
            label="Conflict Rate"
            value={`${Math.round(data.conflict_rate * 100)}%`}
            color="text-rose-400"
            bg="bg-rose-500/10"
            border="border-rose-500/20"
          />
          <StatCard
            icon={HardDrive}
            label="Storage Used"
            value={formatBytes(data.storage_bytes)}
            color="text-amber-400"
            bg="bg-amber-500/10"
            border="border-amber-500/20"
          />
        </div>
      ) : null}
    </div>
  );
}
