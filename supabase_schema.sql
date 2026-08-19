-- ===================================================
-- TRAINING QUIZ SYSTEM - DATABASE SCHEMA (SUPABASE)
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users for Admin & Trainer)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'trainer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert profile" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- 2. QUESTION BANK CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by authenticated users" 
  ON public.categories FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Trainers and Admins can insert categories" 
  ON public.categories FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. QUESTION BANK & QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'true_false', 'multiple_answer', 'poll', 
    'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'
  )),
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
  media_url TEXT,
  explanation TEXT,
  points_type TEXT DEFAULT 'standard' CHECK (points_type IN ('no_point', 'standard', 'double_point', 'custom')),
  custom_points INT DEFAULT 100,
  time_limit INT DEFAULT 30, -- seconds
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  shuffle_answers BOOLEAN DEFAULT FALSE,
  is_bank_question BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to view questions" 
  ON public.questions FOR SELECT 
  USING (true);

CREATE POLICY "Trainers can manage own questions" 
  ON public.questions FOR ALL 
  TO authenticated 
  USING (auth.uid() = created_by);

-- 4. QUESTION OPTIONS / ANSWERS
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  option_image_url TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Options
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Options viewable by everyone in session or auth" 
  ON public.question_options FOR SELECT 
  USING (true);

CREATE POLICY "Trainers can manage options" 
  ON public.question_options FOR ALL 
  TO authenticated 
  USING (true);

-- 5. QUIZZES (Templates)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  passing_grade INT DEFAULT 70, -- percentage
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to view quizzes" 
  ON public.quizzes FOR SELECT 
  USING (true);

CREATE POLICY "Trainers can manage own quizzes" 
  ON public.quizzes FOR ALL 
  TO authenticated 
  USING (auth.uid() = created_by);

-- 6. QUIZ-QUESTION JUNCTION (Ordering in quiz)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE (quiz_id, question_id)
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to view quiz questions" 
  ON public.quiz_questions FOR SELECT 
  USING (true);

CREATE POLICY "Trainers can manage quiz questions" 
  ON public.quiz_questions FOR ALL 
  TO authenticated 
  USING (true);

-- 7. LIVE SESSIONS
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pin_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'paused', 'finished')),
  current_question_index INT DEFAULT 0,
  current_question_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- RLS for Live Sessions
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions viewable by anyone with PIN or URL" 
  ON public.live_sessions FOR SELECT 
  USING (true);

CREATE POLICY "Trainers can manage own live sessions" 
  ON public.live_sessions FOR ALL 
  TO authenticated 
  USING (auth.uid() = trainer_id);

-- 8. SESSION PARTICIPANTS (Anonymous / Temporary Session Users)
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  employee_id TEXT,
  department TEXT,
  total_score INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  total_response_time_ms BIGINT DEFAULT 0,
  is_online BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, nickname)
);

-- RLS for Session Participants
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants viewable by anyone in session" 
  ON public.session_participants FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can join session as participant" 
  ON public.session_participants FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Participants can update own score/status" 
  ON public.session_participants FOR UPDATE 
  USING (true);

-- 9. PARTICIPANT ANSWERS
CREATE TABLE IF NOT EXISTS public.participant_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.session_participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  text_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  score_earned INT DEFAULT 0,
  response_time_ms INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, participant_id, question_id)
);

-- RLS for Participant Answers
ALTER TABLE public.participant_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answers viewable by session participants and trainer" 
  ON public.participant_answers FOR SELECT 
  USING (true);

CREATE POLICY "Participants can insert own answers" 
  ON public.participant_answers FOR INSERT 
  WITH CHECK (true);

-- Enable Realtime for Live Sessions, Participants, Answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participant_answers;
