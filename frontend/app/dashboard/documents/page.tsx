"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Search, Trash2, Loader2, FileWarning, Clock, CheckCircle2, Files, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentRecord, listDocuments, uploadDocument, deleteDocument } from "@/lib/api";

const STATUS_CONFIG = {
  indexed: { label: "Indexed", variant: "success" as const, icon: CheckCircle2 },
  processing: { label: "Processing", variant: "warning" as const, icon: Clock },
  failed: { label: "Failed", variant: "destructive" as const, icon: FileWarning },
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load documents.");
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
      .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
  }, [documents, search]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      try {
        await uploadDocument(file);
      } catch (err) {
        setUploadError(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }
    setIsUploading(false);
    load();
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This removes it from your knowledge base permanently.`)) return;
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
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Documents</h1>
          <p className="text-muted-foreground">{documents.length} document{documents.length !== 1 ? "s" : ""} in your library</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="rounded-full shadow-lg h-12 px-6 gap-2">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Document
        </Button>
      </header>

      {uploadError && (
        <div className="mb-4 flex items-start gap-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {uploadError}
        </div>
      )}

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9 h-11 rounded-xl" />
      </div>

      <div
        className="relative glass rounded-3xl border border-border shadow-sm p-2 min-h-[300px]"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-2 z-20 rounded-2xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="font-semibold text-primary">Drop files to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="font-semibold mb-1">Couldn&apos;t load documents</p>
            <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
            <Button onClick={load} variant="outline" className="rounded-xl">Try again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Files className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1.5">{documents.length === 0 ? "No documents yet" : "No matches"}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              {documents.length === 0
                ? "Upload a PDF, DOCX, or TXT file to start building your knowledge base."
                : "No documents match your search."}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl">Upload a document</Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <AnimatePresence>
              {filtered.map((doc) => {
                const status = STATUS_CONFIG[doc.status];
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="uppercase">{doc.file_type.replace(".", "")}</span>
                        <span>&middot;</span>
                        <span>{formatBytes(doc.file_size_bytes)}</span>
                        {doc.status === "indexed" && <><span>&middot;</span><span>{doc.chunk_count} chunks</span></>}
                        <span>&middot;</span>
                        <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                      </div>
                      {doc.status === "failed" && doc.error_message && (
                        <p className="text-xs text-destructive mt-1">{doc.error_message}</p>
                      )}
                    </div>
                    <Badge variant={status.variant}><StatusIcon className="w-3 h-3" />{status.label}</Badge>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(doc.id, doc.title)} disabled={deletingId === doc.id}>
                      {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
