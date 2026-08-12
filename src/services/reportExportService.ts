import { supabase } from './supabase';
import type { SessionParticipant, LiveSession } from '../types';

export interface QuestionAnalytic {
  questionId: string;
  questionText: string;
  totalAnswers: number;
  correctCount: number;
  wrongCount: number;
  correctPercent: number;
  wrongPercent: number;
  avgResponseTimeSec: number;
  difficultyRating: string;
}

export const reportExportService = {
  // Export training session participant performance to CSV format
  exportSessionToCSV(session: LiveSession, participants: SessionParticipant[], questionsCount = 10): void {
    const passingGrade = session.quiz?.passing_grade || 70;

    const headers = [
      'Rank',
      'Participant Name',
      'Employee ID',
      'Department',
      'Final Score',
      'Correct Answers',
      'Wrong Answers',
      'Accuracy %',
      'Avg Response Time (s)',
      'Status'
    ];

    const sorted = [...participants].sort((a, b) => b.total_score - a.total_score);

    const rows = sorted.map((p, idx) => {
      const accuracy = questionsCount > 0 ? Math.round((p.correct_count / questionsCount) * 100) : 0;
      const isPassed = accuracy >= passingGrade;
      const avgResponseSec = p.correct_count > 0 ? (p.total_response_time_ms / (p.correct_count + p.wrong_count || 1) / 1000).toFixed(1) : '0';

      return [
        idx + 1,
        `"${p.nickname.replace(/"/g, '""')}"`,
        `"${p.employee_id || '-'}"`,
        `"${p.department || '-'}"`,
        p.total_score,
        p.correct_count,
        p.wrong_count,
        `${accuracy}%`,
        avgResponseSec,
        isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Training_Report_${session.quiz?.title || 'Session'}_PIN_${session.pin_code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Calculate detailed per-question analytics
  async getQuestionAnalytics(sessionId: string): Promise<QuestionAnalytic[]> {
    const { data: answers, error } = await supabase
      .from('participant_answers')
      .select('*, questions(question_text)')
      .eq('session_id', sessionId);

    if (error) throw error;
    if (!answers || answers.length === 0) return [];

    // Group answers by question
    const grouped: { [qId: string]: { text: string; answers: any[] } } = {};
    answers.forEach((ans: any) => {
      const qId = ans.question_id;
      if (!grouped[qId]) {
        grouped[qId] = {
          text: ans.questions?.question_text || 'Question',
          answers: [],
        };
      }
      grouped[qId].answers.push(ans);
    });

    return Object.keys(grouped).map((qId) => {
      const item = grouped[qId];
      const totalAnswers = item.answers.length;
      const correctCount = item.answers.filter((a) => a.is_correct).length;
      const wrongCount = totalAnswers - correctCount;
      const correctPercent = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
      const wrongPercent = 100 - correctPercent;
      
      const totalResponseMs = item.answers.reduce((acc, a) => acc + (a.response_time_ms || 0), 0);
      const avgResponseTimeSec = totalAnswers > 0 ? parseFloat((totalResponseMs / totalAnswers / 1000).toFixed(1)) : 0;

      let difficultyRating = 'Medium';
      if (correctPercent >= 80) difficultyRating = 'Easy';
      else if (correctPercent < 50) difficultyRating = 'Hard';

      return {
        questionId: qId,
        questionText: item.text,
        totalAnswers,
        correctCount,
        wrongCount,
        correctPercent,
        wrongPercent,
        avgResponseTimeSec,
        difficultyRating,
      };
    });
  },
};
