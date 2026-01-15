import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <UserMenu
      name={
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.user_metadata?.username
      }
      email={user.email ?? "Traveler"}
    />
  ) : (
    <div className="flex gap-2">
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="text-slate-600 transition"
      >
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="rounded-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 text-white shadow-md shadow-slate-900/20 transition hover:from-slate-800 hover:via-slate-700 hover:to-slate-400"
      >
        <Link href="/auth/sign-up">Get started</Link>
      </Button>
    </div>
  );
}
