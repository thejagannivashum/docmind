"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocumentRecord, listDocuments, generateSummary, generateQuiz, generateFlashcards,
} from "@/lib/api";

type Tab = "summary" | "quiz" | "flashcards";

export default function StudyToolsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<{ question: string; options: string[]; correct_index: number }[] | null>(null);
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[] | null>(null);

  useEffect(() => {
    listDocuments()
      .then((docs) => {
        const indexed = docs.filter((d) => d.status === "indexed");
        setDocuments(indexed);
        if (indexed.length > 0) setSelectedId(indexed[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load documents."))
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
      setError(err instanceof Error ? err.message : `Couldn't generate ${which}.`);
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
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold mb-1.5">No indexed documents yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Upload and index a document first, then come back here to generate a summary, quiz, or flashcards from it.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Study Tools</h1>
        <p className="text-muted-foreground">Generate a summary, quiz, or flashcards from any indexed document.</p>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => selectDocument(doc.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              selectedId === doc.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background/50 border-border hover:bg-secondary/50"
            }`}
          >
            <FileText className="w-4 h-4" /> {doc.title}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(["summary", "quiz", "flashcards"] as Tab[]).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} className="rounded-xl capitalize" onClick={() => runGenerate(t)}>
            {t}
          </Button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 max-w-2xl">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="glass rounded-3xl border border-border shadow-sm p-6 min-h-[300px]">
        {generating ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Generating with the local model — this can take a moment...
          </div>
        ) : tab === "summary" ? (
          summary ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{summary}</div>
          ) : (
            <EmptyPrompt label="Generate a summary" onClick={() => runGenerate("summary")} />
          )
        ) : tab === "quiz" ? (
          quiz ? <QuizView questions={quiz} /> : <EmptyPrompt label="Generate a quiz" onClick={() => runGenerate("quiz")} />
        ) : flashcards ? (
          <FlashcardsView cards={flashcards} />
        ) : (
          <EmptyPrompt label="Generate flashcards" onClick={() => runGenerate("flashcards")} />
        )}
      </div>
    </div>
  );
}

function EmptyPrompt({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-muted-foreground">Nothing generated for this document yet.</p>
      <Button onClick={onClick} className="rounded-xl">{label}</Button>
    </div>
  );
}

function QuizView({ questions }: { questions: { question: string; options: string[]; correct_index: number }[] }) {
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
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground mb-2">Question {index + 1} of {questions.length}</p>
      <h3 className="text-lg font-bold mb-5">{q.question}</h3>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct_index;
          const isChosen = i === selected;
          const revealed = selected !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${
                revealed && isCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" :
                revealed && isChosen && !isCorrect ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400" :
                "bg-background/50 border-border hover:bg-secondary/50"
              }`}
            >
              {opt}
              {revealed && isCorrect && <Check className="w-4 h-4 shrink-0" />}
              {revealed && isChosen && !isCorrect && <X className="w-4 h-4 shrink-0" />}
            </button>
          );
        })}
      </div>
      {selected !== null && index < questions.length - 1 && (
        <Button onClick={next} className="mt-5 rounded-xl gap-1">Next question <ChevronRight className="w-4 h-4" /></Button>
      )}
    </div>
  );
}

function FlashcardsView({ cards }: { cards: { front: string; back: string }[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => Math.max(0, Math.min(i + delta, cards.length - 1)));
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center">
      <p className="text-sm text-muted-foreground mb-4">Card {index + 1} of {cards.length} — click to flip</p>
      <motion.div
        onClick={() => setFlipped((f) => !f)}
        className="w-full h-56 rounded-2xl bg-background border border-border shadow-md flex items-center justify-center p-6 text-center cursor-pointer select-none"
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          <motion.p key={flipped ? "back" : "front"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-medium">
            {flipped ? card.back : card.front}
          </motion.p>
        </AnimatePresence>
      </motion.div>
      <div className="flex items-center gap-4 mt-5">
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => go(1)} disabled={index === cards.length - 1}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
