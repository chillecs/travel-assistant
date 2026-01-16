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

  console.log("Email confirmation attempt:", {
    hasTokenHash: !!token_hash,
    hasToken: !!token,
    type,
    url: request.url,
  });

  // Supabase can send links in different formats:
  // 1. With token_hash and type (newer format)
  // 2. With token and type (older format)
  // 3. Supabase might verify on their end first, then redirect here

  // Try to verify OTP if we have the necessary parameters
  if (type && (token_hash || token)) {
    try {
      // Use token_hash if available, otherwise use token
      const verificationData: {
        type: EmailOtpType;
        token_hash?: string;
        token?: string;
      } = { type };

      if (token_hash) {
        verificationData.token_hash = token_hash;
      } else if (token) {
        verificationData.token = token;
      }

      const { data, error } = await supabase.auth.verifyOtp(verificationData);

      if (error) {
        console.error("OTP verification error:", error);
        // Check if it's a common error
        if (error.message?.includes("expired") || error.message?.includes("invalid")) {
          redirect(`/auth/error?error=${encodeURIComponent("This verification link has expired or is invalid. Please request a new confirmation email from the login page.")}`);
        }
        redirect(`/auth/error?error=${encodeURIComponent(error.message || "Verification failed")}`);
      }

      // Successfully verified - check if user is confirmed
      if (data?.user?.email_confirmed_at) {
        console.log("Email verified successfully");
        redirect(next);
      } else {
        // Wait a moment for Supabase to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          redirect(next);
        } else {
          redirect(`/auth/error?error=${encodeURIComponent("Email verification completed, but confirmation status is pending. Please try logging in.")}`);
        }
      }
    } catch (err) {
      console.error("Unexpected error during verification:", err);
      redirect(`/auth/error?error=${encodeURIComponent("An unexpected error occurred during verification. Please try again.")}`);
    }
  }

  // If no token parameters, Supabase might have already verified on their end
  // Check if user is authenticated and email is confirmed
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting user:", userError);
  }

  if (user && user.email_confirmed_at) {
    // User is verified - redirect to home
    console.log("User already verified");
    redirect(next);
  }

  if (user && !user.email_confirmed_at) {
    // User exists but email not confirmed yet
    // This might be a timing issue - wait a moment and check again
    console.log("User exists but not confirmed, waiting...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { data: { user: retryUser } } = await supabase.auth.getUser();
    if (retryUser?.email_confirmed_at) {
      console.log("User confirmed after retry");
      redirect(next);
    } else {
      // Still not confirmed - redirect to error page
      redirect(`/auth/error?error=${encodeURIComponent("Email not yet confirmed. Please check your email and click the confirmation link, or request a new one from the login page.")}`);
    }
  }

  // If we get here, verification didn't work
  // This could happen if:
  // 1. Link is expired
  // 2. Link was already used
  // 3. There's a configuration issue
  // 4. Missing required parameters
  console.error("Email confirmation failed - no valid parameters or user:", { 
    hasTokenHash: !!token_hash,
    hasToken: !!token,
    hasType: !!type,
    userExists: !!user,
    emailConfirmed: user?.email_confirmed_at,
    url: request.url 
  });
  
  redirect(`/auth/error?error=${encodeURIComponent("Email verification failed. The link may be invalid, expired, or already used. Please request a new confirmation email from the login page.")}`);
}
