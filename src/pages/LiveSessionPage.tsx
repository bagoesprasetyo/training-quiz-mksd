import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TrainerLobbyView } from '../features/live-session/TrainerLobbyView';
import { TrainerActiveQuestionView } from '../features/live-session/TrainerActiveQuestionView';
import { FinalRankingRevealView } from '../features/leaderboard/FinalRankingRevealView';
import { useLiveSessionStore } from '../store/liveSessionStore';
import { quizService } from '../services/quizService';
import type { Question } from '../types';

export const LiveSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, participants, initTrainerSession, loading } = useLiveSessionStore();
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (sessionId) {
      initTrainerSession(sessionId).then((unsub) => {
        cleanup = unsub;
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [sessionId, initTrainerSession]);

  useEffect(() => {
    if (session?.quiz_id) {
      quizService.getQuizById(session.quiz_id).then(({ questions: qList }) => {
        setQuestions(qList);
      });
    }
  }, [session?.quiz_id]);

  if (loading || !session) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Connecting to Live Quiz Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {session.status === 'waiting' && <TrainerLobbyView />}
      {(session.status === 'in_progress' || session.status === 'paused') && (
        <TrainerActiveQuestionView quizQuestions={questions} />
      )}
      {session.status === 'finished' && (
        <FinalRankingRevealView 
          participants={participants} 
          totalQuestions={questions.length} 
        />
      )}
    </div>
  );
};
