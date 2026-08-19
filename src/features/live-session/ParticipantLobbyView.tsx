import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, User, Users, Volume2, VolumeX, Wifi } from 'lucide-react';
import { AnimatedBackground } from '../../components/game/AnimatedBackground';
import { AnimatedNumber } from '../../components/game/AnimatedNumber';
import { CountdownOverlay } from '../../components/game/CountdownOverlay';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLiveSessionStore } from '../../store/liveSessionStore';

/**
 * Participant lobby view — waiting for trainer to start.
 * Spec 64: Animated join with fade+slide, staggered avatars, participant counter animation.
 * Spec 65: Countdown overlay 3-2-1-GO when quiz starts.
 * Spec 77: Subtle animated background.
 */
export const ParticipantLobbyView: React.FC = () => {
  const { session, currentParticipant, participants } = useLiveSessionStore();
  const { play, enabled: soundEnabled, toggle: toggleSound } = useSoundEffects();
  const reducedMotion = useReducedMotion();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownDone, setCountdownDone] = useState(false);
  const prevCountRef = useRef(participants.length);

  // Detect new participant joins for "+1" animation
  const [newJoinFlash, setNewJoinFlash] = useState(false);
  useEffect(() => {
    if (participants.length > prevCountRef.current) {
      setNewJoinFlash(true);
      play('join');
      const timer = setTimeout(() => setNewJoinFlash(false), 1200);
      prevCountRef.current = participants.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = participants.length;
  }, [participants.length, play]);

  // When session status changes to in_progress, show countdown
  useEffect(() => {
    if (session?.status === 'in_progress' && !countdownDone) {
      setShowCountdown(true);
    }
  }, [session?.status, countdownDone]);

  if (!session) return null;

  // If countdown is showing, render it as overlay
  if (showCountdown) {
    return (
      <CountdownOverlay
        onComplete={() => {
          setShowCountdown(false);
          setCountdownDone(true);
        }}
        onTick={(step) => {
          if (step < 3) play('countdown');
          if (step === 3) play('questionStart');
        }}
      />
    );
  }

  return (
    <AnimatedBackground variant="blue">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Sound toggle */}
          <div className="flex justify-end">
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-white/80 backdrop-blur border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Main Card */}
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-slate-200/80 p-8 shadow-xl space-y-6 text-center"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Success status */}
            <div className="space-y-2">
              <motion.div
                className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
                initial={reducedMotion ? false : { scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-900">You're In!</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Successfully Connected
              </p>
            </div>

            {/* Participant info */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Your Name</p>
              <p className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                {currentParticipant?.nickname || 'Anonymous'}
              </p>
            </div>

            {/* Quiz title */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Training Quiz</span>
              <h3 className="text-xl font-extrabold text-blue-600">
                {session.quiz?.title || 'Corporate Training Quiz'}
              </h3>
            </div>

            {/* Participant counter with animation */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 relative overflow-hidden">
              <div className="flex items-center justify-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-extrabold text-blue-700">
                  <AnimatedNumber
                    value={participants.length}
                    className="text-2xl text-blue-600"
                    duration={0.4}
                  />
                  <span className="ml-2">Participants Joined</span>
                </span>
              </div>

              {/* "+1" flash animation */}
              <AnimatePresence>
                {newJoinFlash && (
                  <motion.span
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -30 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute top-2 right-4 text-sm font-black text-emerald-500"
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Staggered participant avatars */}
            {participants.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <AnimatePresence>
                  {participants.slice(0, 20).map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-sm"
                      title={p.nickname}
                    >
                      {p.nickname.charAt(0).toUpperCase()}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {participants.length > 20 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-bold text-[10px] flex items-center justify-center border border-slate-300">
                    +{participants.length - 20}
                  </div>
                )}
              </div>
            )}

            {/* Waiting animation */}
            <motion.div
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
              animate={reducedMotion ? {} : { boxShadow: ['0 10px 25px -5px rgba(59,130,246,0.2)', '0 10px 25px -5px rgba(59,130,246,0.4)', '0 10px 25px -5px rgba(59,130,246,0.2)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-5 h-5 text-white animate-pulse" />
              <span className="text-sm font-extrabold text-white">
                Waiting for trainer to start...
              </span>
            </motion.div>

            <p className="text-xs text-slate-400">
              Keep this window open. The quiz will start automatically.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
};
