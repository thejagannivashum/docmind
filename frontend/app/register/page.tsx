"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register, login } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      await login(email, password); // register doesn't return a token, so log in right after
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
        <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight">Create an account</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
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
              <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
