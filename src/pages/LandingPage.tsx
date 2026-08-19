import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Hash,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CompanyLogo } from '../components/shared/CompanyLogo';

export const LandingPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
      navigate(`/join/${pin.trim()}`);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col justify-between bg-gradient-to-b from-blue-50/40 via-white to-white overflow-y-auto lg:overflow-hidden">
      {/* Top Header / Branding Bar */}
      <header className="pt-4 pb-2 px-4 sm:px-6 lg:px-10 max-w-7xl w-full mx-auto flex items-center justify-between">
        <CompanyLogo size="md" />
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-black text-slate-700 hover:text-[#0000FF] bg-blue-50/80 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-100 transition-all flex items-center gap-1.5"
        >
          <span>Trainer Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* MAIN HERO CONTENT - Shifted Upwards to Fit in 1 Viewport */}
      <main className="flex-1 flex items-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-2 sm:py-4">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Column: Hero Text */}
          <motion.div 
            className="lg:col-span-7 space-y-4 text-center lg:text-left"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0000FF] text-[11px] font-black tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#0000FF] animate-pulse"></span>
              Corporate Interactive Quiz System
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.15]">
              Interactive Training Quiz Platform <span className="brand-gradient-text">PT Multikarya Sinardinamika</span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Platform kuis interaktif real-time untuk kebutuhan training karyawan perusahaan, live leaderboard, server-synchronized timer, dan laporan hasil evaluasi training.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <Button 
                variant="primary" 
                size="lg" 
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/login')}
                className="font-extrabold shadow-lg shadow-blue-500/25 px-6 py-3"
              >
                Start as Trainer
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                leftIcon={<Hash className="w-4 h-4 text-[#0000FF]" />}
                onClick={() => navigate('/join')}
                className="font-extrabold px-6 py-3 bg-white"
              >
                Enter PIN Code
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 border-t border-blue-100 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Anonymous Participant
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Realtime Sync Engine
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> QR & PIN Access
              </span>
            </div>
          </motion.div>

          {/* Right Column: Participant Quick PIN Entry Card */}
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-2 border-blue-100 shadow-elevated p-6 sm:p-7 bg-white rounded-3xl">
              <div className="text-center space-y-1.5 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center mx-auto shadow-inner border border-blue-200">
                  <Hash className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Join Training Session</h3>
                <p className="text-xs font-semibold text-slate-500">Enter 6-digit session PIN provided by your trainer</p>
              </div>

              <form onSubmit={handleJoin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                    6-Digit PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="E.G. 482731"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-blue-100 bg-white text-slate-900 focus:border-[#0000FF] focus:ring-4 focus:ring-blue-500/20 focus:outline-none uppercase placeholder:text-slate-300"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-full font-extrabold text-sm py-3 shadow-md shadow-blue-500/25"
                  disabled={!pin.trim()}
                >
                  JOIN TRAINING SESSION
                </Button>

                <p className="text-[11px] text-center text-slate-400 font-bold pt-1">
                  No account required for training participants
                </p>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="py-2.5 px-4 bg-white/80 border-t border-blue-50 text-center text-[11px] text-slate-500 font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4">
          <span className="font-bold text-slate-700">PT Multikarya Sinardinamika • Training Quiz System © 2026</span>
          <span className="text-slate-400">Corporate Edition v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};
