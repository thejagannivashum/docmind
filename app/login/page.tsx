"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-xl shadow-primary/30">D</div>
        </div>
        <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight">Welcome back</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Don&apos;t have an account? <Link href="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass py-10 px-8 shadow-2xl sm:rounded-[2rem]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2">Email address</label>
              <Input type="email" required placeholder="you@example.com" className="h-12"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <Input type="password" required placeholder="••••••••" className="h-12"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 px-2 text-muted-foreground backdrop-blur-sm rounded-full">Or quick test</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={async () => {
                setLoading(true);
                try {
                  await login("demo@docmind.ai", "demo1234");
                  router.push("/dashboard");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Demo sign in failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Explore with Demo Account
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
