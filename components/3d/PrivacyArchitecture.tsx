"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  HardDrive,
  Cpu,
  Database,
  CloudOff,
  Lock,
  Globe,
  ArrowRight,
  AlertTriangle,
  Server,
  Zap,
} from "lucide-react";

export default function PrivacyArchitecture() {
  const [activeTab, setActiveTab] = useState<"docmind" | "cloud">("docmind");

  return (
    <div className="relative rounded-3xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl p-6 md:p-8 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.06)]">
      {/* Background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-400 mb-2">
            <Lock className="w-3.5 h-3.5" />
            ZERO DATA EXFILTRATION ENCLAVE
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Local &amp; Offline Privacy Guarantee
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Comparing DocMind&apos;s air-gapped on-device pipeline against standard cloud AI architectures.
          </p>
        </div>

        {/* Architecture Mode Toggle */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("docmind")}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
              activeTab === "docmind"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            DOCMIND (AIR-GAPPED)
          </button>
          <button
            onClick={() => setActiveTab("cloud")}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
              activeTab === "cloud"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            CONVENTIONAL CLOUD RAG
          </button>
        </div>
      </div>

      {/* Dynamic Diagram Area */}
      <AnimatePresence mode="wait">
        {activeTab === "docmind" ? (
          <motion.div
            key="docmind"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* The Local Enclave Box */}
            <div className="p-6 md:p-8 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-950/80 to-slate-950/90 relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              {/* Outer Security Badge */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Local Device Perimeter &bull; Hardware Sandbox
                    </h3>
                    <p className="text-xs font-mono text-emerald-400">
                      NO OUTBOUND INTERNET REQUIRED &bull; MEMORY RESIDENT
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/60 text-xs font-mono text-emerald-300">
                  <CloudOff className="w-4 h-4" />
                  <span>AIR-GAPPED</span>
                </div>
              </div>

              {/* Data Flow Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "1. Local Storage",
                    desc: "Confidential PDFs and docs parsed in-memory without unencrypted disk leakage.",
                    tech: "In-Memory Session Store",
                    icon: HardDrive,
                  },
                  {
                    title: "2. Text Chunking",
                    desc: "Documents segmented with sliding window overlap locally inside the node.",
                    tech: "Sliding Window Chunks",
                    icon: Zap,
                  },
                  {
                    title: "3. Semantic Matching",
                    desc: "Term-frequency & contextual retrieval executed inside the host runtime.",
                    tech: "Local Corpus Index",
                    icon: Database,
                  },
                  {
                    title: "4. Grounded Synthesis",
                    desc: "Offline deterministic synthesis fallback or optional Gemini API generation.",
                    tech: "Local Fallback / Gemini",
                    icon: Cpu,
                  },
                ].map((node, i) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-emerald-500/30 bg-slate-900/60 backdrop-blur-md relative"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{node.title}</h4>
                      <p className="text-xs text-slate-300 mb-3 leading-relaxed">{node.desc}</p>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                        {node.tech}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Cloud Egress Data
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">0.00 Bytes</span>
                <p className="text-xs text-slate-400 mt-1">Raw document bytes never transmit to external servers.</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Telemetry Exfiltration
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">None</span>
                <p className="text-xs text-slate-400 mt-1">Zero analytics tracking or third-party behavioral telemetry.</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Air-Gap Compliance
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">Fully Compliant</span>
                <p className="text-xs text-slate-400 mt-1">Functions with zero active network connections.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cloud"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Cloud Vulnerability Diagram */}
            <div className="p-6 md:p-8 rounded-3xl border-2 border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-950/80 to-slate-950/90 relative overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.1)]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Conventional SaaS Cloud Pipelines &bull; Data Exposure Risks
                    </h3>
                    <p className="text-xs font-mono text-rose-400">
                      DOCUMENT EXFILTRATION ACROSS PUBLIC APIS &amp; THIRD PARTIES
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/60 text-xs font-mono text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>POTENTIAL EXPOSURE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-slate-900/60">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-rose-400" />
                    1. Cloud Ingestion
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Documents are uploaded over the internet to remote servers, exposing trade secrets, research, or proprietary IP.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-rose-500/20 bg-slate-900/60">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-rose-400" />
                    2. Hosted Vector Stores
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Embeddings are stored in shared cloud databases, subject to vendor lock-in, compliance boundaries, and server breaches.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-rose-500/20 bg-slate-900/60">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-rose-400" />
                    3. External LLM APIs
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Context passages are fed into proprietary black-box APIs that may train future models or fail during internet outages.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
