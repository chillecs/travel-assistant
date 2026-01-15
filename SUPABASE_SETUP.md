# Supabase Configuration for Email Verification

## Important Settings

### 1. Disable Auto-Confirm (Optional - for stricter verification)

If you want accounts to be created ONLY after email verification (not before):

1. Go to Supabase Dashboard
2. Navigate to **Authentication → Settings**
3. Find **"Enable email confirmations"** - make sure it's **ENABLED**
4. Find **"Enable sign ups"** - make sure it's **ENABLED**
5. The default behavior is:
   - Account is created immediately when user signs up
   - But user CANNOT log in until email is verified
   - This is the standard and recommended flow

### 2. Configure Redirect URLs

1. Go to Supabase Dashboard
2. Navigate to **Authentication → URL Configuration**
3. Add these to **"Redirect URLs"**:
   - `http://localhost:3000/auth/confirm` (for development)
   - `https://yourdomain.com/auth/confirm` (for production)

### 3. Email Templates (Optional)

If you want to customize the email confirmation link format:

1. Go to **Authentication → Email Templates**
2. Edit the **"Confirm signup"** template
3. Make sure it uses `.ConfirmationURL` or includes:
   - `{{ .TokenHash }}`
   - `{{ .Type }}`
   - `{{ .RedirectTo }}`

## Current Behavior

**Default Supabase Flow:**
- ✅ User clicks "Sign Up" → Account created in `auth.users` (but unconfirmed)
- ✅ Email sent with verification link
- ✅ User clicks link → Email verified → Can now log in
- ❌ User tries to log in before verification → Blocked

**If you want to prevent account creation until verification:**
This requires a custom implementation where you:
1. Store signup data temporarily (not in auth.users)
2. Only create the account after email verification
3. This is more complex and not recommended for most use cases

## Recommendation

The current Supabase default is correct:
- Account exists but is **disabled** until verification
- User cannot log in until verified
- This prevents spam accounts and ensures valid emails
