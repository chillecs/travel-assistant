import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token"); // Some Supabase versions use 'token'
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Supabase email links might redirect here without token_hash if already verified
  // Check if user is already authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is already authenticated, just redirect (email was already confirmed)
  if (user) {
    redirect(next);
  }

  // If we have token_hash or token, verify it
  const authToken = token_hash || token;
  if (authToken && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: authToken,
      });

      if (error) {
        console.error("OTP verification error:", error);
        redirect(`/auth/error?error=${encodeURIComponent(error.message || "Verification failed")}`);
      }

      // Success - redirect user to specified redirect URL or root of app
      redirect(next);
    } catch (err) {
      console.error("Unexpected error during verification:", err);
      redirect(`/auth/error?error=${encodeURIComponent("An unexpected error occurred")}`);
    }
  }

  // If no token but user might be verified via Supabase's redirect, check again
  // Sometimes Supabase verifies on their end and redirects here
  const { data: { user: verifiedUser } } = await supabase.auth.getUser();
  if (verifiedUser) {
    redirect(next);
  }

  // No token and user not verified - show error
  console.error("Missing parameters:", { 
    token_hash: !!token_hash, 
    token: !!token, 
    type,
    url: request.url 
  });
  redirect(`/auth/error?error=${encodeURIComponent("No token hash or type. Please check your email link.")}`);
}
