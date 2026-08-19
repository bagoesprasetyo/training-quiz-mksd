import { useCallback, useRef, useEffect, useState } from 'react';

type SoundName =
  | 'tick'
  | 'countdown'
  | 'correct'
  | 'wrong'
  | 'timeup'
  | 'scoreup'
  | 'join'
  | 'winner'
  | 'questionStart'
  | 'leaderboard';

const STORAGE_KEY = 'tq_sound_enabled';

/**
 * Procedural sound effect system using Web Audio API.
 * Spec 78: Optional sound effects — ON/OFF toggle, no forced autoplay.
 */
export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const userInteractedRef = useRef(false);

  // Mark user interaction so we can safely create AudioContext
  useEffect(() => {
    const markInteraction = () => { userInteractedRef.current = true; };
    window.addEventListener('click', markInteraction, { once: true });
    window.addEventListener('touchstart', markInteraction, { once: true });
    window.addEventListener('keydown', markInteraction, { once: true });
    return () => {
      window.removeEventListener('click', markInteraction);
      window.removeEventListener('touchstart', markInteraction);
      window.removeEventListener('keydown', markInteraction);
    };
  }, []);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
      const ctx = getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    },
    [getCtx]
  );

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled || !userInteractedRef.current) return;

      switch (name) {
        case 'tick':
          playTone(880, 0.08, 'square', 0.06);
          break;
        case 'countdown':
          playTone(600, 0.2, 'sine', 0.12);
          break;
        case 'correct':
          playTone(523, 0.12, 'sine', 0.15);
          setTimeout(() => playTone(659, 0.12, 'sine', 0.15), 100);
          setTimeout(() => playTone(784, 0.25, 'sine', 0.15), 200);
          break;
        case 'wrong':
          playTone(300, 0.15, 'sawtooth', 0.08);
          setTimeout(() => playTone(250, 0.25, 'sawtooth', 0.08), 120);
          break;
        case 'timeup':
          playTone(440, 0.15, 'square', 0.1);
          setTimeout(() => playTone(330, 0.15, 'square', 0.1), 150);
          setTimeout(() => playTone(220, 0.4, 'square', 0.1), 300);
          break;
        case 'scoreup':
          playTone(440, 0.08, 'sine', 0.1);
          setTimeout(() => playTone(554, 0.08, 'sine', 0.1), 60);
          setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 120);
          break;
        case 'join':
          playTone(700, 0.1, 'sine', 0.08);
          setTimeout(() => playTone(900, 0.15, 'sine', 0.08), 80);
          break;
        case 'winner':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 150);
          });
          break;
        case 'questionStart':
          playTone(500, 0.1, 'sine', 0.1);
          setTimeout(() => playTone(700, 0.15, 'sine', 0.12), 100);
          break;
        case 'leaderboard':
          playTone(440, 0.1, 'triangle', 0.08);
          setTimeout(() => playTone(554, 0.1, 'triangle', 0.08), 80);
          setTimeout(() => playTone(659, 0.2, 'triangle', 0.1), 160);
          break;
      }
    },
    [enabled, playTone]
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { play, enabled, toggle };
}
