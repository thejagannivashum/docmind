"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, FileText, MessageSquare, UploadCloud, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalyticsOverview, DocumentRecord, UserProfile, getAnalytics, listDocuments, getMe } from "@/lib/api";

export default function DashboardOverview() {
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getAnalytics(), listDocuments(), getMe()]).then(([statsRes, docsRes, profileRes]) => {
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (docsRes.status === "fulfilled") {
        setRecentDocs(
          [...docsRes.value].sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()).slice(0, 3)
        );
      }
      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            {profile ? `Welcome back, ${profile.email.split("@")[0]}` : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-lg">Here's what's happening in your workspace today.</p>
        </div>
        <Link href="/dashboard/documents"><Button className="rounded-full shadow-lg h-12 px-6"><UploadCloud className="mr-2" /> Upload Document</Button></Link>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { title: "Total Documents", value: stats ? String(stats.total_documents) : "—", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
              { title: "AI Queries", value: stats ? String(stats.questions_asked) : "—", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
              { title: "Avg. Confidence", value: stats ? `${Math.round(stats.avg_confidence * 100)}%` : "—", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass p-6 rounded-3xl border-border shadow-sm flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-3xl border-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Recent Documents</h3>
                <Link href="/dashboard/documents"><Button variant="ghost" size="sm">View All <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
              </div>
              <div className="space-y-4">
                {recentDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No documents uploaded yet.</p>
                ) : (
                  recentDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 hover:bg-background/80 transition-colors cursor-pointer border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><FileText size={20} /></div>
                        <div>
                          <p className="font-semibold">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(doc.upload_date).toLocaleDateString()} &middot; {(doc.file_size_bytes / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Chat</h3>
                <Link href="/dashboard/chat"><Button variant="ghost" size="sm">Open Chat <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
              </div>
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                  <MessageSquare size={22} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats && stats.questions_asked > 0
                    ? `You've asked ${stats.questions_asked} question${stats.questions_asked !== 1 ? "s" : ""} so far.`
                    : "Ask your first question about an uploaded document."}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}