import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Radio, 
  Award, 
  BarChart3, 
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-white">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text */}
            <motion.div 
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block pb-2">
                <CompanyLogo size="lg" />
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Interactive Training Quiz Platform <span className="brand-gradient-text">PT Multikarya Sinardinamika</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Platform kuis interaktif real-time untuk kebutuhan training karyawan perusahaan, live leaderboard, server-synchronized timer, dan laporan hasil evaluasi training.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button 
                  variant="primary" 
                  size="xl" 
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => navigate('/login')}
                >
                  Start as Trainer
                </Button>
                <Button 
                  variant="outline" 
                  size="xl" 
                  leftIcon={<Hash className="w-5 h-5 text-[#0000FF]" />}
                  onClick={() => navigate('/join')}
                >
                  Enter PIN Code
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-blue-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Anonymous Participant Join
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Realtime Sync Engine
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> QR & PIN Access
                </span>
              </div>
            </motion.div>

            {/* Right Column: Participant Quick PIN Entry Card */}
            <motion.div 
              className="lg:col-span-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-2 border-blue-100 shadow-elevated p-8 bg-white">
                <div className="text-center space-y-2 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center mx-auto shadow-inner border border-blue-200">
                    <Hash className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Join Training Session</h3>
                  <p className="text-sm font-semibold text-slate-500">Enter 6-digit session PIN provided by your trainer</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 text-center">
                      6-Digit PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 482731"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-black tracking-widest py-4 px-4 rounded-2xl border-2 border-blue-100 bg-white text-slate-900 focus:border-[#0000FF] focus:ring-4 focus:ring-blue-500/20 focus:outline-none uppercase placeholder:text-slate-300"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-full font-extrabold text-base py-3.5 shadow-lg shadow-blue-500/30"
                    disabled={!pin.trim()}
                  >
                    JOIN TRAINING SESSION
                  </Button>

                  <p className="text-xs text-center text-slate-500 font-bold pt-2">
                    No account required for training participants
                  </p>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="py-16 bg-white border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#0000FF]">PT Multikarya Sinardinamika</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Enterprise Interactive Quiz Engine
            </h2>
            <p className="text-slate-600 text-sm font-semibold">
              Platform kuis interaktif standar tinggi untuk evaluasi pemahaman materi training karyawan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <Card hoverable className="space-y-4 border-blue-100 bg-white shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0000FF] flex items-center justify-center font-bold border border-blue-200">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Realtime Live Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Sinkronisasi soal real-time, timer server anti-refresh, dan grafik distribusi jawaban kelas.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card hoverable className="space-y-4 border-blue-100 bg-white shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">3D Grand Podium</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Papan peringkat live serta animasi podium pemenang 3D (3rd, 2nd, 1st place) lengkap dengan pesta kembang api confetti.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card hoverable className="space-y-4 border-blue-100 bg-white shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Training Analytics & Export</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Analisis tingkat kesulitan soal, persentase kelulusan kelas, dan pengunduhan rekap nilai dalam format Excel / CSV.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 bg-blue-50/50 border-t border-blue-100 text-center text-xs text-slate-500 font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">
              PT Multikarya Sinardinamika
            </span>
            <span>• Training Quiz System © 2026</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-500">
            <span>Corporate Edition v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
