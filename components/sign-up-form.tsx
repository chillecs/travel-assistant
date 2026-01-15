"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chrome, Facebook, Github } from "lucide-react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputClassName =
    "h-11 rounded-xl border border-transparent bg-white/70 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200/70 transition focus-visible:ring-2 focus-visible:ring-slate-400/60";
  const labelClassName =
    "text-xs font-medium uppercase tracking-[0.2em] text-slate-500";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate username
    if (!username.trim()) {
      setError("Username is required");
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      setIsLoading(false);
      return;
    }

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            username: username.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      // If user was created, try to update the profile with username
      // Note: The database trigger should handle this automatically, but we do it here as a backup
      if (authData.user) {
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: authData.user.id,
              username: username.trim(),
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
            // Don't fail the signup if profile creation fails - trigger will handle it
            // This is just a backup, so we continue even if it fails
          }
        } catch (profileErr) {
          // Silently fail - the database trigger will create the profile
          console.error("Profile creation error (non-critical):", profileErr);
        }
      }

      router.push("/auth/sign-up-success");
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
          Create your account
        </h1>
        <p className="text-sm text-slate-600">
          Start building premium itineraries in minutes.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="username" className={labelClassName}>
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className={inputClassName}
            />
            <p className="text-xs text-slate-400">
              Letters, numbers, and underscores only. 3+ characters.
            </p>
          </div>
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
            <Label htmlFor="password" className={labelClassName}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-password" className={labelClassName}>
              Repeat password
            </Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
            {isLoading ? "Creating an account..." : "Create account"}
          </Button>
        </form>

        {/* Social Login Buttons */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/70"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Coming soon"
            >
              <Chrome size={18} />
              <span className="hidden sm:inline">Google</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Coming soon"
            >
              <Facebook size={18} />
              <span className="hidden sm:inline">Facebook</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Coming soon"
            >
              <Github size={18} />
              <span className="hidden sm:inline">GitHub</span>
            </button>
          </div>
        </div>
      </div>

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
