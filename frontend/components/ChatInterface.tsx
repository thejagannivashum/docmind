"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, ShieldAlert, Mic, Activity, Paperclip, Loader2 } from "lucide-react";
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

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hello! I'm DocMind AI. Upload a document, then ask me anything about it." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input };
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
      },
      onError: (message) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `Error: ${message}`, streaming: false } : m))
        );
        setIsLoading(false);
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
            ? `**${file.name}** was already uploaded — reusing the existing index.`
            : `**${file.name}** — ${result.message}`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}` },
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileSelect} />
      <div className="flex-1 overflow-y-auto p-6 space-y-8" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-5 max-w-4xl mx-auto w-full", msg.role === "user" ? "flex-row-reverse" : "")}>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={cn("flex flex-col gap-2 max-w-[80%]", msg.role === "user" ? "items-end" : "items-start")}>
                <div className={cn("px-5 py-3.5 rounded-2xl text-base shadow-sm whitespace-pre-wrap", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-background border border-border rounded-tl-sm")}>
                  {msg.content}
                  {msg.streaming && !msg.content && (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    </span>
                  )}
                </div>
                {msg.role === "assistant" && !msg.streaming && (msg.confidence !== undefined || msg.conflictDetected) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.confidenceLabel && (
                      <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border", CONFIDENCE_STYLES[msg.confidenceLabel])}>
                        <Activity size={14} /> {Math.round((msg.confidence ?? 0) * 100)}% confidence
                      </div>
                    )}
                    {msg.conflictDetected && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <ShieldAlert size={14} /> Sources disagree
                      </div>
                    )}
                    {msg.conflictDetected && msg.conflictingPairs && msg.conflictingPairs.length > 0 && (
                      <div className="w-full mt-2 text-sm border border-amber-500/30 rounded-xl bg-amber-500/5 overflow-hidden">
                        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 font-semibold text-amber-700 dark:text-amber-400">
                          Conflicting sources
                        </div>
                        <div className="p-3 space-y-3">
                          {msg.conflictingPairs.map((p, i) => (
                            <div key={i} className="text-xs space-y-1">
                              <div><span className="font-semibold">{p.source_a}:</span> <span className="text-muted-foreground">{p.text_a}</span></div>
                              <div><span className="font-semibold">{p.source_b}:</span> <span className="text-muted-foreground">{p.text_b}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full mt-2 text-sm border border-border rounded-xl bg-background/50 overflow-hidden shadow-sm">
                        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border font-semibold text-muted-foreground flex items-center">
                          Sources used ({msg.sources.length})
                        </div>
                        <div className="p-3 space-y-2">
                          {msg.sources.map((s, i) => (
                            <div key={i} className="pl-3 border-l-2 border-primary/40">
                              <span className="font-semibold text-foreground mr-2">{s.source}</span>
                              <span className="text-muted-foreground italic">&quot;{s.text.slice(0, 140)}{s.text.length > 140 ? "…" : ""}&quot;</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="p-6 bg-background/50 backdrop-blur-md border-t border-border/50">
        <div className="max-w-4xl mx-auto relative flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-2xl h-14 w-14 shrink-0 bg-background/50"
            onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
          </Button>
          <div className="relative flex-1">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask a complex question..." className="pl-6 pr-16 h-14 rounded-2xl bg-background/50 shadow-sm text-base" />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="absolute right-2 top-2 rounded-xl h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
              <Send size={18} />
            </Button>
          </div>
          {/* Voice input is not wired yet — offline STT/TTS is a separate build step */}
          <Button variant="outline" size="icon" className="rounded-2xl h-14 w-14 shrink-0 bg-background/50 opacity-50 cursor-not-allowed" disabled title="Voice input coming soon">
            <Mic size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
