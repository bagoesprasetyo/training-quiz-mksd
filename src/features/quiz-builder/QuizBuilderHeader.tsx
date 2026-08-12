import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Eye,
  X,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useQuizBuilderStore } from '../../store/quizBuilderStore';
import { useToast } from '../../components/ui/ToastProvider';

export const QuizBuilderHeader: React.FC = () => {
  const navigate = useNavigate();
  const { 
    quiz, 
    questions,
    activeQuestionIndex,
    autoSaveStatus, 
    lastSavedAt, 
    updateQuizTitle, 
    saveQuiz, 
    publishQuiz 
  } = useQuizBuilderStore();
  const { showToast } = useToast();

  const [showPreview, setShowPreview] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!quiz) return null;

  const currentQ = questions[activeQuestionIndex];

  return (
    <>
      <header className="h-16 border-b border-blue-100 bg-white px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        
        {/* Left: Back Button & Editable Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/quiz')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Keluar ke Pengelolaan Kuis"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0000FF] flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            
            {/* Editable Quiz Title */}
            <div className="flex flex-col">
              <input
                type="text"
                value={quiz.title}
                onChange={(e) => updateQuizTitle(e.target.value)}
                className="font-black text-slate-900 text-base bg-transparent border-b border-transparent hover:border-blue-200 focus:border-[#0000FF] focus:outline-none transition-colors px-1 py-0.5"
                placeholder="Tulis Judul Kuis..."
              />
              
              {/* Auto Save Status Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 font-semibold">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <span>Menyimpan perubahan...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Tersimpan {lastSavedAt ? `pukul ${lastSavedAt}` : ''}</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-red-500 font-bold">Gagal menyimpan</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions (Preview, Save, Publish) */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="w-4 h-4 text-[#0000FF]" />}
            onClick={() => {
              setSelectedOption(null);
              setShowPreview(true);
            }}
          >
            Preview Soal
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={async () => {
              const ok = await saveQuiz();
              if (ok) {
                showToast('Draft kuis dan seluruh pertanyaan berhasil disimpan!', 'success');
              }
            }}
          >
            Simpan Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={async () => {
              await publishQuiz();
              showToast('Kuis berhasil dipublikasikan dan siap digunakan!', 'success');
            }}
          >
            {quiz.status === 'published' ? 'Sudah Terbit' : 'Publikasikan Kuis'}
          </Button>
        </div>
      </header>

      {/* INTERACTIVE QUESTION PREVIEW MODAL */}
      {showPreview && currentQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-2xl p-6 space-y-6 shadow-elevated bg-white rounded-3xl border-2 border-blue-100 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0000FF]" />
                <h3 className="text-lg font-black text-slate-900">
                  Pratinjau Layar Peserta (Soal #{activeQuestionIndex + 1})
                </h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Info Bar */}
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0000FF]" /> Timer: {currentQ.time_limit} Detik
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> Points: {currentQ.custom_points || 100} Pt
              </span>
              <span className="uppercase text-[#0000FF]">
                Tipe: {currentQ.question_type.replace('_', ' ')}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {currentQ.question_text || 'Pertanyaan Kuis'}
              </h2>

              {/* Question Image if present */}
              {currentQ.media_url && (
                <div className="rounded-2xl overflow-hidden border border-blue-100 max-h-56 flex items-center justify-center bg-slate-50 p-2">
                  <img src={currentQ.media_url} alt="Media Soal" className="max-h-52 object-contain rounded-xl" />
                </div>
              )}
            </div>

            {/* Answer Options Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(currentQ.options || []).map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === opt.id;

                return (
                  <button
                    key={opt.id || idx}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`
                      p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all duration-150 cursor-pointer flex items-center gap-3
                      ${isSelected 
                        ? 'bg-blue-50 border-[#0000FF] text-[#0000FF] shadow-md ring-2 ring-blue-500/20' 
                        : 'bg-white border-blue-100 text-slate-800 hover:border-blue-300'
                      }
                    `}
                  >
                    <span className={`
                      w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0
                      ${isSelected ? 'bg-[#0000FF] text-white' : 'bg-blue-50 text-[#0000FF]'}
                    `}>
                      {letter}
                    </span>
                    <span className="flex-1">{opt.option_text}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation Preview */}
            {currentQ.explanation && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
                <span className="font-extrabold text-amber-900 block mb-0.5">💡 Pembahasan:</span>
                {currentQ.explanation}
              </div>
            )}

            <div className="pt-2 text-center">
              <Button variant="primary" size="md" onClick={() => setShowPreview(false)}>
                Tutup Pratinjau
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
