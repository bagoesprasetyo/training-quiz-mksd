import { supabase } from './supabase';
import type { LiveSession, SessionParticipant } from '../types';

export const liveSessionService = {
  // Generate random 6-digit PIN code
  generatePinCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async createSession(quizId: string): Promise<LiveSession> {
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
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*, quiz:quizzes(*)')
      .eq('id', sessionId)
      .single();

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
    this.getParticipants(sessionId).then(onParticipantChange);

    const channel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch updated participant list
          this.getParticipants(sessionId).then(onParticipantChange);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Realtime subscription for live session status (start, pause, next question, finish)
  subscribeToSessionState(
    sessionId: string,
    onStateChange: (session: LiveSession) => void
  ) {
    const channel = supabase
      .channel(`session_state:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          this.getSessionById(sessionId).then(onStateChange);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
