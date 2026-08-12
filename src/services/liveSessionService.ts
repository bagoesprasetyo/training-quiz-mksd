import { supabase } from './supabase';
import { quizService } from './quizService';
import type { LiveSession, SessionParticipant } from '../types';

export const liveSessionService = {
  // Generate random 6-digit PIN code
  generatePinCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async createSession(quizId: string): Promise<LiveSession> {
    // Ensure draft questions from trainer's device are fully synced to Supabase before creating live session
    try {
      const draftStr = localStorage.getItem(`draft_quiz_${quizId}`);
      if (draftStr) {
        const parsed = JSON.parse(draftStr);
        if (parsed.questions && parsed.questions.length > 0) {
          await quizService.syncDraftQuestionsToSupabase(quizId, parsed.questions);
        }
      }
    } catch (err) {
      console.warn('Draft question sync before session creation warning:', err);
    }

    // Get trainer ID: first try Supabase Auth session, then fall back to stored profile
    let trainerId: string | null = null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      trainerId = session?.user?.id || null;
    } catch {
      // ignore
    }

    // Fallback: get trainer ID from locally stored profile (profile-based auth)
    if (!trainerId) {
      try {
        const stored = localStorage.getItem('mks_active_user');
        if (stored) {
          const profile = JSON.parse(stored);
          trainerId = profile?.id || null;
        }
      } catch {
        // ignore
      }
    }

    if (!trainerId) throw new Error('Trainer must be logged in to start a session');

    // Ensure trainerId is a valid UUID format for PostgreSQL UUID column
    const isTrainerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trainerId);
    if (!isTrainerUuid) {
      trainerId = '00000000-0000-0000-0000-000000000000';
    }

    // Ensure unique PIN
    let pinCode = this.generatePinCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const { data: existing } = await supabase
        .from('live_sessions')
        .select('id')
        .eq('pin_code', pinCode)
        .single();
      
      if (!existing) {
        isUnique = true;
      } else {
        pinCode = this.generatePinCode();
        attempts++;
      }
    }

    const { data, error } = await supabase
      .from('live_sessions')
      .insert({
        quiz_id: quizId,
        trainer_id: trainerId,
        pin_code: pinCode,
        status: 'waiting',
        current_question_index: 0,
      })
      .select('*, quiz:quizzes(*)')
      .single();

    if (error) throw error;
    return data;
  },


  async getSessionById(sessionId: string): Promise<LiveSession> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    
    let query = supabase.from('live_sessions').select('*, quiz:quizzes(*)');
    if (isUuid) {
      query = query.eq('id', sessionId);
    } else {
      query = query.eq('pin_code', sessionId);
    }

    const { data, error } = await query.single();

    if (error && isUuid) {
      const { data: pinData, error: pinErr } = await supabase
        .from('live_sessions')
        .select('*, quiz:quizzes(*)')
        .eq('pin_code', sessionId)
        .single();
      if (!pinErr && pinData) return pinData;
      throw error;
    }

    if (error) throw error;
    return data;
  },

  async getSessionByPin(pinCode: string): Promise<LiveSession> {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*, quiz:quizzes(*)')
      .eq('pin_code', pinCode)
      .single();

    if (error) throw error;
    return data;
  },

  async getParticipants(sessionId: string): Promise<SessionParticipant[]> {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async startQuizSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('live_sessions')
      .update({
        status: 'in_progress',
        current_question_index: 0,
        current_question_start_time: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async endLiveSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('live_sessions')
      .update({
        status: 'finished',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Realtime subscription for participants joining/leaving
  subscribeToParticipants(
    sessionId: string,
    onParticipantChange: (participants: SessionParticipant[]) => void
  ) {
    // Initial fetch
    this.getParticipants(sessionId).then(onParticipantChange).catch(() => {});

    const channel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
        },
        () => {
          this.getParticipants(sessionId).then(onParticipantChange).catch(() => {});
        }
      )
      .subscribe();

    // 1.2-second Polling fallback for 100% sync
    const pollInterval = setInterval(() => {
      this.getParticipants(sessionId).then(onParticipantChange).catch(() => {});
    }, 1200);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  },

  // Realtime subscription for live session status (start, pause, next question, finish)
  subscribeToSessionState(
    sessionId: string,
    onStateChange: (session: LiveSession) => void
  ) {
    // Initial fetch
    this.getSessionById(sessionId).then(onStateChange).catch(() => {});

    const channel = supabase
      .channel(`session_state:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
        },
        () => {
          this.getSessionById(sessionId).then(onStateChange).catch(() => {});
        }
      )
      .subscribe();

    // 1.2-second Polling fallback for guaranteed state sync
    const pollInterval = setInterval(() => {
      this.getSessionById(sessionId).then(onStateChange).catch(() => {});
    }, 1200);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  },
};
