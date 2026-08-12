export type UserRole = 'administrator' | 'trainer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type QuestionType = 
  | 'multiple_choice'
  | 'true_false'
  | 'multiple_answer'
  | 'poll'
  | 'short_answer'
  | 'essay'
  | 'fill_blank'
  | 'matching'
  | 'ordering';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type PointsType = 'no_point' | 'standard' | 'double_point' | 'custom';
export type MediaType = 'image' | 'video' | 'audio';

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_image_url?: string;
  matching_pair?: string;
  is_correct: boolean;
  sort_order: number;
}

export interface Question {
  id: string;
  category_id?: string;
  question_text: string;
  question_type: QuestionType;
  media_type?: MediaType;
  media_url?: string;
  explanation?: string;
  points_type: PointsType;
  custom_points: number;
  time_limit: number; // in seconds
  difficulty: QuestionDifficulty;
  shuffle_answers: boolean;
  is_bank_question: boolean;
  created_by: string;
  options?: QuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}

export type QuizStatus = 'draft' | 'published' | 'archived';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  thumbnail_url?: string;
  passing_grade: number;
  status: QuizStatus;
  created_by: string;
  questions_count?: number;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = 'waiting' | 'in_progress' | 'paused' | 'finished';

export interface LiveSession {
  id: string;
  quiz_id: string;
  trainer_id: string;
  pin_code: string;
  status: SessionStatus;
  current_question_index: number;
  current_question_start_time?: string;
  quiz?: Quiz;
  created_at: string;
  ended_at?: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  nickname: string;
  employee_id?: string;
  department?: string;
  total_score: number;
  correct_count: number;
  wrong_count: number;
  total_response_time_ms: number;
  is_online: boolean;
  joined_at: string;
}

export interface ParticipantAnswer {
  id: string;
  session_id: string;
  participant_id: string;
  question_id: string;
  selected_option_id?: string;
  text_answer?: string;
  is_correct: boolean;
  score_earned: number;
  response_time_ms: number;
  submitted_at: string;
}
