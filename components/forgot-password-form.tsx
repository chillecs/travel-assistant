"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      // Get the site URL from environment variable or fall back to current origin
      // Use NEXT_PUBLIC_ prefix so it's available in the browser
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
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
          Reset your password
        </h1>
        <p className="text-sm text-slate-600">
          We&apos;ll send a secure reset link to your inbox.
        </p>
      </div>

      {success ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-left shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold tracking-tight">
            Check your email
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            If you registered using your email and password, you will receive a
            password reset email shortly.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <form onSubmit={handleForgotPassword} className="space-y-5">
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
              {isLoading ? "Sending..." : "Send reset email"}
            </Button>
          </form>
        </div>
      )}

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-slate-900 transition hover:text-slate-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
