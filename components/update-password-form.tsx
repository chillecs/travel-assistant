"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputClassName =
    "h-11 rounded-xl border border-transparent bg-white/70 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200/70 transition focus-visible:ring-2 focus-visible:ring-slate-400/60";
  const labelClassName =
    "text-xs font-medium uppercase tracking-[0.2em] text-slate-500";

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
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
        <h1 className="text-3xl font-semibold tracking-tight">
          Create a new password
        </h1>
        <p className="text-sm text-slate-600">
          Choose a secure password to protect your account.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="password" className={labelClassName}>
              New password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a new password"
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
            {isLoading ? "Saving..." : "Save new password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
