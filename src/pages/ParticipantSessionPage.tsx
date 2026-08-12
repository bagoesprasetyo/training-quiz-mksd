import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ParticipantLobbyView } from '../features/live-session/ParticipantLobbyView';
import { ParticipantActiveQuestionView } from '../features/live-session/ParticipantActiveQuestionView';
import { ParticipantResultView } from '../features/leaderboard/ParticipantResultView';
import { useLiveSessionStore } from '../store/liveSessionStore';
import { quizService } from '../services/quizService';
import type { Question } from '../types';

export const ParticipantSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, currentParticipant, participants, initParticipantSession, loading } = useLiveSessionStore();
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (sessionId) {
      initParticipantSession(sessionId).then((unsub) => {
        cleanup = unsub;
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [sessionId, initParticipantSession]);

  useEffect(() => {
    let timer: any;
    let isCancelled = false;

    const fetchQuestions = async () => {
      if (session?.quiz_id && !isCancelled) {
        try {
          const { questions: qList } = await quizService.getQuizById(session.quiz_id);
          if (!isCancelled) {
            setQuestions(qList);
            // If questions are still empty, retry in 2.5 seconds
            if (qList.length === 0) {
              timer = setTimeout(fetchQuestions, 2500);
            }
          }
        } catch {
          if (!isCancelled) {
            timer = setTimeout(fetchQuestions, 3000);
          }
        }
      }
    };

    fetchQuestions();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [session?.quiz_id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Connecting to Quiz Session...</p>
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
          <h2 className="text-xl font-black text-slate-900">Sesi Kuis Tidak Ditemukan</h2>
          <p className="text-xs font-semibold text-slate-500">Sesi kuis telah berakhir, telah dihapus, atau PIN tidak valid.</p>
          <a
            href="/join"
            className="inline-block py-2.5 px-6 rounded-xl bg-[#0000FF] text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-md"
          >
            Masukkan PIN Lagi
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {session.status === 'waiting' && <ParticipantLobbyView />}
      {(session.status === 'in_progress' || session.status === 'paused') && (
        <ParticipantActiveQuestionView quizQuestions={questions} />
      )}
      {session.status === 'finished' && (
        <ParticipantResultView 
          session={session} 
          currentParticipant={currentParticipant} 
          allParticipants={participants} 
          totalQuestions={questions.length} 
        />
      )}
    </>
  );
};
