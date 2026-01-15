"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  username?: string | null;
  email: string;
};

const getInitials = (value: string) => {
  if (!value) return "TA";
  // For username, take first 2 characters
  if (value.length <= 2) return value.toUpperCase();
  return value.substring(0, 2).toUpperCase();
};

export function UserMenu({ username, email }: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const displayUsername = username?.trim() || email.split("@")[0] || "Traveler";
  const initials = getInitials(displayUsername);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Use full page reload to ensure server components refresh
    window.location.href = "/auth/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-xs font-semibold text-white shadow-sm ring-1 ring-slate-900/10 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="User menu"
        >
          {initials || "TA"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border border-slate-200/70 bg-white p-2 shadow-xl backdrop-blur-xl"
        style={{ backgroundColor: 'white' }}
      >
        <div className="px-2 py-2">
          <p className="text-sm font-semibold text-slate-900">
            {displayUsername}
          </p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
        <DropdownMenuSeparator className="bg-slate-200/60" />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link href="/settings" className="flex items-center gap-2">
            <Settings size={14} strokeWidth={1.4} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void handleLogout()}
          className="cursor-pointer rounded-lg text-rose-600 focus:text-rose-600"
        >
          <LogOut size={14} strokeWidth={1.4} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
