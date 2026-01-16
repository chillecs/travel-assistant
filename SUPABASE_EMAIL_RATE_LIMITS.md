# Supabase Email Rate Limits - Ghid Complet

## Da, poți atinge limita de rate pentru email-uri! 📧

Supabase are **limite stricte** pentru serviciul lor de email implicit (folosit pentru email confirmations, password resets, etc.).

## Limitele Supabase pentru Email

### Planuri Gratuite (Free Tier)
- **3 email-uri pe oră** per utilizator
- **4 email-uri pe zi** per utilizator
- **Total: ~100 email-uri pe zi** pentru întregul proiect

### Planuri Paid
- Limite mai mari, dar tot există
- Variază în funcție de plan

## Cum să verifici dacă ai atins limita

### 1. Verifică în Supabase Dashboard

1. Mergi în **Supabase Dashboard → Logs → API Logs**
2. Caută erori care conțin:
   - `rate limit`
   - `quota exceeded`
   - `too many requests`
   - `email rate limit`

### 2. Verifică în Vercel Logs

1. Mergi în **Vercel Dashboard → Deployments → Functions → Logs**
2. Caută erori legate de email sau Supabase

### 3. Testează manual

1. Încearcă să te înregistrezi cu un email nou
2. Dacă nu primești email, probabil ai atins limita
3. Așteaptă 1 oră și încearcă din nou

## Soluții

### Soluția 1: Configurează SMTP Custom (RECOMANDAT pentru producție)

Supabase permite configurarea unui provider SMTP custom (SendGrid, Mailgun, AWS SES, etc.) care are limite mult mai mari.

#### Pași:

1. **Alege un provider SMTP:**
   - **SendGrid** (gratuit până la 100 email-uri/zi)
   - **Mailgun** (gratuit până la 5,000 email-uri/lună)
   - **AWS SES** (foarte ieftin, $0.10 per 1,000 email-uri)
   - **Resend** (gratuit până la 3,000 email-uri/lună)

2. **Configurează în Supabase:**
   - Mergi în **Supabase Dashboard → Authentication → Settings → SMTP Settings**
   - Completează:
     - **SMTP Host** (ex: `smtp.sendgrid.net`)
     - **SMTP Port** (ex: `587` pentru TLS sau `465` pentru SSL)
     - **SMTP User** (username-ul tău de la provider)
     - **SMTP Password** (API key-ul tău)
     - **Sender Email** (email-ul de la care se trimit email-urile)
     - **Sender Name** (numele afișat, ex: "TravelAI")

3. **Testează:**
   - Încearcă să te înregistrezi cu un email nou
   - Verifică dacă primești email-ul

#### Exemple de configurare:

**SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [your-sendgrid-api-key]
Sender Email: noreply@yourdomain.com
```

**Mailgun:**
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [your-mailgun-username]
SMTP Password: [your-mailgun-password]
Sender Email: noreply@yourdomain.com
```

**Resend:**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [your-resend-api-key]
Sender Email: noreply@yourdomain.com
```

### Soluția 2: Așteaptă resetarea limitei

- Limitele se resetează **la fiecare oră** (pentru limita orară)
- Limitele se resetează **la fiecare zi** (pentru limita zilnică)
- Dacă ai atins limita, așteaptă 1 oră sau până a doua zi

### Soluția 3: Upgrade la plan paid

- Planurile paid au limite mai mari
- Verifică în **Supabase Dashboard → Settings → Billing**

### Soluția 4: Reduce numărul de email-uri trimise

- Evită să testezi înregistrări multiple cu același email
- Folosește email-uri diferite pentru testare
- Consideră dezactivarea email confirmations pentru development (NU pentru producție!)

## Verificare rapidă

### Testează dacă ai atins limita:

1. Mergi în **Supabase Dashboard → Authentication → Users**
2. Încearcă să te înregistrezi cu un email complet nou
3. Dacă nu primești email, verifică:
   - **Logs → API Logs** pentru erori
   - **Authentication → Settings → SMTP Settings** (dacă e configurat)

## Mesaje de eroare comune

Dacă vezi aceste mesaje, ai atins limita:

- `"Email rate limit exceeded"`
- `"Too many requests"`
- `"Quota exceeded"`
- `"Rate limit: Too many emails sent"`

## Recomandare pentru producție

**PENTRU PRODUCȚIE, CONFIGUREAZĂ SMTP CUSTOM!**

1. **SendGrid** - cel mai ușor de configurat, gratuit până la 100/zi
2. **Resend** - modern, gratuit până la 3,000/lună
3. **Mailgun** - robust, gratuit până la 5,000/lună

## Checklist

- [ ] Am verificat logs pentru erori de rate limit
- [ ] Am configurat SMTP custom (pentru producție)
- [ ] Am testat că email-urile se trimit cu noul SMTP
- [ ] Am verificat că sender email este valid
- [ ] Am testat signup cu un email nou

## Link-uri utile

- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid Free Tier](https://sendgrid.com/pricing/)
- [Resend Free Tier](https://resend.com/pricing)
- [Mailgun Free Tier](https://www.mailgun.com/pricing/)
