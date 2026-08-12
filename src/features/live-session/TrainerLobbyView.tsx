import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Play, 
  Tv, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  UserCheck,
  Radio
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { QRCodeDisplay } from '../../components/ui/QRCodeDisplay';
import { useLiveSessionStore } from '../../store/liveSessionStore';

export const TrainerLobbyView: React.FC = () => {
  const { session, participants, startQuiz } = useLiveSessionStore();
  const [copied, setCopied] = React.useState(false);

  if (!session) return null;

  const joinUrl = `${window.location.origin}/join/${session.pin_code}`;

  const copyPin = () => {
    navigator.clipboard.writeText(session.pin_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <Badge variant="success" size="sm">LOBBY PHASE • WAITING</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {session.quiz?.title || 'Training Quiz Session'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Tv className="w-4 h-4 text-[#0000FF]" />}
            onClick={() => window.open(`/live/${session.id}/screen`, '_blank')}
          >
            Projector TV Mode
          </Button>

          <Button
            variant="primary"
            size="lg"
            className="font-extrabold px-8 shadow-lg shadow-blue-500/20"
            leftIcon={<Play className="w-5 h-5 fill-current" />}
            onClick={() => startQuiz()}
            disabled={participants.length === 0}
          >
            START QUIZ NOW ({participants.length})
          </Button>
        </div>
      </div>

      {/* PIN & QR CODE DISPLAY BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: PIN CODE DISPLAY */}
        <div className="lg:col-span-8">
          <Card className="bg-gradient-to-br from-[#0000FF] to-blue-800 text-white p-8 md:p-10 space-y-6 shadow-elevated relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-64 h-64 text-white" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">
                Join at <span className="underline">{window.location.host}</span> or scan QR code
              </p>
              <h2 className="text-sm font-bold text-blue-100">SESSION PIN CODE</h2>
            </div>

            {/* Huge Prominent 6-Digit PIN */}
            <div className="flex items-center gap-4">
              <div 
                onClick={copyPin}
                className="bg-white text-[#0000FF] px-8 py-5 rounded-2xl font-black text-5xl sm:text-7xl tracking-[0.2em] shadow-2xl cursor-pointer hover:scale-105 transition-transform flex items-center gap-4"
              >
                <span>{session.pin_code}</span>
              </div>
              <button 
                onClick={copyPin}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Copy PIN"
              >
                {copied ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-100 pt-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Participants can join instantly on smartphone browsers without an account</span>
            </div>
          </Card>
        </div>

        {/* Right: QR CODE DISPLAY */}
        <div className="lg:col-span-4 flex flex-col items-center text-center space-y-3">
          <QRCodeDisplay value={joinUrl} size={190} />
          <div>
            <p className="text-xs font-bold text-slate-800">Scan QR Code to Join</p>
            <p className="text-[11px] text-slate-400">Direct link to session page</p>
          </div>
        </div>
      </div>

      {/* REALTIME PARTICIPANTS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0000FF]" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Joined Participants ({participants.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Updates in real-time</span>
        </div>

        {participants.length === 0 ? (
          <Card className="py-16 text-center space-y-3 border-dashed border-2">
            <Radio className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-slate-700">Waiting for participants to join...</h3>
            <p className="text-xs text-slate-400">Share PIN <span className="font-bold text-[#0000FF]">{session.pin_code}</span> with your training class.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <AnimatePresence>
              {participants.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-3.5 flex items-center gap-3 border-slate-200/80 bg-white shadow-xs hover:border-[#0000FF] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0000FF] font-bold text-xs flex items-center justify-center shrink-0">
                      {p.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {p.nickname}
                      </p>
                      {p.department && (
                        <p className="text-[10px] text-slate-400 truncate">{p.department}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
