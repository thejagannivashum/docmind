"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scan,
  Layers,
  Binary,
  Database,
  ShieldCheck,
} from "lucide-react";
import { uploadDocument, UploadResult } from "@/lib/api";

interface DocumentScannerProps {
  onUploadComplete?: (result: UploadResult, file: File) => void;
}

type ScanStage = "idle" | "reading" | "extracting" | "chunking" | "embedding" | "indexing" | "complete";

export default function DocumentScanner({ onUploadComplete }: DocumentScannerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<ScanStage>("idle");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    chunks: 0,
    dims: 384,
    sizeKb: 0,
    elapsedMs: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setCurrentFile(file);
    setError(null);
    setResult(null);
    const startTime = performance.now();

    // Stage 1: Reading file
    setStage("reading");
    await new Promise((r) => setTimeout(r, 450));

    // Stage 2: Extracting text
    setStage("extracting");
    await new Promise((r) => setTimeout(r, 550));

    // Stage 3: Semantic chunking
    setStage("chunking");
    await new Promise((r) => setTimeout(r, 550));

    // Stage 4: Embedding generation
    setStage("embedding");

    try {
      const res = await uploadDocument(file);
      // Stage 5: Vector Indexing
      setStage("indexing");
      await new Promise((r) => setTimeout(r, 400));

      const duration = Math.round(performance.now() - startTime);
      setMetrics({
        chunks: res.document.chunk_count,
        dims: 384,
        sizeKb: Math.round(file.size / 1024),
        elapsedMs: duration,
      });

      setResult(res);
      setStage("complete");
      onUploadComplete?.(res, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document ingestion failed.");
      setStage("idle");
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  return (
    <div className="relative rounded-3xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl p-6 md:p-8 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.06)]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
            <Scan className="w-3.5 h-3.5" />
            HOLOGRAPHIC INGESTION BAY
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Document Ingestion &amp; Vectorization
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Drag and drop local research papers, reports, or transcripts for offline parsing and conflict-ready indexing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4" />
          <span>ZERO CLOUD EXTRUSION</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Interactive Scanner Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => stage === "idle" || stage === "complete" ? fileInputRef.current?.click() : null}
        className={`relative min-h-[300px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer overflow-hidden ${
          isDragging
            ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            : stage === "idle" || stage === "complete"
            ? "border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-900/30 hover:bg-slate-900/50"
            : "border-cyan-500/40 bg-slate-950/80 cursor-wait"
        }`}
      >
        {/* Holographic Scanline effect during active processing */}
        {stage !== "idle" && stage !== "complete" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ y: ["0%", "100%", "0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee]"
            />
            <div className="absolute inset-0 bg-cyan-500/5 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Dynamic State Rendering */}
        <AnimatePresence mode="wait">
          {stage === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl border border-cyan-400/30 bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                <Upload className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">
                Drop Research Papers or Click to Browse
              </h3>
              <p className="text-sm text-slate-400 max-w-md mb-4">
                Supported formats: PDF, DOCX, TXT. Documents are tokenized, embedded, and checked for internal consensus locally.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">PDF</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">DOCX</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">TXT</span>
              </div>
            </motion.div>
          ) : stage === "complete" && result ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center w-full max-w-xl"
            >
              <div className="w-16 h-16 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {currentFile?.name} Ingestion Complete
              </h3>
              <p className="text-xs font-mono text-emerald-400 mb-6">
                {result.is_duplicate ? "REUSED EXISTING VECTOR INDEX" : "PARSED & INDEXED IN CHROMA DB"}
              </p>

              {/* Ingestion Telemetry Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-left">
                  <span className="text-[10px] font-mono text-slate-500 block">CHUNKS</span>
                  <span className="text-base font-bold text-cyan-300 font-mono">{metrics.chunks}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-left">
                  <span className="text-[10px] font-mono text-slate-500 block">DIMENSIONS</span>
                  <span className="text-base font-bold text-purple-300 font-mono">{metrics.dims}-d</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-left">
                  <span className="text-[10px] font-mono text-slate-500 block">FILE SIZE</span>
                  <span className="text-base font-bold text-slate-200 font-mono">{metrics.sizeKb} KB</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-left">
                  <span className="text-[10px] font-mono text-slate-500 block">SPEED</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{metrics.elapsedMs} ms</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStage("idle");
                  setCurrentFile(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono text-cyan-300 transition-all"
              >
                INGEST ANOTHER DOCUMENT
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="active-scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center w-full max-w-md"
            >
              <div className="w-16 h-16 rounded-2xl border border-cyan-400/50 bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Processing {currentFile?.name}
              </h3>
              <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-6">
                STAGE: {stage}...
              </p>

              {/* Progress Steps indicator */}
              <div className="grid grid-cols-4 gap-2 w-full">
                {[
                  { label: "Parse", icon: FileText, active: ["reading", "extracting", "chunking", "embedding", "indexing", "complete"].includes(stage) },
                  { label: "Chunk", icon: Layers, active: ["chunking", "embedding", "indexing", "complete"].includes(stage) },
                  { label: "Embed", icon: Binary, active: ["embedding", "indexing", "complete"].includes(stage) },
                  { label: "Index", icon: Database, active: ["indexing", "complete"].includes(stage) },
                ].map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        st.active
                          ? "border-cyan-400 bg-cyan-950/60 text-cyan-300"
                          : "border-slate-800 bg-slate-950/40 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-[10px] font-mono block">{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
