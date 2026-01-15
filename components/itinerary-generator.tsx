"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ItineraryActivity = {
  time: string;
  description: string;
  location: string;
  estimatedCost: string;
};

type ItineraryDay = {
  day: number;
  theme: string;
  activities: ItineraryActivity[];
};

type ItineraryResponse = {
  tripName: string;
  days: ItineraryDay[];
};

export function ItineraryGenerator() {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [interests, setInterests] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const showDuration = destination.trim().length > 0;
  const showInterests = showDuration && duration.trim().length > 0;
  const canGenerate = destination.trim().length > 0 && duration.trim().length > 0 && interests.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || isRequestInProgress || isLoading) return;
    
    setError(null);
    setIsLoading(true);
    setIsRequestInProgress(true);
    setItinerary(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          duration: Number(duration),
          interests: interests.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const errorMessage =
          data?.error ??
          (response.status === 429
            ? "Too many requests. Please wait a moment and try again."
            : response.status === 503 || response.status === 504
              ? "Service temporarily unavailable. Please try again in a moment."
              : "We couldn't generate your itinerary. Please try again.");
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as { 
        itinerary?: ItineraryResponse;
        saveError?: string;
      };
      if (!data?.itinerary) {
        throw new Error("We couldn't generate your itinerary. Please try again.");
      }

      setItinerary(data.itinerary);
      setError(null); // Clear any previous errors
      
      // Show a warning if save failed but itinerary was generated
      if (data.saveError) {
        setSaveWarning(data.saveError);
      } else {
        setSaveWarning(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMessage);
      setSaveWarning(null); // Clear save warning on actual error
    } finally {
      setIsLoading(false);
      setIsRequestInProgress(false);
    }
  };

  const inputBase =
    "w-full rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.08)] outline-none ring-1 ring-slate-200/70 transition focus:ring-2 focus:ring-slate-400/60";

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="space-y-6">
          {/* Step 1: Destination */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-slate-700">
              Where do you want to go?
            </label>
            <div className="relative">
              <MapPin
                size={18}
                strokeWidth={1.5}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Tokyo, Japan"
                className={cn(inputBase, "pl-11 text-base")}
                autoFocus
              />
            </div>
          </motion.div>

          {/* Step 2: Duration - appears when destination is filled */}
          <AnimatePresence>
            {showDuration && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-2 overflow-hidden"
              >
                <label className="block text-sm font-medium text-slate-700">
                  For how many days?
                </label>
                <div className="relative">
                  <CalendarDays
                    size={18}
                    strokeWidth={1.5}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min={1}
                    max={21}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="5"
                    className={cn(inputBase, "pl-11 text-base")}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Interests - appears when duration is filled */}
          <AnimatePresence>
            {showInterests && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-2 overflow-hidden"
              >
                <label className="block text-sm font-medium text-slate-700">
                  What are you interested in? (museum, art, food, etc...)
                </label>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="museums, art galleries, local cuisine, nightlife..."
                  rows={3}
                  className={cn(inputBase, "resize-none text-base")}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Magic Button - appears when all fields are filled */}
          <AnimatePresence>
            {canGenerate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || isRequestInProgress}
                  className="group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition-all hover:from-slate-800 hover:via-slate-600 hover:to-slate-400 hover:shadow-xl hover:shadow-slate-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Sparkles size={18} strokeWidth={2} className="transition-transform group-hover:rotate-12" />
                    {isLoading ? "Generating your escape..." : "Generate My Escape"}
                  </span>
                  {/* Animated glow effect on edges */}
                  <span className="absolute -inset-1 animate-pulse rounded-xl bg-gradient-to-r from-slate-400/40 via-slate-300/50 to-slate-400/40 blur-lg opacity-75" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-200/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-600"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <div>
                  <p className="font-medium">{error}</p>
                  {error.toLowerCase().includes("too many requests") && (
                    <p className="mt-1 text-xs text-rose-500">
                      Please wait 30-60 seconds before trying again.
                    </p>
                  )}
                  {error.toLowerCase().includes("credits") || error.toLowerCase().includes("quota") ? (
                    <p className="mt-1 text-xs text-rose-500">
                      Please add credits to your OpenAI account to continue using this feature.
                    </p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}

          {saveWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-700"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5">ℹ️</span>
                <div>
                  <p className="font-medium">{saveWarning}</p>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-slate-400 via-slate-600 to-slate-400" />
              </div>
              <p className="text-center text-sm text-slate-500">
                Crafting your perfect escape...
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-200/80" />
            <div className="mt-6 grid gap-4">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-slate-100/90"
                />
              ))}
            </div>
          </motion.div>
        ) : null}

        {itinerary ? (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Your itinerary
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                {itinerary.tripName}
              </h3>
            </div>

            <div className="grid gap-5">
              {itinerary.days?.map((day) => (
                <div
                  key={day.day}
                  className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      <CalendarDays size={14} strokeWidth={1.2} />
                      Day {day.day}
                    </div>
                    <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      {day.theme}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {day.activities?.map((activity, index) => (
                      <div
                        key={`${day.day}-${index}`}
                        className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                              <Clock size={14} strokeWidth={1.2} />
                              {activity.time}
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MapPin size={14} strokeWidth={1.2} />
                              {activity.location}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            {activity.estimatedCost}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
