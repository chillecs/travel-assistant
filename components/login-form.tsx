"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputClassName =
    "h-11 rounded-xl border border-transparent bg-white/70 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200/70 transition focus-visible:ring-2 focus-visible:ring-slate-400/60";
  const labelClassName =
    "text-xs font-medium uppercase tracking-[0.2em] text-slate-500";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Use full page reload to ensure server components refresh
      window.location.href = "/";
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
          TravelAI Access
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-600">
          Sign in to continue building your itinerary.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className={labelClassName}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@travel.ai"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className={labelClassName}>
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-rose-200/60 bg-rose-50/80 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/30 transition hover:bg-slate-900/90"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Sign in"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-slate-900 transition hover:text-slate-700"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
