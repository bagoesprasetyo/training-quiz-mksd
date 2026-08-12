import { supabase } from './supabase';
import type { ParticipantAnswer } from '../types';

export const liveQuizEngineService = {
  // Submit participant's answer to database securely
  async submitAnswer(
    sessionId: string,
    participantId: string,
    questionId: string,
    selectedOptionId: string | null,
    responseTimeMs: number,
    isCorrect: boolean,
    pointsEarned: number
  ): Promise<ParticipantAnswer> {
    const { data, error } = await supabase
      .from('participant_answers')
      .upsert(
        {
          session_id: sessionId,
          participant_id: participantId,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
          score_earned: pointsEarned,
          response_time_ms: responseTimeMs,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,participant_id,question_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Update participant's cumulative score and counts
    const { data: currentParticipant } = await supabase
      .from('session_participants')
      .select('total_score, correct_count, wrong_count, total_response_time_ms')
      .eq('id', participantId)
      .single();

    if (currentParticipant) {
      await supabase
        .from('session_participants')
        .update({
          total_score: (currentParticipant.total_score || 0) + pointsEarned,
          correct_count: (currentParticipant.correct_count || 0) + (isCorrect ? 1 : 0),
          wrong_count: (currentParticipant.wrong_count || 0) + (isCorrect ? 0 : 1),
          total_response_time_ms: (currentParticipant.total_response_time_ms || 0) + responseTimeMs,
        })
        .eq('id', participantId);
    }

    return data;
  },

  async getAnswersForQuestion(sessionId: string, questionId: string): Promise<ParticipantAnswer[]> {
    const { data, error } = await supabase
      .from('participant_answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_id', questionId);

    if (error) throw error;
    return data || [];
  },

  async nextQuestion(sessionId: string, newIndex: number): Promise<void> {
    const { error } = await supabase
      .from('live_sessions')
      .update({
        current_question_index: newIndex,
        current_question_start_time: new Date().toISOString(),
        status: 'in_progress',
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async pauseSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('live_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async resumeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('live_sessions')
      .update({ status: 'in_progress' })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Realtime subscription for participant answers to display live bar charts for trainer
  subscribeToAnswers(
    sessionId: string,
    questionId: string,
    onAnswersChange: (answers: ParticipantAnswer[]) => void
  ) {
    this.getAnswersForQuestion(sessionId, questionId).then(onAnswersChange);

    const channel = supabase
      .channel(`answers:${sessionId}:${questionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_answers',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          this.getAnswersForQuestion(sessionId, questionId).then(onAnswersChange);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
