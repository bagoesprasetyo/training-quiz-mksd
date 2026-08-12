-- ============================================================
-- TRAINING QUIZ SYSTEM - COMPLETE FIX SCRIPT
-- Jalankan seluruh script ini di Supabase SQL Editor
-- https://supabase.com/dashboard/project/tvlbrqaknxgfgslqwaxy/sql
-- ============================================================

-- 1. KONFIRMASI SEMUA EMAIL YANG BELUM DIKONFIRMASI (trainer lama)
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmation_token = ''
WHERE email_confirmed_at IS NULL;

-- 2. BUAT FUNGSI UNTUK MEMBUAT TRAINER DENGAN EMAIL SUDAH DIKONFIRMASI
--    (Ini memungkinkan admin membuat akun trainer tanpa perlu konfirmasi email)
CREATE OR REPLACE FUNCTION public.create_trainer_confirmed(
  trainer_email   text,
  trainer_password text,
  trainer_name    text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
  result jsonb;
BEGIN
  -- Cek apakah email sudah ada di auth.users
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = lower(trainer_email) 
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    -- Update existing user: konfirmasi email dan update password
    UPDATE auth.users SET
      encrypted_password = crypt(trainer_password, gen_salt('bf')),
      email_confirmed_at = NOW(),
      confirmation_token = '',
      updated_at = NOW()
    WHERE id = existing_user_id;
    
    new_user_id := existing_user_id;
  ELSE
    -- Buat user baru di auth.users dengan email langsung dikonfirmasi
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      role,
      aud,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      lower(trainer_email),
      crypt(trainer_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('full_name', trainer_name, 'role', 'trainer'),
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '',
      ''
    );
  END IF;

  -- Simpan atau update profil di tabel profiles
  INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (
    new_user_id,
    lower(trainer_email),
    trainer_name,
    'trainer',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = lower(trainer_email),
    full_name = trainer_name,
    updated_at = NOW();

  result := jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', lower(trainer_email),
    'message', 'Trainer account created and email confirmed successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create trainer account'
  );
END;
$$;

-- Berikan akses ke anon dan authenticated roles untuk memanggil fungsi ini
GRANT EXECUTE ON FUNCTION public.create_trainer_confirmed TO anon, authenticated;

-- 3. PERBAIKI RLS TABEL PROFILES (izinkan anon membaca untuk login fallback)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert profile" ON public.profiles;
CREATE POLICY "Users can insert profile" 
ON public.profiles FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update profile" ON public.profiles;
CREATE POLICY "Users can update profile" 
ON public.profiles FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. PERBAIKI RLS TABEL QUIZ DAN QUESTIONS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on quizzes" ON public.quizzes;
CREATE POLICY "Allow all on quizzes" ON public.quizzes
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on questions" ON public.questions;
CREATE POLICY "Allow all on questions" ON public.questions
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on question_options" ON public.question_options;
CREATE POLICY "Allow all on question_options" ON public.question_options
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. HAPUS STRICT FOREIGN KEY CONSTRAINTS AGAR BEBAS MEMBUAT KUIS & SOAL
ALTER TABLE public.live_sessions DROP CONSTRAINT IF EXISTS live_sessions_trainer_id_fkey;
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_created_by_fkey;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_created_by_fkey;

-- 6. PERBAIKI RLS LIVE SESSIONS TABLE
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on live_sessions" ON public.live_sessions;
CREATE POLICY "Allow all on live_sessions" ON public.live_sessions
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. PERBAIKI RLS SESSION_PARTICIPANTS TABLE
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_participants') THEN
    ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all on session_participants" ON public.session_participants;
    EXECUTE 'CREATE POLICY "Allow all on session_participants" ON public.session_participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 8. VERIFIKASI - cek apakah ada user yang masih belum dikonfirmasi
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
