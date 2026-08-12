import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  BarChart3 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SynchronizedTimer } from '../../components/ui/SynchronizedTimer';
import { useLiveSessionStore } from '../../store/liveSessionStore';
import { liveQuizEngineService } from '../../services/liveQuizEngineService';
import { useToast } from '../../components/ui/ToastProvider';
import type { Question, ParticipantAnswer } from '../../types';

interface TrainerActiveQuestionViewProps {
  quizQuestions: Question[];
}

export const TrainerActiveQuestionView: React.FC<TrainerActiveQuestionViewProps> = ({ quizQuestions }) => {
  const { session, participants } = useLiveSessionStore();
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<ParticipantAnswer[]>([]);

  if (!session || quizQuestions.length === 0) return null;

  const currentIndex = session.current_question_index || 0;
  const currentQ = quizQuestions[currentIndex] || quizQuestions[0];
  const isLastQuestion = currentIndex >= quizQuestions.length - 1;

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (session && currentQ) {
      unsub = liveQuizEngineService.subscribeToAnswers(session.id, currentQ.id, (data) => {
        setAnswers(data);
      });
    }
    return () => {
      if (unsub) unsub();
    };
  }, [session?.id, currentQ?.id]);

  const answeredCount = answers.length;
  const waitingCount = Math.max(0, participants.length - answeredCount);

  const handleNextQuestion = async () => {
    if (!session) return;
    if (isLastQuestion) {
      await liveQuizEngineService.pauseSession(session.id);
      showToast('Sudah mencapai pertanyaan terakhir!', 'info');
    } else {
      await liveQuizEngineService.nextQuestion(session.id, currentIndex + 1);
    }
  };

  const handleTogglePause = async () => {
    if (!session) return;
    if (session.status === 'paused') {
      await liveQuizEngineService.resumeSession(session.id);
    } else {
      await liveQuizEngineService.pauseSession(session.id);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* TOP HEADER CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-soft">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm">
              QUESTION {currentIndex + 1} OF {quizQuestions.length}
            </Badge>
            <Badge variant={session.status === 'paused' ? 'warning' : 'success'} size="sm">
              {session.status.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {session.quiz?.title || 'Live Training Session'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="font-bold"
            leftIcon={session.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            onClick={handleTogglePause}
          >
            {session.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>

          <Button
            variant="primary"
            size="lg"
            className="font-extrabold px-6"
            rightIcon={<SkipForward className="w-4 h-4" />}
            onClick={handleNextQuestion}
          >
            {isLastQuestion ? 'FINISH QUIZ' : 'NEXT QUESTION'}
          </Button>
        </div>
      </div>

      {/* METRICS CARDS & TIMER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Synchronized Server Timer */}
        <div className="md:col-span-4">
          <Card className="p-6 border-2 border-blue-100 bg-white">
            <SynchronizedTimer
              startTimeIso={session.current_question_start_time}
              timeLimitSeconds={currentQ.time_limit || 30}
              isPaused={session.status === 'paused'}
            />
          </Card>
        </div>

        {/* Right: Answered & Waiting Counters */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex flex-col justify-center border-2 border-slate-200 bg-white">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Total Peserta</span>
            <span className="text-3xl font-black text-slate-900">{participants.length}</span>
          </Card>

          <Card className="p-5 flex flex-col justify-center border-2 border-emerald-300 bg-emerald-50/70">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Sudah Menjawab</span>
            <span className="text-3xl font-black text-emerald-600">{answeredCount}</span>
          </Card>

          <Card className="p-5 flex flex-col justify-center border-2 border-amber-300 bg-amber-50/70">
            <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Belum Menjawab</span>
            <span className="text-3xl font-black text-amber-600">{waitingCount}</span>
          </Card>
        </div>
      </div>

      {/* ACTIVE QUESTION & REALTIME ANSWER DISTRIBUTION BAR CHART */}
      <Card className="p-8 space-y-8 border-2 border-blue-100 shadow-elevated bg-white">
        
        {/* Question Text */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#0000FF]">
            Pertanyaan Kuis Aktif
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {currentQ.question_text}
          </h2>
        </div>

        {/* Media Preview if attached */}
        {currentQ.media_url && (
          <div className="max-h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex justify-center">
            <img src={currentQ.media_url} alt="Media" className="max-h-60 object-contain" />
          </div>
        )}

        {/* Real-time Answer Options Distribution */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0000FF]" /> Distribusi Jawaban Peserta (Realtime)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options?.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const optAnswersCount = answers.filter((a) => a.selected_option_id === opt.id).length;
              const percent = answeredCount > 0 ? Math.round((optAnswersCount / answeredCount) * 100) : 0;
              const isCorrect = opt.is_correct;

              return (
                <div
                  key={opt.id || optIdx}
                  className={`
                    p-4 rounded-2xl border-2 transition-all relative overflow-hidden space-y-2
                    ${isCorrect 
                      ? 'border-emerald-500 bg-emerald-50/80' 
                      : 'border-slate-200 bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0
                        ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-900'}
                      `}>
                        {letter}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {opt.option_text}
                      </span>
                    </div>

                    <span className="font-black text-sm text-slate-900 shrink-0 ml-2">
                      {optAnswersCount} ({percent}%)
                    </span>
                  </div>

                  {/* Progress Fill */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-emerald-500' : 'bg-[#0000FF]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};
