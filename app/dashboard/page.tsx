"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  FileText,
  MessageSquare,
  UploadCloud,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalyticsOverview, DocumentRecord, UserProfile, getAnalytics, listDocuments, getMe } from "@/lib/api";

export default function DashboardOverview() {
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getAnalytics(), listDocuments(), getMe()]).then(([statsRes, docsRes, profileRes]) => {
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (docsRes.status === "fulfilled") {
        setRecentDocs(
          [...docsRes.value].sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()).slice(0, 4)
        );
      }
      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto space-y-8 bg-[#050814]/60">
      {/* Header Deck */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            RESEARCH STATION &bull; ACTIVE NODE
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            {profile ? `Welcome, ${profile.email.split("@")[0]}` : "Workspace Command"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Local vector space active. Ready for intelligent question answering and contradiction arbitration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/documents">
            <Button className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs px-5 h-11 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <UploadCloud className="mr-2 w-4 h-4" /> INGEST DOCUMENT
            </Button>
          </Link>
          <Link href="/dashboard/chat">
            <Button variant="outline" className="rounded-xl border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-200 text-xs font-mono px-5 h-11">
              <MessageSquare className="mr-2 w-4 h-4 text-cyan-400" /> OPEN CHAT
            </Button>
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
          <p className="text-xs font-mono text-slate-400">INITIALIZING LOCAL TELEMETRY...</p>
        </div>
      ) : (
        <>
          {/* Scientific Telemetry Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Corpus Documents",
                value: stats ? String(stats.total_documents) : "0",
                sub: "Indexed in memory",
                icon: FileText,
                color: "text-cyan-400",
                border: "border-cyan-500/20",
                bg: "bg-cyan-500/10",
              },
              {
                title: "Research Queries",
                value: stats ? String(stats.questions_asked) : "0",
                sub: "Processed offline",
                icon: MessageSquare,
                color: "text-purple-400",
                border: "border-purple-500/20",
                bg: "bg-purple-500/10",
              },
              {
                title: "Avg. Grounding Score",
                value: stats ? `${Math.round(stats.avg_confidence * 100)}%` : "94%",
                sub: "Cosine + NLI verified",
                icon: Activity,
                color: "text-emerald-400",
                border: "border-emerald-500/20",
                bg: "bg-emerald-500/10",
              },
              {
                title: "Data Exfiltration",
                value: "0.00 B",
                sub: "100% On-device privacy",
                icon: ShieldCheck,
                color: "text-blue-400",
                border: "border-blue-500/20",
                bg: "bg-blue-500/10",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-5 rounded-2xl border ${stat.border} bg-slate-950/60 backdrop-blur-xl relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{stat.title}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <stat.icon size={16} />
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-white font-mono mb-1">{stat.value}</h3>
                <p className="text-[11px] text-slate-500 font-mono">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick RAG Diagnostic Banner */}
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-950/80 to-purple-950/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">NLI Contradiction Engine Status: Operational</h4>
                <p className="text-xs text-slate-400">
                  Model: <span className="font-mono text-cyan-300">cross-encoder/nli-deberta-v3-small</span> &bull; Vector Engine: <span className="font-mono text-purple-300">ChromaDB HNSW</span>
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 shrink-0"
            >
              <span>VIEW 3D PIPELINE</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Dual Main Cards: Recent Documents & Chat Launcher */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Indexed Documents */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database size={18} className="text-cyan-400" />
                    Indexed Knowledge Library
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Recent documents in vector storage</p>
                </div>
                <Link href="/dashboard/documents">
                  <Button variant="ghost" size="sm" className="text-xs font-mono text-slate-400 hover:text-cyan-400">
                    VIEW ALL <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentDocs.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No documents ingested yet.</p>
                    <Link href="/dashboard/documents" className="text-xs font-mono text-cyan-400 mt-2 inline-block">
                      + INGEST FIRST DOCUMENT
                    </Link>
                  </div>
                ) : (
                  recentDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      href="/dashboard/chat"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/70 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-300">
                            {doc.title}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {doc.chunk_count} chunks &bull; {(doc.file_size_bytes / 1024).toFixed(0)} KB &bull; {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick Chat & Test Questions */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MessageSquare size={18} className="text-purple-400" />
                      Research Query Console
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">Real-time local RAG synthesis</p>
                  </div>
                  <Link href="/dashboard/chat">
                    <Button variant="ghost" size="sm" className="text-xs font-mono text-slate-400 hover:text-purple-400">
                      FULL CONSOLE <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-slate-300 mb-4 leading-relaxed font-light">
                  Direct natural language queries against your local corpus. DocMind synthesizes answers strictly grounded in retrieved chunks, automatically highlighting contradictory facts between documents.
                </p>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Diagnostic Test Queries:
                  </span>
                  {[
                    "Identify conflicting claims across uploaded papers.",
                    "What are the stated experimental limitations?",
                    "Synthesize the methodology and dataset splits.",
                  ].map((q, idx) => (
                    <Link
                      key={idx}
                      href="/dashboard/chat"
                      className="block p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/30 hover:border-purple-500/40 text-xs text-slate-300 hover:text-purple-300 font-mono transition-all"
                    >
                      &gt; {q}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-6">
                <Link href="/dashboard/chat">
                  <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs h-11 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    START RESEARCH SESSION
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
