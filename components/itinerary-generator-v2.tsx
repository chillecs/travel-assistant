"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  User,
  Users,
  Baby,
  UsersRound,
  Car,
  Bus,
  Footprints,
  UtensilsCrossed,
  Send,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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

type TravelStyle = "Solo" | "Couple" | "Family" | "Friends";
type Pace = "Relaxed" | "Balanced" | "Intense";
type Transport = "Walking" | "Public Transport" | "Rental Car";

type ItineraryGeneratorV2Props = {
  tripId?: string | null;
  onTripSaved?: (tripId: string) => void;
  onNewTrip?: () => void;
};

export function ItineraryGeneratorV2({
  tripId: initialTripId,
  onTripSaved,
  onNewTrip,
}: ItineraryGeneratorV2Props) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [interests, setInterests] = useState("");
  const [travelStyle, setTravelStyle] = useState<TravelStyle>("Solo");
  const [pace, setPace] = useState<Pace>("Balanced");
  const [transport, setTransport] = useState<Transport>("Walking");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(initialTripId || null);
  const [refinementMessage, setRefinementMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  // Load trip if tripId is provided, or reset if null
  useEffect(() => {
    if (initialTripId && initialTripId !== currentTripId) {
      loadTrip(initialTripId);
    } else if (!initialTripId && currentTripId) {
      // Reset form when starting new trip
      setDestination("");
      setDuration("");
      setInterests("");
      setTravelStyle("Solo");
      setPace("Balanced");
      setTransport("Walking");
      setDietaryRestrictions("");
      setItinerary(null);
      setCurrentTripId(null);
      setRefinementMessage("");
      setError(null);
      setSaveWarning(null);
    }
  }, [initialTripId]);

  const loadTrip = async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setDestination(data.destination);
        setDuration(String(data.duration));
        setInterests(data.interests || "");
        setTravelStyle(data.travel_style || "Solo");
        setPace(data.pace || "Balanced");
        setTransport(data.transport || "Walking");
        setDietaryRestrictions(data.dietary_restrictions || "");
        setItinerary(data.itinerary_data);
        setCurrentTripId(data.id);
      }
    } catch (error) {
      console.error("Error loading trip:", error);
    }
  };

  const showDuration = destination.trim().length > 0;
  const showInterests = showDuration && duration.trim().length > 0;
  const showAdvanced = showInterests && interests.trim().length > 0;
  const canGenerate =
    destination.trim().length > 0 &&
    duration.trim().length > 0 &&
    interests.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || isRequestInProgress || isLoading) return;

    setError(null);
    setIsLoading(true);
    setIsRequestInProgress(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          duration: Number(duration),
          interests: interests.trim(),
          travelStyle,
          pace,
          transport,
          dietaryRestrictions: dietaryRestrictions.trim(),
          tripId: currentTripId,
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
        itineraryId?: string | null;
        saveError?: string;
        unclearInput?: boolean;
      };
      
      if (data.unclearInput) {
        throw new Error(`I didn't understand your request. Please provide clearer information. For example: Destination: "Paris, France", Duration: 5, Interests: "museums, art galleries, local cuisine".`);
      }
      
      if (!data?.itinerary) {
        throw new Error("I couldn't generate your itinerary. Please check your inputs and try again.");
      }

      setItinerary(data.itinerary);
      setError(null);
      if (data.itineraryId) {
        setCurrentTripId(data.itineraryId);
        onTripSaved?.(data.itineraryId);
      }

      if (data.saveError) {
        setSaveWarning(data.saveError);
      } else {
        setSaveWarning(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMessage);
      setSaveWarning(null);
    } finally {
      setIsLoading(false);
      setIsRequestInProgress(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementMessage.trim() || !currentTripId || !itinerary || isRefining) return;

    setIsRefining(true);
    setRefinementError(null);
    setError(null);

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: currentTripId,
          message: refinementMessage.trim(),
          currentItinerary: itinerary,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const errorMsg = data?.error || "Failed to refine itinerary.";
        
        // Check if it's an "AI didn't understand" error
        if (data?.unclearInput) {
          setRefinementError(`I didn't understand "${refinementMessage.trim()}". Could you please rephrase your request? For example: "Remove the museum from Day 2" or "The restaurant on Day 1 is closed, suggest an alternative".`);
        } else {
          setRefinementError(errorMsg);
        }
        return;
      }

      const data = (await response.json()) as { 
        itinerary?: ItineraryResponse;
        unclearInput?: boolean;
      };
      
      if (data.unclearInput) {
        setRefinementError(`I didn't understand "${refinementMessage.trim()}". Could you please rephrase your request? For example: "Remove the museum from Day 2" or "The restaurant on Day 1 is closed, suggest an alternative".`);
        return;
      }
      
      if (data.itinerary) {
        setItinerary(data.itinerary);
        setRefinementMessage("");
        setRefinementError(null);
      } else {
        setRefinementError("I couldn't process your request. Please try rephrasing it.");
      }
    } catch (err: unknown) {
      setRefinementError(err instanceof Error ? err.message : "Failed to refine itinerary. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const openGoogleMaps = (location: string, destination: string) => {
    const query = encodeURIComponent(`${location}, ${destination}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const inputBase =
    "w-full rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.08)] outline-none ring-1 ring-slate-200/70 transition focus:ring-2 focus:ring-slate-400/60";

  const travelStyleOptions: { value: TravelStyle; icon: React.ReactNode; label: string }[] = [
    { value: "Solo", icon: <User size={18} />, label: "Solo" },
    { value: "Couple", icon: <Users size={18} />, label: "Couple" },
    { value: "Family", icon: <Baby size={18} />, label: "Family" },
    { value: "Friends", icon: <UsersRound size={18} />, label: "Friends" },
  ];

  const paceOptions: { value: Pace; label: string; desc: string }[] = [
    { value: "Relaxed", label: "Relaxed", desc: "2 activities/day" },
    { value: "Balanced", label: "Balanced", desc: "3-4 activities/day" },
    { value: "Intense", label: "Intense", desc: "5+ activities/day" },
  ];

  const transportOptions: { value: Transport; icon: React.ReactNode; label: string }[] = [
    { value: "Walking", icon: <Footprints size={18} />, label: "Walking" },
    { value: "Public Transport", icon: <Bus size={18} />, label: "Public Transport" },
    { value: "Rental Car", icon: <Car size={18} />, label: "Rental Car" },
  ];

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

          {/* Step 2: Duration */}
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

          {/* Step 3: Interests */}
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

          {/* Step 4: Advanced Options */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4 overflow-hidden"
              >
                {/* Travel Style */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Travel Style
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {travelStyleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTravelStyle(option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          travelStyle === option.value
                            ? "border-slate-900 bg-slate-50 shadow-sm"
                            : "border-slate-200/70 bg-white hover:border-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            travelStyle === option.value
                              ? "text-slate-900"
                              : "text-slate-400"
                          )}
                        >
                          {option.icon}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            travelStyle === option.value
                              ? "text-slate-900"
                              : "text-slate-500"
                          )}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Pace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {paceOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPace(option.value)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          pace === option.value
                            ? "border-slate-900 bg-slate-50 shadow-sm"
                            : "border-slate-200/70 bg-white hover:border-slate-300"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium",
                            pace === option.value
                              ? "text-slate-900"
                              : "text-slate-500"
                          )}
                        >
                          {option.label}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Transport
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {transportOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTransport(option.value)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border p-3 transition-all",
                          transport === option.value
                            ? "border-slate-900 bg-slate-50 shadow-sm"
                            : "border-slate-200/70 bg-white hover:border-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            transport === option.value
                              ? "text-slate-900"
                              : "text-slate-400"
                          )}
                        >
                          {option.icon}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            transport === option.value
                              ? "text-slate-900"
                              : "text-slate-500"
                          )}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Dietary Restrictions (optional)
                  </label>
                  <div className="relative">
                    <UtensilsCrossed
                      size={18}
                      strokeWidth={1.5}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      placeholder="Vegan, Gluten-free, etc..."
                      className={cn(inputBase, "pl-11 text-base")}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
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
                    {isLoading ? "Generating your escape..." : currentTripId ? "Update Itinerary" : "Generate My Escape"}
                  </span>
                  <span className="absolute -inset-1 animate-pulse rounded-xl bg-gradient-to-r from-slate-400/40 via-slate-300/50 to-slate-400/40 blur-lg opacity-75" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error & Warning Messages */}
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

      {/* Itinerary Display */}
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
                          <div className="flex-1 space-y-2">
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
                            <button
                              onClick={() => openGoogleMaps(activity.location, destination)}
                              className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm"
                            >
                              <ExternalLink size={12} />
                              Verify on Google Maps
                            </button>
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

            {/* Refinement Chat Bar */}
            {currentTripId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky bottom-4 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-xl backdrop-blur-xl"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refinementMessage}
                    onChange={(e) => {
                      setRefinementMessage(e.target.value);
                      setRefinementError(null); // Clear error when typing
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRefine();
                      }
                    }}
                    placeholder="Refine your itinerary... (e.g., 'Remove the museum from Day 2' or 'The restaurant on Day 1 is closed, suggest an alternative')"
                    className="flex-1 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200/70 transition focus:ring-2 focus:ring-slate-400/60"
                    disabled={isRefining}
                  />
                  <Button
                    onClick={handleRefine}
                    disabled={!refinementMessage.trim() || isRefining}
                    className="rounded-xl bg-slate-900 px-4 text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </Button>
                </div>
                {refinementError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/80 px-3 py-2 text-xs text-amber-700"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">💡</span>
                      <p>{refinementError}</p>
                    </div>
                  </motion.div>
                )}
                {isRefining && !refinementError && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Refining your itinerary...
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
