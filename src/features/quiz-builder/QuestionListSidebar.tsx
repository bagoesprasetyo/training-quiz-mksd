import React, { useState } from 'react';
import { 
  PlusCircle, 
  Copy, 
  Trash2, 
  Image as ImageIcon, 
  Clock,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useQuizBuilderStore } from '../../store/quizBuilderStore';
import type { QuestionType } from '../../types';

export const QuestionListSidebar: React.FC = () => {
  const { 
    questions, 
    activeQuestionIndex, 
    setActiveQuestionIndex, 
    addQuestion, 
    duplicateQuestion, 
    deleteQuestion 
  } = useQuizBuilderStore();

  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const questionTypes: { type: QuestionType; label: string }[] = [
    { type: 'multiple_choice', label: 'Pilihan Ganda (Single Choice)' },
    { type: 'true_false', label: 'Benar / Salah (True/False)' },
    { type: 'multiple_answer', label: 'Pilihan Kompleks (Multi Answer)' },
    { type: 'poll', label: 'Jajak Pendapat (Poll/Survey)' },
    { type: 'short_answer', label: 'Isian Singkat (Short Answer)' },
    { type: 'essay', label: 'Esai / Uraian (Essay)' },
    { type: 'fill_blank', label: 'Isian Dalam Teks (Fill Blank)' },
    { type: 'matching', label: 'Pasangan (Matching)' },
    { type: 'ordering', label: 'Urutan (Ordering)' },
  ];

  const handleAddQuestionType = (type: QuestionType) => {
    addQuestion(type);
    setShowTypeMenu(false);
  };

  return (
    <aside className="w-72 border-r border-blue-100 bg-white flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0">
      
      {/* Header & Add Button */}
      <div className="p-4 border-b border-blue-100 flex items-center justify-between bg-white relative">
        <div>
          <h3 className="font-black text-slate-900 text-sm">Daftar Soal</h3>
          <p className="text-[11px] text-slate-500 font-bold">{questions.length} Soal Pertanyaan</p>
        </div>

        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            rightIcon={<ChevronDown className="w-3.5 h-3.5 ml-1" />}
            onClick={() => setShowTypeMenu(!showTypeMenu)}
          >
            + Soal
          </Button>

          {/* QUESTION TYPE SELECTION DROPDOWN */}
          {showTypeMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-blue-100 rounded-2xl shadow-elevated z-50 p-2 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2.5 py-1 block border-b border-blue-50">
                Pilih Tipe Soal
              </span>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {questionTypes.map((qt) => (
                  <button
                    key={qt.type}
                    onClick={() => handleAddQuestionType(qt.type)}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#0000FF] hover:bg-blue-50/60 rounded-xl transition-colors cursor-pointer"
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/40">
        {questions.map((q, idx) => {
          const isActive = idx === activeQuestionIndex;

          return (
            <div
              key={q.id || idx}
              onClick={() => setActiveQuestionIndex(idx)}
              className={`
                group relative rounded-2xl p-3.5 border-2 transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-white border-[#0000FF] shadow-soft' 
                  : 'bg-white border-blue-100 hover:border-blue-300'
                }
              `}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`
                    w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center
                    ${isActive 
                      ? 'bg-[#0000FF] text-white' 
                      : 'bg-blue-50 text-[#0000FF]'
                    }
                  `}>
                    {idx + 1}
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {q.question_type.replace('_', ' ')}
                  </span>
                </div>

                {/* Question Item Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateQuestion(idx);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    title="Duplikat Soal"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {questions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(idx);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Preview Snippet */}
              <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                {q.question_text || 'Pertanyaan Baru'}
              </p>

              {/* Bottom Indicators */}
              <div className="mt-2.5 pt-2 border-t border-blue-50 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-[#0000FF]" /> {q.time_limit}s
                  </span>
                  <span>•</span>
                  <span>{q.options?.length || 0} Pilihan</span>
                </div>

                {q.media_url && (
                  <span title="Ada Gambar Soal">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0000FF]" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
