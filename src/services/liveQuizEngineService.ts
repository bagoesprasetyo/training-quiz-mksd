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
  ): Promise<{ is_correct: boolean; score_earned: number }> {
    const isOptionCorrect = Boolean(isCorrect);
    const score = isOptionCorrect ? Number(pointsEarned || 100) : 0;
    const responseTime = Number(responseTimeMs || 1000);

    // 1. Direct Score Accumulation in session_participants FIRST
    try {
      const { data: currentParticipant } = await supabase
        .from('session_participants')
        .select('total_score, correct_count, wrong_count, total_response_time_ms')
        .eq('id', participantId)
        .maybeSingle();

      const newScore = (currentParticipant?.total_score || 0) + score;
      const newCorrect = (currentParticipant?.correct_count || 0) + (isOptionCorrect ? 1 : 0);
      const newWrong = (currentParticipant?.wrong_count || 0) + (isOptionCorrect ? 0 : 1);
      const newTime = (currentParticipant?.total_response_time_ms || 0) + responseTime;

      await supabase
        .from('session_participants')
        .update({
          total_score: newScore,
          correct_count: newCorrect,
          wrong_count: newWrong,
          total_response_time_ms: newTime,
        })
        .eq('id', participantId);
    } catch (err) {
      console.warn('Error updating session_participants score:', err);
    }

    // 2. Safe record in participant_answers without onConflict constraint requirement
    try {
      const { data: existingAnswer } = await supabase
        .from('participant_answers')
        .select('id')
        .eq('session_id', sessionId)
        .eq('participant_id', participantId)
        .eq('question_id', questionId)
        .maybeSingle();

      const answerPayload = {
        session_id: sessionId,
        participant_id: participantId,
        question_id: questionId,
        selected_option_id: selectedOptionId || null,
        is_correct: isOptionCorrect,
        score_earned: score,
        response_time_ms: responseTime,
        submitted_at: new Date().toISOString(),
      };

      if (existingAnswer?.id) {
        await supabase
          .from('participant_answers')
          .update(answerPayload)
          .eq('id', existingAnswer.id);
      } else {
        await supabase
          .from('participant_answers')
          .insert(answerPayload);
      }
    } catch (err) {
      console.warn('Error recording participant_answer:', err);
    }

    return { is_correct: isOptionCorrect, score_earned: score };
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
    console.log({
      event: 'NEXT_QUESTION',
      sessionId,
      currentQuestionIndex: newIndex,
    });

    const { data: updatedSession, error } = await supabase
      .from('live_sessions')
      .update({
        current_question_index: newIndex,
        current_question_start_time: new Date().toISOString(),
        status: 'in_progress',
      })
      .eq('id', sessionId)
      .select('*, quiz:quizzes(*)')
      .single();

    if (error) {
      console.error('Error in nextQuestion:', error);
      throw error;
    }

    console.log({
      event: 'SESSION_UPDATED',
      session: updatedSession,
    });
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
    this.getAnswersForQuestion(sessionId, questionId).then(onAnswersChange).catch(() => {});

    const channelId = `answers:${sessionId}:${questionId}:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_answers',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          this.getAnswersForQuestion(sessionId, questionId).then(onAnswersChange).catch(() => {});
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
