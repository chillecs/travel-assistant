import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // When Supabase's .ConfirmationURL is used, Supabase verifies on their end first
  // Then redirects here. By the time we get here, the user might already be verified.
  // So we check authentication status first.

  // First, check if we have token parameters to verify ourselves
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

      // Successfully verified - redirect to home
      redirect(next);
    } catch (err) {
      console.error("Unexpected error during verification:", err);
      redirect(`/auth/error?error=${encodeURIComponent("An unexpected error occurred")}`);
    }
  }

  // If no token parameters, Supabase likely already verified on their end
  // Check if user is authenticated and email is confirmed
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (user && user.email_confirmed_at) {
    // User is verified - redirect to home
    redirect(next);
  }

  if (user && !user.email_confirmed_at) {
    // User exists but email not confirmed yet
    // This might be a timing issue - wait a moment and check again
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: { user: retryUser } } = await supabase.auth.getUser();
    if (retryUser?.email_confirmed_at) {
      redirect(next);
    } else {
      // Still not confirmed - redirect to error page
      redirect(`/auth/error?error=${encodeURIComponent("Email not yet confirmed. Please check your email and click the confirmation link.")}`);
    }
  }

  // If we get here, verification didn't work
  // This could happen if:
  // 1. Link is expired
  // 2. Link was already used
  // 3. There's a configuration issue
  console.error("Email confirmation failed:", { 
    hasToken: !!authToken,
    hasType: !!type,
    userExists: !!user,
    emailConfirmed: user?.email_confirmed_at,
    url: request.url 
  });
  
  redirect(`/auth/error?error=${encodeURIComponent("Email verification failed. The link may be invalid, expired, or already used. Please request a new confirmation email from the login page.")}`);
}
