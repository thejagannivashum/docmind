"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Cpu,
  Database,
  ArrowRight,
  Terminal,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import HeroScene from "@/components/3d/HeroScene";
import RagPipelineScene from "@/components/3d/RagPipelineScene";
import VectorSpaceScene from "@/components/3d/VectorSpaceScene";
import DocumentScanner from "@/components/3d/DocumentScanner";
import PrivacyArchitecture from "@/components/3d/PrivacyArchitecture";

export default function LandingPage() {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const vectorRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 relative overflow-x-hidden grid-matrix">
      {/* Top Research Laboratory Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-mono font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              DM
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                DOCMIND <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">RAG LAB</span>
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-slate-400">
                OFFLINE INTELLIGENT DOCUMENT QA
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-xs font-mono text-slate-300">
            <button
              onClick={() => scrollToSection(pipelineRef)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> PIPELINE
            </button>
            <button
              onClick={() => scrollToSection(vectorRef)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" /> 3D VECTOR SPACE
            </button>
            <button
              onClick={() => scrollToSection(scannerRef)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" /> INGESTION BAY
            </button>
            <Link
              href="/dashboard/documents"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" /> CORPUS
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-mono transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2 group"
            >
              <span>ENTER WORKSPACE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 3D Hero Section */}
      <section className="relative pt-28 pb-16 overflow-hidden border-b border-white/5">
        {/* Background glow ambiance */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Hero Title & Actions Deck */}
        <div className="max-w-5xl mx-auto px-6 text-center relative z-20 mb-8">
          {/* Architectural Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {[
              { label: "100% AIR-GAPPED & OFFLINE", color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40" },
              { label: "LOCAL DENSE EMBEDDINGS", color: "text-cyan-300 border-cyan-500/30 bg-cyan-950/40" },
              { label: "CHROMADB HNSW INDEX", color: "text-blue-300 border-blue-500/30 bg-blue-950/40" },
              { label: "PAIRWISE NLI CONFLICT DETECTION", color: "text-purple-300 border-purple-500/30 bg-purple-950/40" },
              { label: "CALIBRATED CONFIDENCE SCORES", color: "text-amber-300 border-amber-500/30 bg-amber-950/40" },
            ].map((badge, i) => (
              <span
                key={i}
                className={`text-[11px] font-mono px-3 py-1 rounded-full border backdrop-blur-md shadow-sm ${badge.color}`}
              >
                {badge.label}
              </span>
            ))}
          </motion.div>

          {/* Scientific Title */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]"
          >
            Offline Document QA with{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              Contradiction-Aware RAG
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-8"
          >
            An offline retrieval-augmented generation framework designed for confidential research papers, technical reports, and clinical documents. Featuring a dedicated NLI cross-encoder that arbitrates source contradictions before LLM answer synthesis.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <Link
              href="/dashboard/chat"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold font-mono text-sm hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 group"
            >
              <span>LAUNCH RESEARCH LAB</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => scrollToSection(pipelineRef)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-700 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900/90 text-slate-200 font-mono text-sm transition-all flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>EXPLORE 3D ARCHITECTURE</span>
            </button>

            <button
              onClick={() => scrollToSection(vectorRef)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 font-mono text-sm transition-all flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span>3D VECTOR CLUSTER</span>
            </button>
          </motion.div>
        </div>

        {/* Real Three.js Interactive 3D Canvas with Dedicated Unobstructed Frame */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 mb-10">
          <div className="rounded-3xl border border-cyan-500/30 overflow-hidden bg-slate-950/80 shadow-[0_0_80px_rgba(6,182,212,0.12)]">
            <HeroScene />
          </div>
        </div>

        {/* Key Metric Highlights */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { label: "CLOUD DATA EGRESS", val: "0.00 Bytes", sub: "Strictly air-gapped device memory" },
              { label: "CONFLICT ARBITRATION", val: "NLI Cross-Encoder", sub: "DeBERTa-v3 contradiction score" },
              { label: "INDEXING SPEED", val: "< 1.2s", sub: "Quantized dense embedding pipeline" },
              { label: "ANSWER GROUNDING", val: "Calibrated 0-100%", sub: "Fused confidence verification" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  {stat.label}
                </span>
                <span className="text-xl font-bold text-white font-mono block">{stat.val}</span>
                <span className="text-[11px] text-slate-400 mt-1 block">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Interactive Experiences */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-20">
        {/* Section 1: RAG Pipeline Spatial Visualizer */}
        <section ref={pipelineRef} id="architecture" className="scroll-mt-24">
          <RagPipelineScene />
        </section>

        {/* Section 2: 3D Dense Vector Space */}
        <section ref={vectorRef} id="vector-space" className="scroll-mt-24">
          <VectorSpaceScene />
        </section>

        {/* Section 3: Holographic Document Ingestion Bay */}
        <section ref={scannerRef} id="scanner" className="scroll-mt-24">
          <DocumentScanner />
        </section>

        {/* Section 4: Privacy & Air-Gap Enclave */}
        <section id="privacy">
          <PrivacyArchitecture />
        </section>

        {/* Section 5: Academic Research Foundation & Mini Project Context */}
        <section className="p-8 rounded-3xl border border-slate-800 bg-slate-950/70 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-mono text-purple-300 mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                ACADEMIC &amp; SCIENTIFIC FOUNDATION
              </div>
              <h3 className="text-2xl font-bold text-white">
                Evolution from ScholarsDock to DocMind RAG
              </h3>
            </div>
            <Link
              href="/dashboard/chat"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>ACCESS BENCHMARK CONSOLE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300 leading-relaxed font-light">
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                The Core Problem in Document QA
              </h4>
              <p>
                Standard RAG frameworks assume that retrieved passages are mutually consistent. In enterprise, medical, and legal contexts, multi-document libraries often contain contradictory information across versions, revisions, or author conclusions. LLMs prompted with conflicting context frequently synthesize a hallucinated compromise rather than alerting the researcher.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                DocMind&apos;s Solution: Pairwise NLI Arbitration
              </h4>
              <p>
                DocMind runs an offline Natural Language Inference cross-encoder (<code className="text-cyan-300 font-mono text-xs">cross-encoder/nli-deberta-v3-small</code>) across retrieved premise-hypothesis pairs. Contradiction probabilities directly penalize the confidence score and surface an explicit conflict arbitration card before answer synthesis.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-slate-950/90 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              DM
            </div>
            <div>
              <p className="text-slate-200 font-bold">DOCMIND RESEARCH ENGINE</p>
              <p className="text-[10px] text-slate-500">Offline Retrieval-Augmented Generation &bull; All Rights Reserved</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Workspace</Link>
            <Link href="/dashboard/documents" className="hover:text-cyan-400 transition-colors">Documents</Link>
            <Link href="/dashboard/chat" className="hover:text-cyan-400 transition-colors">Chat Lab</Link>
            <Link href="/dashboard/analytics" className="hover:text-cyan-400 transition-colors">Analytics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
