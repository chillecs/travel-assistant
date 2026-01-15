import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <AuthShell>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
          <MailCheck size={18} strokeWidth={1.2} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Thank you for signing up!
          </h1>
          <p className="text-sm text-slate-600">
            Check your email to confirm your account.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-left shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <p className="text-sm text-slate-600">
            You&apos;ve successfully signed up. Please confirm your email before
            signing in to continue.
          </p>
        </div>
        <Button asChild className="h-11 rounded-xl">
          <Link href="/auth/login">Continue to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
