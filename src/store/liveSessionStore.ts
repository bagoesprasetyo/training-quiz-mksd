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
    set({ loading: true, session: null });
    try {
      const sessionData = await liveSessionService.getSessionById(sessionId);
      set({ session: sessionData });

      // Load initial participants
      const initialParticipants = await liveSessionService.getParticipants(sessionData.id);
      set({ participants: initialParticipants, loading: false });

      // Subscribe to participants list updates
      const unsubParticipants = liveSessionService.subscribeToParticipants(
        sessionData.id,
        (participants) => set({ participants, loading: false })
      );

      // Subscribe to session state updates
      const unsubState = liveSessionService.subscribeToSessionState(
        sessionData.id,
        (updatedSession) => set({ session: updatedSession, loading: false })
      );

      return () => {
        unsubParticipants();
        unsubState();
      };
    } catch (err) {
      console.error('Failed to init trainer session:', err);
      set({ session: null, loading: false });
      return () => {};
    }
  },

  initParticipantSession: async (sessionId: string) => {
    set({ loading: true, session: null });
    try {
      const sessionData = await liveSessionService.getSessionById(sessionId);
      set({ session: sessionData });

      // Load stored participant info from sessionStorage
      const stored = sessionStorage.getItem('participant_info');
      if (stored) {
        set({ currentParticipant: JSON.parse(stored) });
      }

      // Load initial participants
      const initialParticipants = await liveSessionService.getParticipants(sessionData.id);
      set({ participants: initialParticipants, loading: false });

      // Subscribe to session state
      const unsubState = liveSessionService.subscribeToSessionState(
        sessionData.id,
        (updatedSession) => set({ session: updatedSession, loading: false })
      );

      // Subscribe to participant count
      const unsubParticipants = liveSessionService.subscribeToParticipants(
        sessionData.id,
        (participants) => set({ participants, loading: false })
      );

      return () => {
        unsubState();
        unsubParticipants();
      };
    } catch (err) {
      console.error('Failed to init participant session:', err);
      set({ session: null, loading: false });
      return () => {};
    }
  },

  startQuiz: async () => {
    const { session } = get();
    if (!session) return;
    await liveSessionService.startQuizSession(session.id);
  },
}));
