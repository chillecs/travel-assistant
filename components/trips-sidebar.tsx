"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Menu, X, MapPin, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Trip = {
  id: string;
  title: string;
  destination: string;
  duration: number;
  created_at: string;
};

type TripsSidebarProps = {
  currentTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onNewTrip: () => void;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger?: number; // Add refresh trigger
};

export function TripsSidebar({
  currentTripId,
  onSelectTrip,
  onNewTrip,
  isOpen,
  onToggle,
  refreshTrigger,
}: TripsSidebarProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        // Auto-open on desktop
      }
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    loadTrips();
  }, [refreshTrigger]);

  const loadTrips = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("itineraries")
        .select("id, title, destination, duration, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tripId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this trip?")) return;

    setIsDeleting(tripId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("itineraries")
        .delete()
        .eq("id", tripId);

      if (error) throw error;
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
      if (currentTripId === tripId) {
        onNewTrip();
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Failed to delete trip. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm shadow-lg lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isDesktop ? 0 : (isOpen ? 0 : -320)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl",
          "flex flex-col border-r border-slate-200/70",
          "lg:relative lg:z-auto lg:shadow-none"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200/70 px-4">
          <h2 className="text-lg font-semibold">My Trips</h2>
          <button
            onClick={onToggle}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={onNewTrip}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:from-slate-800 hover:to-slate-600"
          >
            <Plus size={18} />
            New Trip
          </button>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <MapPin size={32} className="mx-auto mb-3 opacity-50" />
              <p>No trips yet</p>
              <p className="mt-1 text-xs">Create your first trip!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((trip) => (
                <motion.div
                  key={trip.id}
                  onClick={() => onSelectTrip(trip.id)}
                  className={cn(
                    "group relative w-full cursor-pointer rounded-xl border p-4 text-left transition-all",
                    currentTripId === trip.id
                      ? "border-slate-900 bg-slate-50 shadow-sm"
                      : "border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-sm"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-medium text-slate-900">
                        {trip.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {trip.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {trip.duration} days
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(trip.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(trip.id, e);
                      }}
                      disabled={isDeleting === trip.id}
                      className="opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                      aria-label="Delete trip"
                    >
                      <Trash2
                        size={16}
                        className="text-rose-500 hover:text-rose-600"
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
