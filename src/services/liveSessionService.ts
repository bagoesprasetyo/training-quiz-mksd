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
    console.log({
      event: 'START_QUIZ',
      sessionId,
      status: 'in_progress',
      currentQuestionIndex: 0,
    });

    const { data: updatedSession, error } = await supabase
      .from('live_sessions')
      .update({
        status: 'in_progress',
        current_question_index: 0,
        current_question_start_time: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select('*, quiz:quizzes(*)')
      .single();

    if (error) {
      console.error('Error in startQuizSession:', error);
      throw error;
    }

    console.log({
      event: 'SESSION_UPDATED',
      session: updatedSession,
    });
  },

  async endLiveSession(sessionId: string): Promise<void> {
    console.log({
      event: 'FINALIZE_SESSION',
      sessionId,
    });

    // 1. Fetch all participant answers recorded for this session from Supabase
    try {
      const { data: answers } = await supabase
        .from('participant_answers')
        .select('*')
        .eq('session_id', sessionId);

      const { data: participants } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (participants && participants.length > 0) {
        for (const p of participants) {
          const pAnswers = (answers || []).filter((a) => a.participant_id === p.id);
          const totalScore = pAnswers.reduce((sum, a) => sum + (a.score_earned || 0), 0);
          const correctCount = pAnswers.filter((a) => a.is_correct).length;
          const wrongCount = pAnswers.filter((a) => !a.is_correct).length;
          const totalResponseTimeMs = pAnswers.reduce((sum, a) => sum + (a.response_time_ms || 0), 0);
          const avgResponseTime = pAnswers.length > 0 ? (totalResponseTimeMs / pAnswers.length / 1000).toFixed(1) : '0';
          const accuracy = pAnswers.length > 0 ? Math.round((correctCount / pAnswers.length) * 100) : 0;

          console.log({
            event: 'AGGREGATED_PARTICIPANT_RESULT',
            participantId: p.id,
            nickname: p.nickname,
            totalScore: Math.max(totalScore, p.total_score || 0),
            correctCount: Math.max(correctCount, p.correct_count || 0),
            wrongCount,
            accuracy,
            avgResponseTime,
          });

          // Sync aggregated values into session_participants
          await supabase
            .from('session_participants')
            .update({
              total_score: Math.max(totalScore, p.total_score || 0),
              correct_count: Math.max(correctCount, p.correct_count || 0),
              wrong_count: wrongCount,
              total_response_time_ms: Math.max(totalResponseTimeMs, p.total_response_time_ms || 0),
            })
            .eq('id', p.id);
        }
      }
    } catch (aggErr) {
      console.warn('Error during session finalization aggregation:', aggErr);
    }

    // 2. Mark session as finished in database
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

    const channelId = `participants:${sessionId}:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelId)
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
      );

    channel.subscribe();

    // 1-second Polling fallback for 100% sync
    const pollInterval = setInterval(() => {
      this.getParticipants(sessionId).then(onParticipantChange).catch(() => {});
    }, 1000);

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

    const channelId = `session_state:${sessionId}:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
        },
        (payload) => {
          console.log({ event: 'REALTIME_SESSION_UPDATE', payload });
          this.getSessionById(sessionId).then((session) => {
            console.log({ event: 'CURRENT_QUESTION', currentQuestionIndex: session.current_question_index });
            onStateChange(session);
          }).catch(() => {});
        }
      );

    channel.subscribe();

    // 1-second Polling fallback for guaranteed state sync
    const pollInterval = setInterval(() => {
      this.getSessionById(sessionId).then(onStateChange).catch(() => {});
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  },
};
