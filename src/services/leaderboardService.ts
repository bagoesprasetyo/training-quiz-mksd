import { supabase } from './supabase';
import type { SessionParticipant } from '../types';

export const leaderboardService = {
  // Fetch leaderboard sorted by: 1. Total Score (DESC), 2. Correct Count (DESC), 3. Response Time (ASC)
  async getLeaderboard(sessionId: string): Promise<SessionParticipant[]> {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('total_score', { ascending: false })
      .order('correct_count', { ascending: false })
      .order('total_response_time_ms', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Calculate pass/fail status for participant
  calculatePassStatus(correctCount: number, totalQuestions: number, passingGradePercent: number): {
    accuracyPercent: number;
    isPassed: boolean;
  } {
    if (totalQuestions === 0) return { accuracyPercent: 0, isPassed: false };
    const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = accuracyPercent >= passingGradePercent;
    return { accuracyPercent, isPassed };
  },
};
