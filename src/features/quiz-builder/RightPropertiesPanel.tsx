import React from 'react';
import { 
  Clock, 
  Award, 
  Sliders, 
  Shuffle,
  HelpCircle,
  BarChart2,
  FileText,
  Layers,
  ArrowDownUp
} from 'lucide-react';
import { useQuizBuilderStore } from '../../store/quizBuilderStore';
import type { QuestionType, QuestionDifficulty, PointsType } from '../../types';

export const RightPropertiesPanel: React.FC = () => {
  const { questions, activeQuestionIndex, updateActiveQuestion } = useQuizBuilderStore();
  const activeQ = questions[activeQuestionIndex];

  if (!activeQ) return null;

  const questionTypes: { type: QuestionType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: 'multiple_choice', label: 'Pilihan Ganda (Single Choice)', icon: HelpCircle },
    { type: 'true_false', label: 'Benar / Salah (True / False)', icon: Sliders },
    { type: 'multiple_answer', label: 'Pilihan Ganda Kompleks (Multi Answer)', icon: Layers },
    { type: 'poll', label: 'Jajak Pendapat (Poll / Survey)', icon: BarChart2 },
    { type: 'short_answer', label: 'Isian Singkat (Short Answer)', icon: FileText },
    { type: 'essay', label: 'Esai / Uraian (Essay)', icon: FileText },
    { type: 'fill_blank', label: 'Isian Dalam Teks (Fill in Blank)', icon: FileText },
    { type: 'matching', label: 'Pasangan / Menjodohkan (Matching)', icon: Layers },
    { type: 'ordering', label: 'Urutan (Ordering / Sequence)', icon: ArrowDownUp },
  ];

  const timeLimits = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180];

  return (
    <aside className="w-80 border-l border-blue-100 bg-white flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0 p-5 space-y-6 overflow-y-auto">
      
      <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
        <Sliders className="w-4 h-4 text-[#0000FF]" />
        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
          Pengaturan Soal
        </h3>
      </div>

      {/* 1. QUESTION TYPE SELECTION */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Tipe Pertanyaan Soal
        </label>
        <select
          value={activeQ.question_type}
          onChange={(e) => updateActiveQuestion({ question_type: e.target.value as QuestionType })}
          className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-blue-100 bg-blue-50/40 text-slate-900 focus:outline-none focus:border-[#0000FF]"
        >
          {questionTypes.map((qt) => (
            <option key={qt.type} value={qt.type}>
              {qt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. TIME LIMIT SELECTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0000FF]" /> Batas Waktu Wajib
          </label>
          <span className="text-xs font-black text-[#0000FF]">{activeQ.time_limit} Detik</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {timeLimits.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateActiveQuestion({ time_limit: t })}
              className={`
                py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center
                ${activeQ.time_limit === t 
                  ? 'bg-[#0000FF] text-white border-[#0000FF] shadow-xs' 
                  : 'bg-white border-blue-100 text-slate-700 hover:border-blue-300'
                }
              `}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      {/* 3. POINTS CONFIGURATION */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-500" /> Sistem Poin Jawaban
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'standard', label: 'Standar (100 Pt)' },
            { type: 'double_point', label: 'Ganda (200 Pt)' },
            { type: 'no_point', label: 'Tanpa Poin (0 Pt)' },
            { type: 'custom', label: 'Kustom' },
          ].map((pt) => (
            <button
              key={pt.type}
              type="button"
              onClick={() => {
                const points = pt.type === 'double_point' ? 200 : pt.type === 'no_point' ? 0 : 100;
                updateActiveQuestion({ points_type: pt.type as PointsType, custom_points: points });
              }}
              className={`
                p-2.5 text-left text-xs font-bold rounded-xl border transition-all cursor-pointer
                ${activeQ.points_type === pt.type 
                  ? 'bg-blue-50 border-[#0000FF] text-[#0000FF] font-black' 
                  : 'bg-white border-blue-100 text-slate-700 hover:border-blue-200'
                }
              `}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. DIFFICULTY LEVEL */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Tingkat Kesulitan
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'medium', 'hard'] as QuestionDifficulty[]).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => updateActiveQuestion({ difficulty: diff })}
              className={`
                py-2 text-xs font-black rounded-xl border capitalize transition-all cursor-pointer text-center
                ${activeQ.difficulty === diff 
                  ? 'bg-[#0000FF] text-white border-[#0000FF]' 
                  : 'bg-white border-blue-100 text-slate-700 hover:border-blue-200'
                }
              `}
            >
              {diff === 'easy' ? 'Mudah' : diff === 'medium' ? 'Sedang' : 'Sulit'}
            </button>
          ))}
        </div>
      </div>

      {/* 5. TOGGLE OPTIONS */}
      <div className="space-y-3 pt-3 border-t border-blue-100">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Opsi Jawaban
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/20 cursor-pointer">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Shuffle className="w-3.5 h-3.5 text-purple-600" />
            <span>Acak Urutan Pilihan</span>
          </div>
          <input
            type="checkbox"
            checked={activeQ.shuffle_answers || false}
            onChange={(e) => updateActiveQuestion({ shuffle_answers: e.target.checked })}
            className="w-4 h-4 rounded text-[#0000FF] focus:ring-[#0000FF]"
          />
        </label>
      </div>
    </aside>
  );
};
