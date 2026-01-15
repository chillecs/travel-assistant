"use client";

import { useState, Suspense } from "react";
import { CalendarDays, MapPin, Sparkles, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ItineraryGeneratorV2 } from "@/components/itinerary-generator-v2";
import { TripsSidebar } from "@/components/trips-sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

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

function GeneratorPanel() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        
        // Validate user still exists
        if (currentUser) {
          const { data: profileCheck, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", currentUser.id)
            .single();

          // Only sign out if it's a "no rows" error (user deleted), not schema cache errors
          if (!profileCheck && profileError) {
            // PGRST116 = no rows returned (user doesn't exist)
            if (profileError.code === "PGRST116") {
              // User was deleted - sign them out
              await supabase.auth.signOut();
              setUser(null);
              window.location.href = "/auth/login";
              return;
            }
            // Schema cache errors - ignore and continue (table might not be in cache yet)
            if (profileError.message?.includes("schema cache") || 
                profileError.message?.includes("Could not find the table")) {
              console.warn("Schema cache issue - continuing anyway");
              // Continue - user is valid, just schema cache issue
            }
          }
        }
        
        setUser(currentUser);
        // Auto-open sidebar on desktop
        if (currentUser && typeof window !== "undefined" && window.innerWidth >= 1024) {
          setSidebarOpen(true);
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  if (isLoading) {
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

  if (!user) {
    return <LoginCard />;
  }

  return (
    <div className="flex gap-6">
      <TripsSidebar
        currentTripId={currentTripId}
        onSelectTrip={setCurrentTripId}
        onNewTrip={() => {
          setCurrentTripId(null);
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        refreshTrigger={refreshTrigger}
      />
      <div className="flex-1 min-w-0">
        <ItineraryGeneratorV2
          tripId={currentTripId}
          onTripSaved={(id) => {
            setCurrentTripId(id);
            setRefreshTrigger((prev) => prev + 1); // Trigger sidebar refresh
          }}
          onNewTrip={() => setCurrentTripId(null)}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-slate-100/80 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full pb-24 pt-16 lg:pt-24">
        <div className="px-6">
          {/* Hero text for logged in users - shown on mobile/tablet */}
          <div className="mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur">
              <Sparkles size={14} strokeWidth={1.2} />
              AI itinerary studio
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              TravelAI crafts{" "}
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 bg-clip-text text-transparent">
                premium itineraries
              </span>
            </h1>
          </div>

          <Suspense fallback={
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-200/80" />
              <div className="mt-6 space-y-3">
                <div className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
              </div>
            </div>
          }>
            <GeneratorPanel />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
