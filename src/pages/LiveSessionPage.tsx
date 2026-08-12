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

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Connecting to Live Quiz Session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border-2 border-red-100 bg-red-50/50 shadow-elevated">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold">⚠️</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Sesi Live Tidak Ditemukan</h2>
          <p className="text-xs font-semibold text-slate-500">Sesi kuis ini tidak aktif, telah dihapus, atau PIN/ID tidak valid.</p>
          <a
            href="/dashboard"
            className="inline-block py-2.5 px-6 rounded-xl bg-[#0000FF] text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-md"
          >
            Kembali ke Dashboard
          </a>
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
