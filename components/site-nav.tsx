import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
            <Sparkles size={16} strokeWidth={1.2} />
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 bg-clip-text text-transparent">
            TravelAI
          </span>
        </Link>
        {hasEnvVars ? (
          <Suspense>
            <AuthButton />
          </Suspense>
        ) : null}
      </div>
    </nav>
  );
}
