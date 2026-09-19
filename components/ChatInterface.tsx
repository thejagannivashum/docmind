"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  ShieldAlert,
  Activity,
  Paperclip,
  Loader2,
  Sparkles,
  Search,
  Database,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat, uploadDocument, ChatMeta } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  confidenceLabel?: ChatMeta["confidence_label"];
  conflictDetected?: boolean;
  conflictingPairs?: ChatMeta["conflicting_pairs"];
  sources?: ChatMeta["sources"];
  streaming?: boolean;
}

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  high: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    label: "HIGH CALIBRATION",
  },
  medium: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    label: "MODERATE CALIBRATION",
  },
  low: {
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    label: "LOW / UNVERIFIED",
  },
};

const SUGGESTED_QUERIES = [
  "Summarize the key architectural findings across uploaded papers.",
  "Are there conflicting claims regarding model latency or accuracy?",
  "What retrieval distance threshold was used in the experiments?",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the **DocMind Research Console**. All retrieval, embedding, and inference operations run strictly in-memory on your local machine with zero external cloud egress.\n\nAsk questions about your uploaded documents or upload new papers to inspect contradiction detection and calibrated citations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pipelineState, setPipelineState] = useState<string>("IDLE");
  const [expandedSourceIdx, setExpandedSourceIdx] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

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
    // Clean markdown formatting for clean spoken delivery
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

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pipelineState]);

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setIsLoading(true);

    // Research telemetry phases
    setPipelineState("SEARCHING LOCAL DOCUMENT CORPUS...");
    setTimeout(() => {
      setPipelineState("RETRIEVING RELEVANT PASSAGES...");
    }, 400);
    setTimeout(() => {
      setPipelineState("SYNTHESIZING GROUNDED ANSWER...");
    }, 950);

    await streamChat(userMessage.content, history, sessionId, {
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
      onToken: (content) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + content } : m))
        );
      },
      onDone: () => {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
        setIsLoading(false);
        setPipelineState("VERIFIED ANSWER DELIVERED");
      },
      onError: (message) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `Error: ${message}`, streaming: false } : m))
        );
        setIsLoading(false);
        setPipelineState("ERROR OCCURRED");
      },
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadDocument(file);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.is_duplicate
            ? `**${file.name}** was already indexed in ChromaDB &mdash; vector space preserved.`
            : `**${file.name}** &mdash; ${result.message} (${result.document.chunk_count} chunks indexed).`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`,
        },
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050814]/80 backdrop-blur-xl relative">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileSelect} />

      {/* Top Status & Telemetry Bar */}
      <div className="px-6 py-3 border-b border-cyan-500/10 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>ENCLAVE: ACTIVE</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-purple-400 hidden sm:flex">
            <Database className="w-3.5 h-3.5" />
            <span>LOCAL CORPUS</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400 hidden md:flex">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>VERIFIED CITATIONS</span>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">{pipelineState}</span>
          </div>
        )}
      </div>

      {/* Scrollable Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const confStyle = msg.confidenceLabel ? CONFIDENCE_STYLES[msg.confidenceLabel] : null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4 max-w-4xl mx-auto w-full", msg.role === "user" ? "flex-row-reverse" : "")}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                    msg.role === "assistant"
                      ? "bg-cyan-500/15 border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      : "bg-purple-500/15 border-purple-400/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  )}
                >
                  {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                </div>

                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%] sm:max-w-[78%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "px-5 py-4 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap border",
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/30 text-slate-100 rounded-tr-sm shadow-md"
                        : "bg-slate-900/70 border-slate-800 text-slate-200 rounded-tl-sm shadow-md backdrop-blur-md"
                    )}
                  >
                    {msg.content}
                    {msg.streaming && !msg.content && (
                      <span className="inline-flex gap-1.5 items-center py-1">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      </span>
                    )}
                  </div>

                  {/* Assistant Verification & Voice Metadata Deck */}
                  {msg.role === "assistant" && !msg.streaming && (
                    <div className="w-full flex flex-col gap-3 mt-2">
                      {/* Action & Metric Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Voice Text-to-Speech Output Button */}
                        <button
                          onClick={() => toggleSpeech(msg.id, msg.content)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer",
                            speakingMessageId === msg.id
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
                              : "bg-slate-900/60 text-slate-400 hover:text-white border-slate-800 hover:border-cyan-500/30"
                          )}
                          title={speakingMessageId === msg.id ? "Stop voice readout" : "Read response aloud using speech synthesis"}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX size={14} className="text-cyan-400" />
                              <span>STOP READOUT</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={14} />
                              <span>READ ALOUD (TTS)</span>
                            </>
                          )}
                        </button>

                        {confStyle && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border",
                              confStyle.bg,
                              confStyle.text,
                              confStyle.border
                            )}
                          >
                            <Activity size={14} />
                            <span>{Math.round((msg.confidence ?? 0) * 100)}% CONFIDENCE</span>
                            <span className="text-[10px] opacity-75">({confStyle.label})</span>
                          </div>
                        )}

                        {msg.conflictDetected && (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                            <ShieldAlert size={14} />
                            <span>CONTRADICTION DETECTED BY NLI</span>
                          </div>
                        )}
                      </div>

                      {/* Conflict Arbitration Breakdown Box */}
                      {msg.conflictDetected && msg.conflictingPairs && msg.conflictingPairs.length > 0 && (
                        <div className="w-full border border-rose-500/30 rounded-2xl bg-rose-950/20 overflow-hidden backdrop-blur-md">
                          <div className="px-4 py-2.5 bg-rose-950/40 border-b border-rose-500/20 font-mono text-xs font-bold text-rose-300 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <ShieldAlert size={14} className="text-rose-400" />
                              CROSS-ENCODER CONFLICT ARBITRATION
                            </span>
                            <span className="text-[10px] text-rose-400/80">cross-encoder/nli-deberta-v3</span>
                          </div>
                          <div className="p-4 space-y-3">
                            {msg.conflictingPairs.map((p, i) => (
                              <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-rose-500/20"
                              >
                                <div className="border-l-2 border-cyan-400 pl-3">
                                  <span className="font-mono text-cyan-300 font-bold block mb-1">
                                    Claim A: {p.source_a}
                                  </span>
                                  <p className="text-slate-300 italic">&ldquo;{p.text_a}&rdquo;</p>
                                </div>
                                <div className="border-l-2 border-rose-400 pl-3">
                                  <span className="font-mono text-rose-300 font-bold block mb-1">
                                    Claim B: {p.source_b}
                                  </span>
                                  <p className="text-slate-300 italic">&ldquo;{p.text_b}&rdquo;</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verifiable Source Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="w-full border border-cyan-500/20 rounded-2xl bg-slate-900/60 overflow-hidden backdrop-blur-md">
                          <div className="px-4 py-2.5 bg-slate-950/50 border-b border-white/5 font-mono text-xs text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-cyan-300 font-bold">
                              <CheckCircle2 size={14} className="text-cyan-400" />
                              VERIFIABLE CITATION SOURCES ({msg.sources.length})
                            </span>
                            <span className="text-[10px]">COSINE RANKED</span>
                          </div>
                          <div className="p-3 space-y-2">
                            {msg.sources.map((s, i) => {
                              const isExpanded = expandedSourceIdx === i;
                              return (
                                <div
                                  key={i}
                                  onClick={() => setExpandedSourceIdx(isExpanded ? null : i)}
                                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-cyan-500/30 transition-all cursor-pointer"
                                >
                                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                                      <ExternalLink size={12} />
                                      {s.source}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                                        MATCH
                                      </span>
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                  </div>
                                  <p
                                    className={cn(
                                      "text-xs text-slate-400 italic transition-all",
                                      isExpanded ? "line-clamp-none text-slate-200" : "line-clamp-2"
                                    )}
                                  >
                                    &ldquo;{s.text}&rdquo;
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Suggested Research Prompts (if chat is fresh) */}
      {messages.length === 1 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 max-w-4xl mx-auto w-full">
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-all flex items-center gap-2"
            >
              <Sparkles size={12} className="text-cyan-400" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Deck */}
      <div className="p-4 md:p-6 bg-slate-950/80 backdrop-blur-md border-t border-cyan-500/10">
        <div className="max-w-4xl mx-auto relative flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl h-14 w-14 shrink-0 border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload research paper"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin text-cyan-400" /> : <Paperclip size={20} />}
          </Button>

          {/* Voice Input (Speech-to-Text) Button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-2xl h-14 w-14 shrink-0 border transition-all cursor-pointer",
              isListening
                ? "border-rose-500 bg-rose-950/50 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-pulse"
                : "border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300"
            )}
            onClick={toggleListening}
            title={isListening ? "Listening... click to stop recording" : "Speak question (Speech-to-Text)"}
          >
            {isListening ? <MicOff size={20} className="text-rose-400 animate-bounce" /> : <Mic size={20} />}
          </Button>

          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a technical or research question about your local documents..."
              className="pl-6 pr-16 h-14 rounded-2xl border-slate-800 bg-slate-900/60 text-slate-100 placeholder-slate-500 text-sm md:text-base focus:border-cyan-500/50 shadow-inner"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute right-2 top-2 rounded-xl h-10 w-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
