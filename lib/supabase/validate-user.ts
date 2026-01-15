import { createClient } from "@/lib/supabase/server";

/**
 * Validates that a user still exists in the database.
 * If the user is deleted, this will return null and the session should be invalidated.
 */
export async function validateUserExists(userId: string) {
  try {
    const supabase = await createClient();
    
    // Check if user exists in auth.users by trying to get their profile
    // If the user is deleted, this will fail
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    // If profile doesn't exist and there's an error, check the error type
    if (error) {
      // PGRST116 = no rows returned (user doesn't exist)
      if (error.code === "PGRST116") {
        return false;
      }
      // Schema cache errors - table might not be ready yet, but user might exist
      // In this case, we'll assume user exists to avoid false positives
      if (error.message?.includes("schema cache") || 
          error.message?.includes("Could not find the table")) {
        console.warn("Schema cache issue - assuming user exists");
        return true; // Assume user exists to avoid signing out valid users
      }
      // Other errors - assume user doesn't exist
      return false;
    }

    // If we got a profile, user exists
    return !!profile;
  } catch (error: any) {
    // Schema cache errors - assume user exists
    if (error?.message?.includes("schema cache") || 
        error?.message?.includes("Could not find the table")) {
      console.warn("Schema cache issue during validation - assuming user exists");
      return true;
    }
    console.error("Error validating user:", error);
    return false;
  }
}

/**
 * Gets user and validates they still exist.
 * Returns null if user doesn't exist or is deleted.
 */
export async function getValidatedUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Validate user still exists
    const exists = await validateUserExists(user.id);
    if (!exists) {
      // User was deleted - sign them out
      await supabase.auth.signOut();
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting validated user:", error);
    return null;
  }
}
