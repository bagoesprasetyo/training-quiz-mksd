import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import type { SessionParticipant } from '../../types';

interface FinalRankingRevealViewProps {
  participants: SessionParticipant[];
  totalQuestions?: number;
}

export const FinalRankingRevealView: React.FC<FinalRankingRevealViewProps> = ({
  participants,
  totalQuestions = 10,
}) => {
  const [revealStep, setRevealStep] = useState<number>(0);

  const sorted = [...participants].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count;
    return a.total_response_time_ms - b.total_response_time_ms;
  });

  const firstPlace = sorted[0];
  const secondPlace = sorted[1];
  const thirdPlace = sorted[2];

  // Auto sequence reveal: Step 1 (3rd), Step 2 (2nd), Step 3 (1st + Confetti)
  useEffect(() => {
    const timer1 = setTimeout(() => setRevealStep(1), 800);  // Reveal 3rd
    const timer2 = setTimeout(() => setRevealStep(2), 2200); // Reveal 2nd
    const timer3 = setTimeout(() => {
      setRevealStep(3); // Reveal 1st
      // Trigger confetti fireworks
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="space-y-12 pb-16 max-w-5xl mx-auto text-center">
      
      {/* HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 font-extrabold text-xs uppercase tracking-wider">
          <Trophy className="w-4 h-4" /> Final Training Rankings
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          GRAND CHAMPIONS REVEAL 🎉
        </h1>
      </div>

      {/* 3D WINNER PODIUM */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center min-h-[320px] pt-8 px-2">
        
        {/* 2ND PLACE PODIUM (Left) */}
        <div className="flex flex-col items-center">
          <AnimatePresence>
            {revealStep >= 2 && secondPlace && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-2 mb-3"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-200 border-4 border-slate-300 text-slate-700 font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
                  🥈
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-lg truncate max-w-[120px] sm:max-w-[160px]">
                  {secondPlace.nickname}
                </h3>
                <p className="text-xs font-bold text-[#0000FF]">
                  {secondPlace.total_score.toLocaleString()} pts
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-36 sm:h-48 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-3xl flex items-center justify-center border-t-4 border-slate-400 font-black text-3xl sm:text-5xl text-slate-600 shadow-inner">
            2nd
          </div>
        </div>

        {/* 1ST PLACE PODIUM (Center - Tallest) */}
        <div className="flex flex-col items-center">
          <AnimatePresence>
            {revealStep >= 3 && firstPlace && (
              <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="space-y-2 mb-4"
              >
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-500 border-4 border-amber-200 text-white font-black text-4xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/50">
                  🥇
                </div>
                <h3 className="font-black text-slate-900 text-base sm:text-2xl truncate max-w-[140px] sm:max-w-[200px]">
                  {firstPlace.nickname}
                </h3>
                <p className="text-sm font-black text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  {firstPlace.total_score.toLocaleString()} pts
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-48 sm:h-64 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-3xl flex items-center justify-center border-t-4 border-amber-200 font-black text-4xl sm:text-6xl text-white shadow-2xl">
            1st
          </div>
        </div>

        {/* 3RD PLACE PODIUM (Right) */}
        <div className="flex flex-col items-center">
          <AnimatePresence>
            {revealStep >= 1 && thirdPlace && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-2 mb-3"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-800/20 border-4 border-amber-700 text-amber-700 font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
                  🥉
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-lg truncate max-w-[120px] sm:max-w-[160px]">
                  {thirdPlace.nickname}
                </h3>
                <p className="text-xs font-bold text-[#0000FF]">
                  {thirdPlace.total_score.toLocaleString()} pts
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-28 sm:h-36 bg-gradient-to-t from-amber-800/40 to-amber-700/30 rounded-t-3xl flex items-center justify-center border-t-4 border-amber-700/50 font-black text-2xl sm:text-4xl text-amber-700 shadow-inner">
            3rd
          </div>
        </div>
      </div>

      {/* COMPLETE LEADERBOARD TABLE */}
      {revealStep >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-4 text-left pt-6"
        >
          <h2 className="text-xl font-extrabold text-slate-900 text-center">
            Complete Participant Standings
          </h2>

          <Card className="p-0 overflow-hidden border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Participant Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Correct Answers</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4 text-right">Final Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-sm font-semibold text-slate-700">
                  {sorted.map((p, idx) => {
                    const accuracy = totalQuestions > 0 ? Math.round((p.correct_count / totalQuestions) * 100) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {p.nickname}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{p.department || '-'}</td>
                        <td className="py-3.5 px-4">{p.correct_count} / {totalQuestions}</td>
                        <td className="py-3.5 px-4">{accuracy}%</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#0000FF]">
                          {p.total_score.toLocaleString()} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
