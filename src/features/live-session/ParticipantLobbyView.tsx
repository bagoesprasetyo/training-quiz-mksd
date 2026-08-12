import React from 'react';
import { motion } from 'framer-motion';
import { Radio, CheckCircle2, User } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useLiveSessionStore } from '../../store/liveSessionStore';

export const ParticipantLobbyView: React.FC = () => {
  const { session, currentParticipant } = useLiveSessionStore();

  if (!session) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white">
      <motion.div 
        className="w-full max-w-md space-y-6 text-center"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-panel border-2 border-slate-200/80 p-8 shadow-elevated space-y-6">
          
          {/* Header Status */}
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">You're In!</h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Successfully Connected to Session
            </p>
          </div>

          {/* Participant Info Card */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Participant Name</p>
            <p className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
              <User className="w-4 h-4 text-[#0000FF]" />
              {currentParticipant?.nickname || 'Anonymous'}
            </p>
            {currentParticipant?.department && (
              <Badge variant="outline" size="sm" className="mt-1">{currentParticipant.department}</Badge>
            )}
          </div>

          {/* Quiz Details */}
          <div className="space-y-1 text-center">
            <span className="text-xs text-slate-400 font-medium">Training Quiz</span>
            <h3 className="text-xl font-extrabold text-[#0000FF]">
              {session.quiz?.title || 'Corporate Training Quiz'}
            </h3>
          </div>

          {/* Animated Waiting Banner */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-3">
            <Radio className="w-5 h-5 text-[#0000FF] animate-ping" />
            <span className="text-sm font-extrabold text-[#0000FF]">
              Waiting for trainer to start...
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Keep this browser window open. The first question will automatically appear when the trainer starts the quiz.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
