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
    if (session?.quiz_id) {
      quizService.getQuizById(session.quiz_id).then(({ questions: qList }) => {
        setQuestions(qList);
      });
    }
  }, [session?.quiz_id]);

  if (loading || !session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Connecting to Quiz Session...</p>
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
