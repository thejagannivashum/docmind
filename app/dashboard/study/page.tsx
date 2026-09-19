"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocumentRecord,
  listDocuments,
  generateSummary,
  generateQuiz,
  generateFlashcards,
} from "@/lib/api";

type Tab = "summary" | "quiz" | "flashcards";

export default function StudyPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<
    { question: string; options: string[]; correct_index: number }[] | null
  >(null);
  const [flashcards, setFlashcards] = useState<
    { front: string; back: string }[] | null
  >(null);

  useEffect(() => {
    listDocuments()
      .then((docs) => {
        const indexed = docs.filter((d) => d.status === "indexed");
        setDocuments(indexed);
        if (indexed.length > 0) setSelectedId(indexed[0].id);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Couldn't load documents.")
      )
      .finally(() => setLoading(false));
  }, []);

  const runGenerate = async (which: Tab) => {
    if (!selectedId) return;
    setTab(which);
    setError(null);
    setGenerating(true);
    try {
      if (which === "summary" && !summary) {
        const res = await generateSummary(selectedId);
        setSummary(res.summary);
      } else if (which === "quiz" && !quiz) {
        const res = await generateQuiz(selectedId);
        setQuiz(res.questions);
      } else if (which === "flashcards" && !flashcards) {
        const res = await generateFlashcards(selectedId);
        setFlashcards(res.flashcards);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Couldn't generate ${which}.`
      );
    } finally {
      setGenerating(false);
    }
  };

  const selectDocument = (id: number) => {
    setSelectedId(id);
    setSummary(null);
    setQuiz(null);
    setFlashcards(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold mb-1.5 text-white">
          No indexed documents yet
        </h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Upload and index a document first, then come back here to generate a
          summary, quiz, or flashcards from it.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto space-y-6 bg-[#050814]/60">
      <header className="pb-6 border-b border-white/5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
          Study &amp; Synthesis Tools
        </h1>
        <p className="text-sm text-slate-400">
          Generate an AI-powered summary, quiz, or flashcards from any indexed document.
        </p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => selectDocument(doc.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono border transition-all ${
              selectedId === doc.id
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/70"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> {doc.title}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["summary", "quiz", "flashcards"] as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            className={`rounded-xl capitalize text-xs font-mono ${
              tab === t
                ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                : "border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => runGenerate(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-500/20 rounded-xl px-4 py-3 max-w-2xl">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl p-6 min-h-[350px]">
        {generating ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 font-mono text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            SYNTHESIZING WITH RAG PIPELINE...
          </div>
        ) : tab === "summary" ? (
          summary ? (
            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
              {summary}
            </div>
          ) : (
            <EmptyPrompt
              label="Generate a summary"
              onClick={() => runGenerate("summary")}
            />
          )
        ) : tab === "quiz" ? (
          quiz ? (
            <QuizView questions={quiz} />
          ) : (
            <EmptyPrompt
              label="Generate a quiz"
              onClick={() => runGenerate("quiz")}
            />
          )
        ) : flashcards ? (
          <FlashcardsView cards={flashcards} />
        ) : (
          <EmptyPrompt
            label="Generate flashcards"
            onClick={() => runGenerate("flashcards")}
          />
        )}
      </div>
    </div>
  );
}

function EmptyPrompt({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-slate-500 text-sm font-mono">
        Nothing generated for this document yet.
      </p>
      <Button
        onClick={onClick}
        className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs"
      >
        {label}
      </Button>
    </div>
  );
}

function QuizView({
  questions,
}: {
  questions: { question: string; options: string[]; correct_index: number }[];
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const q = questions[index];

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
  };

  const next = () => {
    setSelected(null);
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <p className="text-xs font-mono text-cyan-400 mb-2">
        Question {index + 1} of {questions.length}
      </p>
      <h3 className="text-lg font-bold text-white mb-6">{q.question}</h3>
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct_index;
          const isChosen = i === selected;
          const revealed = selected !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                revealed && isCorrect
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : revealed && isChosen && !isCorrect
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900/80 hover:border-slate-700"
              }`}
            >
              <span>{opt}</span>
              {revealed && isCorrect && (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {revealed && isChosen && !isCorrect && (
                <X className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      {selected !== null && index < questions.length - 1 && (
        <Button
          onClick={next}
          className="mt-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono gap-1"
        >
          Next question <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function FlashcardsView({
  cards,
}: {
  cards: { front: string; back: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => Math.max(0, Math.min(i + delta, cards.length - 1)));
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center py-4">
      <p className="text-xs font-mono text-cyan-400 mb-4">
        Card {index + 1} of {cards.length} — click card to flip
      </p>
      <div
        onClick={() => setFlipped((f) => !f)}
        className="w-full h-60 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 shadow-xl flex items-center justify-center p-6 text-center cursor-pointer select-none transition-all"
      >
        <p className="text-base text-slate-200 font-medium">
          {flipped ? card.back : card.front}
        </p>
      </div>
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl border-slate-800 text-slate-400 hover:text-white"
          onClick={() => go(-1)}
          disabled={index === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl border-slate-800 text-slate-400 hover:text-white"
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
