"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, FileText, Sparkles, ShieldAlert, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden flex flex-col">
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/20">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">D</div>
            <span className="text-2xl font-bold tracking-tight">DocMind</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login"><Button variant="ghost" className="rounded-full font-medium">Log in</Button></Link>
            <Link href="/register"><Button className="rounded-full shadow-lg shadow-primary/20 font-medium">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/20 mb-8 text-sm font-medium shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">The Next Generation AI Assistant</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Think deeper.<br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">Research faster.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Transform your documents into an interactive, omniscient knowledge base. Chat, analyze, and uncover insights with unprecedented clarity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-medium shadow-xl shadow-primary/20 w-full sm:w-auto group">
                Start Researching Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-medium w-full sm:w-auto glass hover:bg-white/50">
              View Demo
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            { icon: Brain, title: "Neural Comprehension", desc: "Advanced RAG architecture powered by the latest local LLMs for deep understanding." },
            { icon: ShieldAlert, title: "Conflict Detection", desc: "Automatically identifies and flags contradictory claims across your entire corpus." },
            { icon: Layers, title: "Smart Citations", desc: "Every answer is backed by precise, verifiable citations and confidence scores." }
          ].map((f, i) => (
            <div key={i} className="glass p-8 rounded-3xl flex flex-col items-start text-left hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}