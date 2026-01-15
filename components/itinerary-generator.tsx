"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BudgetOption = "Economy" | "Standard" | "Luxury";

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

const budgets: BudgetOption[] = ["Economy", "Standard", "Luxury"];

export function ItineraryGenerator() {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("5");
  const [budget, setBudget] = useState<BudgetOption>("Standard");
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    setItinerary(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          duration: Number(duration),
          budget,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ??
            "We couldn't generate your itinerary. Please try again.",
        );
      }

      const data = (await response.json()) as { itinerary?: ItineraryResponse };
      if (!data?.itinerary) {
        throw new Error("We couldn't generate your itinerary. Please try again.");
      }

      setItinerary(data.itinerary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.08)] outline-none ring-1 ring-slate-200/70 transition focus:ring-2 focus:ring-slate-400/60";

  return (
    <div className="grid gap-6">
      <form
        onSubmit={handleGenerate}
        className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Trip Generator
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Design your next trip
            </h3>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
            <Sparkles size={18} strokeWidth={1.2} />
          </span>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Destination
            <div className="relative">
              <MapPin
                size={16}
                strokeWidth={1.2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Tokyo, Japan"
                className={cn(inputBase, "pl-9")}
                required
              />
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Duration
              <div className="relative">
                <CalendarDays
                  size={16}
                  strokeWidth={1.2}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  min={1}
                  max={21}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className={cn(inputBase, "pl-9")}
                  required
                />
              </div>
            </label>

            <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Budget
              <div className="relative">
                <Wallet
                  size={16}
                  strokeWidth={1.2}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={budget}
                  onChange={(event) =>
                    setBudget(event.target.value as BudgetOption)
                  }
                  className={cn(inputBase, "appearance-none pl-9")}
                >
                  {budgets.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="mt-6 h-12 w-full rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/30 transition hover:bg-slate-900/90"
          disabled={isLoading}
        >
          {isLoading ? "Generating itinerary..." : "Generate itinerary"}
        </Button>

        {isLoading ? (
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-slate-400 via-slate-600 to-slate-400" />
          </div>
        ) : null}
      </form>

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
