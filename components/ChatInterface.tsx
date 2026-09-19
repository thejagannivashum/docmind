"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  ShieldAlert,
  Paperclip,
  Loader2,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  streamChat,
  uploadDocument,
  listDocuments,
  DocumentRecord,
  ChatMeta,
  SourceRef,
} from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  confidenceLabel?: ChatMeta["confidence_label"];
  conflictDetected?: boolean;
  conflictingPairs?: ChatMeta["conflicting_pairs"];
  sources?: SourceRef[];
  streaming?: boolean;
}

const CONFIDENCE_STYLES: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  high: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    label: "HIGH CONFIDENCE",
  },
  medium: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    label: "MODERATE MATCH",
  },
  low: {
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    label: "LOW MATCH",
  },
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the **DocMind Research Console**.\n\nAll document parsing, semantic chunking, and grounded synthesis execute strictly within your local session boundary.\n\nSelect a document context from the top bar or ask questions across your full corpus.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pipelineState, setPipelineState] = useState<string>("IDLE");
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Document context isolation
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const refreshDocuments = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs.filter((d) => d.status === "indexed"));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  const handleNewSession = () => {
    if (speakingMessageId && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
    setSessionId(null);
    setExpandedSources({});
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "Started a **New Research Session**.\n\nAll previous session context, citations, and conversation history have been reset. Select a document or ask a question to begin.",
      },
    ]);
  };

  const toggleListening = () => {
    if (typeof window === "undefined") return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input requires a browser with Web Speech API support (Google Chrome, Edge, or Safari).");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const toggleSpeech = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`[\]()]/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const toggleSourceExpand = (sourceKey: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [sourceKey]: !prev[sourceKey],
    }));
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pipelineState]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    const assistantId = `asst_${Date.now()}`;
    const history = messages
      .filter((m) => m.id !== "welcome" && !m.id.startsWith("welcome-"))
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setIsLoading(true);

    const activeDoc = documents.find((d) => d.id === selectedDocId);
    setPipelineState(
      activeDoc
        ? `SEARCHING IN "${activeDoc.title.slice(0, 25)}..."`
        : "SEARCHING ALL CORPUS DOCUMENTS..."
    );

    setTimeout(() => {
      setPipelineState("RETRIEVING RELEVANT PASSAGES...");
    }, 350);
    setTimeout(() => {
      setPipelineState("SYNTHESIZING GROUNDED ANSWER...");
    }, 850);

    await streamChat(
      userMessage.content,
      history,
      sessionId,
      {
        onMeta: (meta) => {
          if (meta.session_id) setSessionId(meta.session_id);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    confidence: meta.confidence,
                    confidenceLabel: meta.confidence_label,
                    conflictDetected: meta.conflict_detected,
                    conflictingPairs: meta.conflicting_pairs,
                    sources: meta.sources,
                  }
                : m
            )
          );
        },
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        onDone: () => {
          setIsLoading(false);
          setPipelineState("IDLE");
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
          );
        },
        onError: (err) => {
          setIsLoading(false);
          setPipelineState("ERROR");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      m.content ||
                      `Encountered an issue during retrieval: ${err}`,
                    streaming: false,
                  }
                : m
            )
          );
        },
      },
      selectedDocId
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadToast(`Ingesting ${file.name}...`);
    try {
      const res = await uploadDocument(file);
      await refreshDocuments();
      // Automatically isolate active context to newly uploaded document
      setSelectedDocId(res.document.id);
      setUploadToast(`Active context switched to: ${res.document.title}`);
      setTimeout(() => setUploadToast(null), 5000);
    } catch (err) {
      setUploadToast(
        `Upload error: ${err instanceof Error ? err.message : "Failed"}`
      );
      setTimeout(() => setUploadToast(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeDocName = selectedDocId
    ? documents.find((d) => d.id === selectedDocId)?.title || "Selected Document"
    : "All Documents (Corpus)";

  return (
    <div className="flex flex-col h-full bg-[#050814]/80 relative overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Context & Telemetry Bar */}
      <div className="px-4 md:px-6 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md">
        {/* Document Context Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            CONTEXT:
          </span>
          <select
            value={selectedDocId === null ? "" : String(selectedDocId)}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDocId(val === "" ? null : parseInt(val, 10));
            }}
            className="bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <option value="">All Documents (Entire Corpus)</option>
            {documents.map((doc) => (
              <option key={doc.id} value={String(doc.id)}>
                {doc.title}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSession}
            className="h-8 rounded-lg border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-500/40 text-slate-300 text-[11px] gap-1.5 font-mono"
            title="Clear context and start a new chat session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Session
          </Button>
        </div>

        {/* Dynamic Status / Pipeline indicator */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-cyan-300 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">{pipelineState}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px]">ISOLATED ENCLAVE READY</span>
            </div>
          )}
        </div>
      </div>

      {/* Upload notification toast */}
      <AnimatePresence>
        {uploadToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-cyan-950/90 border-b border-cyan-500/30 px-6 py-2 text-xs font-mono text-cyan-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{uploadToast}</span>
            </div>
            <button
              onClick={() => setUploadToast(null)}
              className="text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 md:gap-4 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 md:p-5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-cyan-500 text-slate-950 font-medium shadow-[0_0_20px_rgba(6,182,212,0.25)] rounded-br-none"
                    : "bg-slate-950/70 border border-slate-800/90 text-slate-100 shadow-xl rounded-tl-none backdrop-blur-xl"
                }`}
              >
                {/* Assistant Message Header / Speech button */}
                {m.role === "assistant" && (
                  <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        DOCMIND SYNTHESIS
                      </span>
                      {m.confidenceLabel && CONFIDENCE_STYLES[m.confidenceLabel] && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            CONFIDENCE_STYLES[m.confidenceLabel].bg
                          } ${CONFIDENCE_STYLES[m.confidenceLabel].text} ${
                            CONFIDENCE_STYLES[m.confidenceLabel].border
                          }`}
                        >
                          {CONFIDENCE_STYLES[m.confidenceLabel].label}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleSpeech(m.id, m.content)}
                      className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
                      title={
                        speakingMessageId === m.id
                          ? "Stop reading aloud"
                          : "Read response aloud (Text-to-Speech)"
                      }
                    >
                      {speakingMessageId === m.id ? (
                        <VolumeX size={15} className="text-rose-400 animate-pulse" />
                      ) : (
                        <Volume2 size={15} />
                      )}
                    </button>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap">{m.content}</div>

                {m.streaming && (
                  <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle" />
                )}

                {/* Retrieved Source Citations Accordion */}
                {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <FileText size={13} />
                        RETRIEVED CITATIONS ({m.sources.length})
                      </span>
                      <span className="text-slate-500">GROUNDED PASSAGES</span>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {m.sources.map((src, i) => {
                        const sourceKey = `${m.id}_src_${i}`;
                        const isExpanded = !!expandedSources[sourceKey];
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 text-xs transition-all hover:border-cyan-500/30"
                          >
                            <button
                              onClick={() => toggleSourceExpand(sourceKey)}
                              className="w-full flex items-center justify-between text-left font-mono text-slate-300 hover:text-white"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold">
                                  SOURCE {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="truncate font-semibold text-slate-200">
                                  {src.source}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[10px]">
                                <span className="text-emerald-400 font-bold">
                                  {Math.round((src.similarity || 0.85) * 100)}% MATCH
                                </span>
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 pt-2 border-t border-slate-800 text-slate-300 font-serif italic text-xs leading-relaxed overflow-hidden"
                                >
                                  &ldquo;{src.text}&rdquo;
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 border-t border-white/5 bg-slate-950/90 backdrop-blur-xl">
        {/* Active Context Banner */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">ACTIVE TARGET:</span>
            <span className="text-slate-200">{activeDocName}</span>
          </div>
          {selectedDocId !== null && (
            <button
              onClick={() => setSelectedDocId(null)}
              className="text-cyan-400 hover:underline"
            >
              Reset to All Corpus
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Upload Paper Button */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-12 w-12 shrink-0 border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload research paper to knowledge base"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin text-cyan-400" />
            ) : (
              <Paperclip size={18} />
            )}
          </Button>

          {/* Voice Input (Speech-to-Text) Button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-xl h-12 w-12 shrink-0 border transition-all",
              isListening
                ? "border-rose-500 bg-rose-950/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse"
                : "border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300"
            )}
            onClick={toggleListening}
            title={
              isListening
                ? "Listening... click to stop recording"
                : "Speak question (Speech-to-Text)"
            }
          >
            {isListening ? (
              <MicOff size={18} className="text-rose-400 animate-bounce" />
            ) : (
              <Mic size={18} />
            )}
          </Button>

          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedDocId
                  ? `Ask questions strictly about ${activeDocName}...`
                  : "Ask a research question across your documents..."
              }
              className="pl-4 pr-12 h-12 rounded-xl border-slate-800 bg-slate-900/60 text-slate-100 placeholder-slate-500 text-sm focus:border-cyan-500/50"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute right-1.5 top-1.5 rounded-lg h-9 w-9 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
