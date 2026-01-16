# Ghid Complet de Deployment pe Vercel + Supabase

## Pasul 1: Pregătirea Codului ✅

Codul este deja pregătit pentru producție! Folosește `window.location.origin` care funcționează automat atât pe localhost cât și pe Vercel.

## Pasul 2: Configurare Vercel

### 2.1. Push pe GitHub

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2.2. Conectează la Vercel

1. Mergi pe [vercel.com](https://vercel.com) și loghează-te
2. Click pe **"Add New Project"**
3. Importă repository-ul tău de pe GitHub
4. Vercel va detecta automat că e un proiect Next.js

### 2.3. Adaugă Environment Variables în Vercel

În Vercel Dashboard → Project Settings → Environment Variables, adaugă:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
OPENAI_API_KEY=your-openai-api-key
```

**IMPORTANT:** După ce adaugi variabilele, trebuie să redeploy-ezi aplicația!

## Pasul 3: Configurare Supabase pentru Producție

### 3.1. Site URL

1. Mergi în **Supabase Dashboard → Authentication → URL Configuration**
2. Setează **"Site URL"** la domeniul tău Vercel:
   - `https://your-app.vercel.app`
   - SAU dacă ai domeniu custom: `https://yourdomain.com`

### 3.2. Redirect URLs

În aceeași secțiune, adaugă în **"Redirect URLs"**:

```
https://your-app.vercel.app/auth/confirm
https://your-app.vercel.app/auth/update-password
```

Dacă ai domeniu custom, adaugă și:
```
https://yourdomain.com/auth/confirm
https://yourdomain.com/auth/update-password
```

### 3.3. Verifică Email Settings

1. **Authentication → Settings**
2. Asigură-te că **"Enable email confirmations"** este **ON** ✅
3. Pentru producție, recomand să configurezi **SMTP** (Supabase default are limite)

### 3.4. Verifică Database Tables

Asigură-te că ai rulat SQL-urile:
- `supabase-schema.sql` (pentru tabelul `itineraries`)
- `supabase-profiles-schema.sql` (pentru tabelul `profiles`)

## Pasul 4: Deploy pe Vercel

1. După ce ai adăugat environment variables, Vercel va face deploy automat
2. Așteaptă să se termine build-ul
3. Click pe link-ul de deployment pentru a testa

## Pasul 5: Testare

1. **Testează Sign Up:**
   - Mergi pe site-ul tău Vercel
   - Încearcă să te înregistrezi
   - Verifică dacă primești email de confirmare

2. **Testează Login:**
   - Încearcă să te loghezi cu un cont neconfirmat → ar trebui să fie blocat
   - Confirmă email-ul și încearcă din nou → ar trebui să funcționeze

3. **Testează Generarea Itinerariului:**
   - Loghează-te
   - Generează un itinerariu
   - Verifică dacă se salvează în database

## Pasul 6: Domain Custom (Opțional)

Dacă vrei domeniu custom:

1. În Vercel Dashboard → Project → Settings → Domains
2. Adaugă domeniul tău
3. Configurează DNS-ul conform instrucțiunilor Vercel
4. Actualizează **Site URL** în Supabase la noul domeniu

## Troubleshooting

### Emails nu se trimit pe Vercel:
- Verifică **Site URL** în Supabase (trebuie să fie domeniul Vercel)
- Verifică **Redirect URLs** (trebuie să includă domeniul Vercel)
- Verifică spam folder
- Consideră configurarea SMTP custom

### Link-uri de email merg la localhost:
- Verifică că ai setat corect **Site URL** în Supabase
- Verifică că template-ul de email folosește `{{ .ConfirmationURL }}`

### Database errors:
- Asigură-te că ai rulat toate SQL-urile în Supabase
- Verifică că RLS policies sunt active
- Verifică că environment variables sunt setate corect în Vercel

## Checklist Final

- [ ] Cod pushed pe GitHub
- [ ] Proiect conectat la Vercel
- [ ] Environment variables adăugate în Vercel
- [ ] Site URL setat în Supabase (domeniul Vercel)
- [ ] Redirect URLs adăugate în Supabase
- [ ] Email confirmations enabled în Supabase
- [ ] Database tables create (itineraries + profiles)
- [ ] Deploy făcut pe Vercel
- [ ] Testat sign up + email confirmation
- [ ] Testat login cu cont neconfirmat (ar trebui blocat)
- [ ] Testat generarea itinerariului

## Succes! 🎉

După ce completezi toți pașii, aplicația ta va fi live și accesibilă pentru prietenii tăi!
