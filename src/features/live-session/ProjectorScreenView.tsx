import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Users, Radio } from 'lucide-react';
import { QRCodeDisplay } from '../../components/ui/QRCodeDisplay';
import { FinalRankingRevealView } from '../leaderboard/FinalRankingRevealView';
import { useLiveSessionStore } from '../../store/liveSessionStore';

export const ProjectorScreenView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, participants, initTrainerSession } = useLiveSessionStore();

  useEffect(() => {
    if (sessionId) {
      initTrainerSession(sessionId);
    }
  }, [sessionId, initTrainerSession]);

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold">
        Loading Projector View...
      </div>
    );
  }

  if (session.status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12">
        <FinalRankingRevealView participants={participants} />
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/join/${session.pin_code}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0000FF] flex items-center justify-center text-white font-bold shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {session.quiz?.title || 'Training Quiz Session'}
            </h1>
            <p className="text-sm font-semibold text-slate-400">Projector Live Stream</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800">
          <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
          <span className="text-lg font-extrabold text-emerald-400 uppercase tracking-wider">
            {session.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-8">
        
        {/* Giant PIN Banner */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">
              Join at <span className="text-white font-black underline">{window.location.host}</span>
            </p>
            <p className="text-sm text-blue-400 font-semibold uppercase">GAME PIN</p>
          </div>

          <div className="bg-white text-[#0000FF] px-12 py-8 rounded-3xl font-black text-7xl md:text-9xl tracking-[0.25em] shadow-2xl inline-block">
            {session.pin_code}
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-lg font-semibold pt-4">
            <Users className="w-6 h-6 text-[#0000FF]" />
            <span>Open your phone browser and enter the PIN above to join!</span>
          </div>
        </div>

        {/* Large QR Code */}
        <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
          <QRCodeDisplay value={joinUrl} size={260} className="p-6 rounded-3xl shadow-2xl" />
          <p className="text-xl font-extrabold text-white">Scan QR Code with Camera</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-800 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-[#0000FF]" />
            <span>Participants Joined ({participants.length})</span>
          </h3>
          <span className="text-sm font-semibold text-slate-400">Realtime Updates</span>
        </div>
      </div>
    </div>
  );
};
