import { create } from 'zustand';
import type { LiveSession, SessionParticipant } from '../types';
import { liveSessionService } from '../services/liveSessionService';

interface LiveSessionState {
  session: LiveSession | null;
  participants: SessionParticipant[];
  currentParticipant: SessionParticipant | null;
  loading: boolean;

  setSession: (session: LiveSession | null) => void;
  setParticipants: (participants: SessionParticipant[]) => void;
  setCurrentParticipant: (participant: SessionParticipant | null) => void;

  initTrainerSession: (sessionId: string) => Promise<() => void>;
  initParticipantSession: (sessionId: string) => Promise<() => void>;
  startQuiz: () => Promise<void>;
}

export const useLiveSessionStore = create<LiveSessionState>((set, get) => ({
  session: null,
  participants: [],
  currentParticipant: null,
  loading: true,

  setSession: (session) => set({ session }),
  setParticipants: (participants) => set({ participants }),
  setCurrentParticipant: (currentParticipant) => set({ currentParticipant }),

  initTrainerSession: async (sessionId: string) => {
    set({ loading: true });
    const sessionData = await liveSessionService.getSessionById(sessionId);
    set({ session: sessionData });

    // Subscribe to participants list updates
    const unsubParticipants = liveSessionService.subscribeToParticipants(
      sessionId,
      (participants) => set({ participants, loading: false })
    );

    // Subscribe to session state updates
    const unsubState = liveSessionService.subscribeToSessionState(
      sessionId,
      (updatedSession) => set({ session: updatedSession })
    );

    return () => {
      unsubParticipants();
      unsubState();
    };
  },

  initParticipantSession: async (sessionId: string) => {
    set({ loading: true });
    const sessionData = await liveSessionService.getSessionById(sessionId);
    set({ session: sessionData });

    // Load stored participant info from sessionStorage
    const stored = sessionStorage.getItem('participant_info');
    if (stored) {
      set({ currentParticipant: JSON.parse(stored) });
    }

    // Subscribe to session state (to detect when trainer clicks START QUIZ)
    const unsubState = liveSessionService.subscribeToSessionState(
      sessionId,
      (updatedSession) => set({ session: updatedSession, loading: false })
    );

    // Also subscribe to participant count
    const unsubParticipants = liveSessionService.subscribeToParticipants(
      sessionId,
      (participants) => set({ participants, loading: false })
    );

    return () => {
      unsubState();
      unsubParticipants();
    };
  },

  startQuiz: async () => {
    const { session } = get();
    if (!session) return;
    await liveSessionService.startQuizSession(session.id);
  },
}));
