# Redirect URLs pentru Supabase

## Lista completă de Redirect URLs

Adaugă **toate** aceste URLs în **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

### Pentru Development (Localhost)

```
http://localhost:3000/auth/confirm
http://localhost:3000/auth/update-password
```

### Pentru Production (Vercel)

Înlocuiește `your-app.vercel.app` cu domeniul tău Vercel real:

```
https://your-app.vercel.app/auth/confirm
https://your-app.vercel.app/auth/update-password
```

### Pentru Custom Domain (dacă ai)

Înlocuiește `yourdomain.com` cu domeniul tău custom:

```
https://yourdomain.com/auth/confirm
https://yourdomain.com/auth/update-password
```

## Unde se folosesc

### `/auth/confirm`
- **Sign Up**: Când utilizatorul se înregistrează, primește email cu link de confirmare
- **Resend Confirmation**: Când utilizatorul cere să primească din nou email-ul de confirmare
- **Folosit în**: `components/sign-up-form.tsx`, `components/login-form.tsx`

### `/auth/update-password`
- **Forgot Password**: Când utilizatorul cere resetarea parolei
- **Folosit în**: `components/forgot-password-form.tsx`

## Cum să adaugi în Supabase

1. Mergi în **Supabase Dashboard**
2. Click pe **Authentication** (în sidebar)
3. Click pe **URL Configuration**
4. În secțiunea **"Redirect URLs"**, adaugă fiecare URL pe o linie nouă
5. Click pe **Save**

## Site URL (Important!)

De asemenea, setează **"Site URL"** în aceeași secțiune:

- **Development**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app` (sau domeniul tău custom)

## Checklist

- [ ] Am adăugat `http://localhost:3000/auth/confirm`
- [ ] Am adăugat `http://localhost:3000/auth/update-password`
- [ ] Am adăugat `https://your-app.vercel.app/auth/confirm`
- [ ] Am adăugat `https://your-app.vercel.app/auth/update-password`
- [ ] (Opțional) Am adăugat URLs pentru custom domain
- [ ] Am setat **Site URL** corect (development sau production)
- [ ] Am salvat modificările

## Exemplu complet (copiază și înlocuiește)

```
http://localhost:3000/auth/confirm
http://localhost:3000/auth/update-password
https://your-app.vercel.app/auth/confirm
https://your-app.vercel.app/auth/update-password
```

**IMPORTANT**: Înlocuiește `your-app.vercel.app` cu domeniul tău real de pe Vercel!
