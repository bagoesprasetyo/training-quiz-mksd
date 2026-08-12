import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SynchronizedTimer } from '../../components/ui/SynchronizedTimer';
import { liveQuizEngineService } from '../../services/liveQuizEngineService';
import { useLiveSessionStore } from '../../store/liveSessionStore';
import type { Question, QuestionOption } from '../../types';

interface ParticipantActiveQuestionViewProps {
  quizQuestions: Question[];
}

export const ParticipantActiveQuestionView: React.FC<ParticipantActiveQuestionViewProps> = ({ quizQuestions }) => {
  const { session, currentParticipant } = useLiveSessionStore();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!session || quizQuestions.length === 0) return null;

  const currentIndex = session.current_question_index || 0;
  const currentQ = quizQuestions[currentIndex] || quizQuestions[0];
  const options = currentQ.options || [];

  // Reset answer state when trainer moves to a new question
  useEffect(() => {
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setIsTimeUp(false);
  }, [currentIndex]);

  const handleSelectOption = async (option: QuestionOption) => {
    if (isSubmitted || isTimeUp || isSubmitting || !session || !currentParticipant) return;

    try {
      setIsSubmitting(true);
      setSelectedOptionId(option.id);

      // Calculate response time in ms
      const startMs = session.current_question_start_time ? new Date(session.current_question_start_time).getTime() : Date.now();
      const responseTimeMs = Math.max(100, Date.now() - startMs);

      // Scoring calculation: Base 100 points + Speed bonus (0 - 50 points based on speed)
      const isCorrect = option.is_correct;
      let pointsEarned = 0;

      if (isCorrect) {
        const timeLimitMs = (currentQ.time_limit || 30) * 1000;
        const speedFactor = Math.max(0, 1 - responseTimeMs / timeLimitMs);
        const speedBonus = Math.round(speedFactor * 50);
        pointsEarned = 100 + speedBonus; // Max 150 points
      }

      await liveQuizEngineService.submitAnswer(
        session.id,
        currentParticipant.id,
        currentQ.id,
        option.id,
        responseTimeMs,
        isCorrect,
        pointsEarned
      );

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 max-w-lg mx-auto space-y-6">
      
      {/* TOP STATUS BAR & TIMER */}
      <Card className="p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#0000FF] uppercase tracking-wider">
            QUESTION {currentIndex + 1} OF {quizQuestions.length}
          </span>
          <span className="text-slate-400">
            {currentParticipant?.nickname || 'Participant'}
          </span>
        </div>

        <SynchronizedTimer
          startTimeIso={session.current_question_start_time}
          timeLimitSeconds={currentQ.time_limit || 30}
          isPaused={session.status === 'paused'}
          onExpire={() => setIsTimeUp(true)}
        />
      </Card>

      {/* QUESTION PROMPT */}
      <Card className="p-6 space-y-4 border-2 border-slate-200/80 shadow-soft bg-white">
        <h2 className="text-xl font-black text-slate-900 leading-snug">
          {currentQ.question_text}
        </h2>

        {currentQ.media_url && (
          <div className="rounded-xl overflow-hidden max-h-48 border flex justify-center bg-slate-50">
            <img src={currentQ.media_url} alt="Question Media" className="max-h-44 object-contain" />
          </div>
        )}
      </Card>

      {/* ANSWER CHOICES OR CONFIRMATION SCREEN */}
      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center space-y-4 bg-blue-50 border-2 border-[#0000FF] shadow-elevated">
            <div className="w-14 h-14 rounded-full bg-[#0000FF] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Answer Submitted!</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Your response is locked. Waiting for trainer to reveal results or launch next question...
            </p>
          </Card>
        </motion.div>
      ) : isTimeUp ? (
        <Card className="p-6 text-center space-y-3 bg-red-50 border-2 border-red-400">
          <Lock className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600">Time's Up!</h3>
          <p className="text-xs text-slate-500">Answer submission locked for this question.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider text-center">
            Pilih Jawaban Anda Di Bawah Ini:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {options.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = selectedOptionId === opt.id;

              return (
                <button
                  key={opt.id || optIdx}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={isSubmitting}
                  className={`
                    w-full p-4 rounded-2xl border-2 font-black text-left text-base flex items-center gap-4 transition-all duration-150 cursor-pointer active:scale-98 shadow-sm
                    ${isSelected 
                      ? 'bg-[#0000FF] text-white border-[#0000FF] shadow-lg shadow-blue-500/30' 
                      : 'bg-white text-slate-900 border-slate-200 hover:border-[#0000FF] hover:bg-blue-50/50'
                    }
                  `}
                >
                  <span className={`
                    w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0
                    ${isSelected ? 'bg-white text-[#0000FF]' : 'bg-blue-50 text-[#0000FF] border border-blue-100'}
                  `}>
                    {letter}
                  </span>
                  <span className="flex-1 font-black text-slate-900">{opt.option_text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
