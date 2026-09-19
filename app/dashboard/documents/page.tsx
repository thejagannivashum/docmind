"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Loader2,
  FileWarning,
  Clock,
  CheckCircle2,
  Files,
  AlertCircle,
  Cpu,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DocumentRecord,
  listDocuments,
  uploadDocument,
  deleteDocument,
} from "@/lib/api";
import DocumentScanner from "@/components/3d/DocumentScanner";

const STATUS_CONFIG = {
  indexed: {
    label: "Indexed",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: FileWarning,
  },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentManagerPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showScannerBay, setShowScannerBay] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return documents
      .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
      .sort(
        (a, b) =>
          new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
      );
  }, [documents, search]);

  const handleDelete = async (id: number, title: string) => {
    if (
      !window.confirm(
        `Delete "${title}"? This removes it from your knowledge base permanently.`
      )
    )
      return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto space-y-6 bg-[#050814]/60">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            DOCUMENT CORPUS VAULT
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Document Corpus
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""} indexed in your knowledge vault
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowScannerBay(!showScannerBay)}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs px-5 h-11 shadow-[0_0_20px_rgba(6,182,212,0.3)] gap-2"
          >
            <Scan className="w-4 h-4" />
            {showScannerBay ? "CLOSE SCANNER BAY" : "OPEN INGESTION BAY"}
          </Button>
        </div>
      </header>

      {/* Holographic Ingestion Scanner Bay */}
      <AnimatePresence>
        {showScannerBay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <DocumentScanner
              onUploadComplete={() => {
                load();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {uploadError && (
        <div className="flex items-start gap-2 text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {uploadError}
        </div>
      )}

      {/* Search and Ingestion Bay Toggle Button Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by filename..."
            className="pl-9 h-11 rounded-xl bg-slate-900/60 border-slate-800 text-slate-200"
          />
        </div>
      </div>

      <div className="relative rounded-3xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl p-6 min-h-[350px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
            <p className="text-xs font-mono text-slate-400">LOADING CORPUS REGISTRY...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
            <p className="font-semibold mb-1 text-slate-200">Couldn&apos;t load documents</p>
            <p className="text-sm text-slate-400 mb-4">{loadError}</p>
            <Button onClick={load} variant="outline" className="rounded-xl border-slate-800">
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
              <Files className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-1.5 text-white">
              {documents.length === 0 ? "No documents in vault" : "No matches"}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-5">
              {documents.length === 0
                ? "Open the Ingestion Bay above to scan and index your first PDF, DOCX, or TXT research file."
                : "No documents match your search query."}
            </p>
            {documents.length === 0 && (
              <Button
                onClick={() => setShowScannerBay(true)}
                className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Open Ingestion Bay
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((doc) => {
                const status =
                  STATUS_CONFIG[doc.status] || STATUS_CONFIG.processing;
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 transition-all border border-slate-800/80 hover:border-cyan-500/30 group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap font-mono">
                        <span className="uppercase text-cyan-400">
                          {doc.file_type.replace(".", "")}
                        </span>
                        <span>&middot;</span>
                        <span>{formatBytes(doc.file_size_bytes)}</span>
                        {doc.status === "indexed" && (
                          <>
                            <span>&middot;</span>
                            <span>{doc.chunk_count} chunks</span>
                          </>
                        )}
                        <span>&middot;</span>
                        <span>
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.status === "failed" && doc.error_message && (
                        <p className="text-xs text-rose-400 mt-1">
                          {doc.error_message}
                        </p>
                      )}
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${status.className}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                      onClick={() => handleDelete(doc.id, doc.title)}
                      disabled={deletingId === doc.id}
                      title="Delete document"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
