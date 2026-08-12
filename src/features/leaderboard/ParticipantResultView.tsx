import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Target } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { SessionParticipant, LiveSession } from '../../types';

interface ParticipantResultViewProps {
  session: LiveSession;
  currentParticipant: SessionParticipant | null;
  allParticipants: SessionParticipant[];
  totalQuestions?: number;
}

export const ParticipantResultView: React.FC<ParticipantResultViewProps> = ({
  session,
  currentParticipant,
  allParticipants,
  totalQuestions = 10,
}) => {
  if (!currentParticipant) return null;

  // Calculate rank
  const sorted = [...allParticipants].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count;
    return a.total_response_time_ms - b.total_response_time_ms;
  });

  const rank = sorted.findIndex((p) => p.id === currentParticipant.id) + 1;
  const total = sorted.length || 1;

  const passingGrade = session.quiz?.passing_grade || 70;
  const accuracy = totalQuestions > 0 ? Math.round((currentParticipant.correct_count / totalQuestions) * 100) : 0;
  const isPassed = accuracy >= passingGrade;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white">
      <motion.div 
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass-panel border-2 border-slate-200/80 p-8 shadow-elevated text-center space-y-6">
          
          {/* PASS / FAIL BADGE HEADER */}
          <div className="space-y-3">
            <div className={`
              w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg
              ${isPassed 
                ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600' 
                : 'bg-amber-50 border-2 border-amber-500 text-amber-600'
              }
            `}>
              {isPassed ? <CheckCircle2 className="w-8 h-8" /> : <Award className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              {isPassed ? 'TRAINING PASSED! 🎉' : 'QUIZ COMPLETED'}
            </h2>

            <Badge variant={isPassed ? 'success' : 'warning'} size="md">
              {isPassed ? `PASSED (${accuracy}% ≥ ${passingGrade}%)` : `NEEDS IMPROVEMENT (${accuracy}%)`}
            </Badge>
          </div>

          {/* FINAL SCORE & RANK BANNER */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0000FF] to-blue-800 text-white space-y-2 shadow-lg shadow-blue-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Your Final Score
            </span>
            <p className="text-4xl font-black tracking-tight">
              {currentParticipant.total_score.toLocaleString()} <span className="text-base font-normal text-blue-200">pts</span>
            </p>
            <p className="text-xs font-semibold text-blue-100 pt-1">
              Final Position: <span className="font-extrabold text-white text-sm">Rank #{rank} of {total}</span>
            </p>
          </div>

          {/* METRICS BREAKDOWN GRID */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Correct
              </span>
              <p className="text-lg font-black text-slate-900">
                {currentParticipant.correct_count} / {totalQuestions}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-500" /> Accuracy
              </span>
              <p className="text-lg font-black text-slate-900">
                {accuracy}%
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Thank you for participating in {session.quiz?.title || 'this corporate training session'}.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
