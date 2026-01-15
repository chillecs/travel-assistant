import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, MapPin, Sparkles, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ItineraryGenerator } from "@/components/itinerary-generator";
import { Button } from "@/components/ui/button";

function LoginCard() {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <h3 className="text-2xl font-semibold tracking-tight">Please login</h3>
      <p className="mt-3 text-sm text-slate-600">
        Sign in to generate personalized itineraries and save them to your
        account.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          asChild
          className="h-11 rounded-xl bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 text-white shadow-lg shadow-slate-900/30 transition hover:from-slate-800 hover:via-slate-700 hover:to-slate-400"
        >
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-xl border-slate-200/70 bg-white/70 text-slate-700 transition hover:bg-white/90"
        >
          <Link href="/auth/sign-up">Create account</Link>
        </Button>
      </div>
    </div>
  );
}

function GeneratorFallback() {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-200/80" />
      <div className="mt-6 space-y-3">
        <div className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
        <div className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
        <div className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
      </div>
    </div>
  );
}

async function GeneratorPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? <ItineraryGenerator /> : <LoginCard />;
}

export default function Home() {

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-slate-100/80 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 lg:pt-24">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur">
              <Sparkles size={14} strokeWidth={1.2} />
              AI itinerary studio
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                TravelAI crafts{" "}
                <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 bg-clip-text text-transparent">
                  premium itineraries
                </span>{" "}
                in minutes.
              </h1>
              <p className="text-lg text-slate-600">
                A focused, AI-native planner for travelers who want curated days,
                budget-aware recommendations, and a refined itinerary you can
                actually follow.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={16} strokeWidth={1.2} />
                Neighborhood-first recommendations
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} strokeWidth={1.2} />
                Day-by-day structure
              </div>
              <div className="flex items-center gap-2">
                <Wallet size={16} strokeWidth={1.2} />
                Budget-aligned picks
              </div>
            </div>
          </div>

          <div className="lg:pt-4">
            <Suspense fallback={<GeneratorFallback />}>
              <GeneratorPanel />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
