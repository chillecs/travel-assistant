# Vercel Deployment Setup

## Environment Variables

Add these to your Vercel project settings:

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add these variables:

### Required:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
OPENAI_API_KEY=your-openai-key
```

### Optional (for email redirects):
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```
(Actually, we now use `window.location.origin` automatically, so this isn't needed)

## Supabase Configuration for Production

### 1. Add Production Redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Add to **"Redirect URLs"**:
   - `https://yourdomain.vercel.app/auth/confirm`
   - `https://yourdomain.com/auth/confirm` (if you have a custom domain)

### 2. Set Site URL

1. Go to **Authentication → URL Configuration**
2. Set **"Site URL"** to your production domain:
   - `https://yourdomain.vercel.app`
   - Or your custom domain: `https://yourdomain.com`

### 3. Email Settings

1. Go to **Authentication → Settings**
2. Make sure **"Enable email confirmations"** is ON
3. For production, consider configuring **SMTP** (Supabase's default has rate limits)

## Why Emails Don't Work on Vercel

If emails aren't being sent on Vercel but work locally:

1. **Check Site URL in Supabase** - Must match your Vercel domain
2. **Check Redirect URLs** - Must include your Vercel domain
3. **Check SMTP** - Supabase's default email service might have issues
4. **Check Spam Folder** - Production emails might go to spam
5. **Check Vercel Logs** - Look for any errors during signup

## Testing

1. Deploy to Vercel
2. Try signing up on the production site
3. Check Supabase Dashboard → Authentication → Users
4. Check if user was created
5. Check email inbox (and spam folder)
