# Supabase Email Configuration Guide

## Why Emails Aren't Being Sent

If you're not receiving confirmation emails, check these settings:

### 1. Enable Email Confirmations

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Settings**
3. Find **"Enable email confirmations"**
4. Make sure it's **ENABLED** ✅

### 2. Configure SMTP (Required for Production)

By default, Supabase uses their own email service, but it has limits.

**For Development:**
- Supabase's default email service should work
- Check your spam/junk folder
- Emails might be delayed

**For Production:**
1. Go to **Authentication → Settings → SMTP Settings**
2. Configure your own SMTP provider (SendGrid, Mailgun, AWS SES, etc.)
3. Or use Supabase's built-in service (has rate limits)

### 3. Check Email Templates

1. Go to **Authentication → Email Templates**
2. Make sure **"Confirm signup"** template exists
3. Template should include: `{{ .ConfirmationURL }}`

### 4. Check Site URL

1. Go to **Authentication → URL Configuration**
2. Set **"Site URL"** to your domain:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### 5. Check Redirect URLs

Make sure these are in **"Redirect URLs"**:
- `http://localhost:3000/auth/confirm`
- `https://yourdomain.com/auth/confirm`

## Testing Email Sending

1. Try signing up with a real email address
2. Check spam/junk folder
3. Check Supabase Dashboard → Authentication → Users → Check if user was created
4. If user exists but no email, check Supabase logs

## Common Issues

- **No email received**: Check spam, verify SMTP is configured
- **Email goes to spam**: Configure SPF/DKIM records for your domain
- **"Email rate limit exceeded"**: Configure custom SMTP
- **Emails not sending**: Check Supabase status page for service issues
