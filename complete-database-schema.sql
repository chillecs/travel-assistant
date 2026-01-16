-- ============================================
-- COMPLETE DATABASE SCHEMA FOR TRAVEL AI
-- ============================================
-- Rulează acest script complet în Supabase Dashboard → SQL Editor
-- Acest script creează toate tabelele, policies-urile și trigger-urile necesare

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Tabel pentru stocarea username-urilor utilizatorilor

-- Creează tabelul profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activează Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Șterge policies-urile vechi dacă există (pentru a evita conflictele)
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

-- Policy: Utilizatorii pot citi propriul profil
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Utilizatorii pot insera propriul profil
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Utilizatorii pot actualiza propriul profil
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Utilizatorii pot șterge propriul profil
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Index pentru căutări rapide după username
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- ============================================
-- 2. ITINERARIES TABLE
-- ============================================
-- Tabel pentru stocarea itinerariilor generate de AI

-- Creează tabelul itineraries
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  travel_style TEXT CHECK (travel_style IN ('Solo', 'Couple', 'Family', 'Friends')),
  pace TEXT CHECK (pace IN ('Relaxed', 'Balanced', 'Intense')),
  transport TEXT CHECK (transport IN ('Walking', 'Public Transport', 'Rental Car')),
  dietary_restrictions TEXT,
  interests TEXT,
  itinerary_data JSONB NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activează Row Level Security
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Șterge policies-urile vechi dacă există (pentru a evita conflictele)
DROP POLICY IF EXISTS "Users can insert their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can read their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON itineraries;

-- Policy: Utilizatorii pot insera propriile itinerarii
CREATE POLICY "Users can insert their own itineraries"
  ON itineraries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Utilizatorii pot citi propriile itinerarii
CREATE POLICY "Users can read their own itineraries"
  ON itineraries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Utilizatorii pot actualiza propriile itinerarii
CREATE POLICY "Users can update their own itineraries"
  ON itineraries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Utilizatorii pot șterge propriile itinerarii
CREATE POLICY "Users can delete their own itineraries"
  ON itineraries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index-uri pentru performanță
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON itineraries(created_at DESC);

-- ============================================
-- 3. TRIGGER PENTRU AUTO-CREARE PROFILES
-- ============================================
-- Creează automat un profil când se creează un utilizator nou

-- Șterge funcția veche dacă există
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Creează funcția pentru auto-creare profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING; -- Evită erori dacă profilul există deja
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Șterge trigger-ul vechi dacă există
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Creează trigger-ul care se declanșează la crearea unui utilizator nou
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. FUNCȚIE PENTRU AUTO-UPDATE updated_at
-- ============================================
-- Actualizează automat câmpul updated_at când se modifică un rând

-- Funcție pentru actualizare automată updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pentru profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pentru itineraries
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICARE
-- ============================================
-- Rulează aceste query-uri pentru a verifica că totul este configurat corect

-- Verifică dacă tabelele există
SELECT 
  table_name,
  CASE WHEN table_name IN ('profiles', 'itineraries') THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'itineraries');

-- Verifică dacă RLS este activat
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'itineraries');

-- Verifică policies-urile
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'itineraries')
ORDER BY tablename, policyname;

-- Verifică dacă trigger-ul există
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  CASE WHEN tgenabled = 'O' THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- FINAL
-- ============================================
-- Dacă toate verificările arată ✅, schema este configurată corect!
