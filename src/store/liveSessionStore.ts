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
      let participantObj: SessionParticipant | null = null;
      const stored = sessionStorage.getItem('participant_info');
      if (stored) {
        try {
          participantObj = JSON.parse(stored);
          set({ currentParticipant: participantObj });
        } catch {
          // ignore
        }
      }

      // Load initial participants
      const initialParticipants = await liveSessionService.getParticipants(sessionData.id);
      let updatedCurrent = participantObj;
      if (participantObj) {
        const found = initialParticipants.find((p) => p.id === participantObj?.id);
        if (found) {
          updatedCurrent = found;
          sessionStorage.setItem('participant_info', JSON.stringify(found));
        }
      }
      set({ participants: initialParticipants, currentParticipant: updatedCurrent, loading: false });

      // Subscribe to session state
      const unsubState = liveSessionService.subscribeToSessionState(
        sessionData.id,
        (updatedSession) => set({ session: updatedSession, loading: false })
      );

      // Subscribe to participants realtime updates
      const unsubParticipants = liveSessionService.subscribeToParticipants(
        sessionData.id,
        (participants) => {
          const { currentParticipant } = get();
          let current = currentParticipant;
          if (current?.id) {
            const targetId = current.id;
            const found = participants.find((p) => p.id === targetId);
            if (found) {
              current = found;
              sessionStorage.setItem('participant_info', JSON.stringify(found));
            }
          }
          set({ participants, currentParticipant: current, loading: false });
        }
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
