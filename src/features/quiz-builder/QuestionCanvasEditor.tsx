import React, { useRef } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Upload,
  HelpCircle,
  X,
  ArrowUp,
  ArrowDown,
  FileText,
  BarChart2,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useQuizBuilderStore } from '../../store/quizBuilderStore';
import { useToast } from '../../components/ui/ToastProvider';

export const QuestionCanvasEditor: React.FC = () => {
  const { 
    questions, 
    activeQuestionIndex, 
    updateActiveQuestion, 
    updateOption, 
    addOption, 
    deleteOption, 
    setCorrectOption 
  } = useQuizBuilderStore();

  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeQ = questions[activeQuestionIndex];

  if (!activeQ) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500 font-semibold">
        Pilih atau tambahkan soal untuk mulai mengedit.
      </div>
    );
  }

  const qType = activeQ.question_type;
  const options = activeQ.options || [];

  // Direct File Upload Handler (Data URL / FileReader)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file melebihi batas maksimum 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateActiveQuestion({
        media_url: dataUrl,
        media_type: 'image',
      });
    };
    reader.readAsDataURL(file);
  };

  // Option Image Upload Handler
  const handleOptionFileUpload = (optIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateOption(optIdx, { option_image_url: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Reorder options for Ordering Type
  const moveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOptions.length) return;

    const temp = newOptions[index];
    newOptions[index] = newOptions[targetIdx];
    newOptions[targetIdx] = temp;

    // update sort orders
    newOptions.forEach((opt, i) => {
      updateOption(i, { option_text: opt.option_text, sort_order: i });
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-4xl mx-auto bg-white">
      
      {/* 1. QUESTION TEXT CANVAS INPUT */}
      <Card className="p-6 border-2 border-blue-100 shadow-soft bg-white space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#0000FF]">
            Editor Soal #{activeQuestionIndex + 1}
          </span>
          <span className="text-xs font-bold text-[#0000FF] uppercase px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
            Tipe: {qType.replace('_', ' ')}
          </span>
        </div>

        <textarea
          rows={3}
          value={activeQ.question_text}
          onChange={(e) => updateActiveQuestion({ question_text: e.target.value })}
          placeholder="Tulis soal pertanyaan di sini..."
          className="w-full text-xl md:text-2xl font-black text-slate-900 bg-transparent border-0 focus:outline-none resize-none placeholder:text-slate-400 placeholder:font-normal leading-snug"
        />

        {/* MEDIA UPLOAD ATTACHMENT AREA */}
        <div className="pt-4 border-t border-blue-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#0000FF]" /> Gambar / Media Soal
            </label>
            {activeQ.media_url && (
              <button
                onClick={() => updateActiveQuestion({ media_url: '', media_type: undefined })}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Hapus Gambar
              </button>
            )}
          </div>

          {activeQ.media_url ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-50/20 max-h-64 flex items-center justify-center p-2 group">
              <img 
                src={activeQ.media_url} 
                alt="Question Media Preview" 
                className="max-h-60 object-contain rounded-xl shadow-xs"
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="question-media-upload"
              />

              <label
                htmlFor="question-media-upload"
                className="flex-1 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-blue-200 hover:border-[#0000FF] bg-blue-50/30 hover:bg-blue-50/70 text-slate-700 hover:text-[#0000FF] font-bold text-xs cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4 text-[#0000FF]" />
                <span>Upload Gambar dari Perangkat (PNG / JPG / WebP)</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* 2. DYNAMIC ANSWER EDITOR CANVAS BASED ON QUESTION TYPE */}
      
      {/* CASE A: BENAR / SALAH (TRUE / FALSE) */}
      {qType === 'true_false' && (
        <div className="space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
            Pilih Kunci Jawaban Benar
          </label>
          <div className="grid grid-cols-2 gap-4">
            {['Benar (True)', 'Salah (False)'].map((label, idx) => {
              const isCorrect = idx === 0 ? (options[0]?.is_correct ?? true) : (options[1]?.is_correct ?? false);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    updateOption(0, { option_text: 'Benar', is_correct: idx === 0 });
                    if (options[1]) {
                      updateOption(1, { option_text: 'Salah', is_correct: idx === 1 });
                    }
                  }}
                  className={`
                    p-6 rounded-2xl border-2 font-black text-lg flex items-center justify-between transition-all cursor-pointer
                    ${isCorrect 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' 
                      : 'bg-white border-blue-100 text-slate-600 hover:border-blue-200'
                    }
                  `}
                >
                  <span>{label}</span>
                  {isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CASE B: PILIHAN GANDA (SINGLE / MULTI ANSWER / POLL) */}
      {(qType === 'multiple_choice' || qType === 'multiple_answer' || qType === 'poll') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {qType === 'poll' 
                ? 'Pilihan Opsi Jajak Pendapat / Survey (Tanpa kunci jawaban)' 
                : qType === 'multiple_answer' 
                  ? 'Pilihan Ganda Kompleks (Bisa memilih LEBIH DARI 1 jawaban benar)' 
                  : 'Pilihan Ganda (Klik huruf untuk menentukan 1 Kunci Jawaban Benar)'}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {options.length} / 8 Pilihan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isCorrect = opt.is_correct;

              return (
                <div
                  key={opt.id || optIdx}
                  className={`
                    relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-200 space-y-3
                    ${isCorrect && qType !== 'poll'
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-md' 
                      : 'bg-white border-blue-100 hover:border-blue-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {qType !== 'poll' && (
                      <button
                        type="button"
                        onClick={() => setCorrectOption(optIdx, qType === 'multiple_answer')}
                        className={`
                          w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer
                          ${isCorrect 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                            : 'bg-blue-50 text-slate-700 hover:bg-blue-100 hover:text-[#0000FF]'
                          }
                        `}
                        title={isCorrect ? 'Jawaban Benar' : 'Tandai sebagai Jawaban Benar'}
                      >
                        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : letter}
                      </button>
                    )}

                    {qType === 'poll' && (
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0000FF] font-black text-xs flex items-center justify-center border border-blue-100 shrink-0">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                    )}

                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={(e) => updateOption(optIdx, { option_text: e.target.value })}
                      placeholder={`Jawaban Opsi ${letter}...`}
                      className="flex-1 font-bold text-slate-900 bg-transparent text-sm border-0 focus:outline-none placeholder:text-slate-400"
                    />

                    <label 
                      className="p-2 border border-blue-100 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-[#0000FF] cursor-pointer"
                      title="Upload Gambar Jawaban"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionFileUpload(optIdx, e)}
                        className="hidden"
                      />
                    </label>

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => deleteOption(optIdx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {opt.option_image_url && (
                    <div className="relative rounded-xl overflow-hidden border border-blue-100 max-h-32 bg-slate-50 flex items-center justify-center p-1">
                      <img 
                        src={opt.option_image_url} 
                        alt={`Option ${letter} Attachment`} 
                        className="max-h-28 object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {options.length < 8 && (
            <button
              type="button"
              onClick={() => addOption()}
              className="w-full py-3.5 border-2 border-dashed border-blue-200 hover:border-[#0000FF] bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl font-bold text-slate-700 hover:text-[#0000FF] flex items-center justify-center gap-2 text-sm transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pilihan Jawaban</span>
            </button>
          )}
        </div>
      )}

      {/* CASE C: ISIAN SINGKAT (SHORT ANSWER) & FILL IN THE BLANK */}
      {(qType === 'short_answer' || qType === 'fill_blank') && (
        <Card className="p-6 border-2 border-blue-100 space-y-3 bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0000FF]" />
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Kata Kunci Kunci Jawaban Benar
            </label>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Tulis kata kunci / jawaban pasti yang harus diisi peserta (sistem akan mencocokkan teks jawaban):
          </p>
          <input
            type="text"
            value={options[0]?.option_text || ''}
            onChange={(e) => updateOption(0, { option_text: e.target.value, is_correct: true })}
            placeholder="Contoh Kunci Jawaban: APAR Type A"
            className="w-full text-base font-bold p-3 rounded-xl border-2 border-blue-100 bg-blue-50/20 text-slate-900 focus:outline-none focus:border-[#0000FF]"
          />
        </Card>
      )}

      {/* CASE D: ESAI / URAIAN (ESSAY) */}
      {qType === 'essay' && (
        <Card className="p-6 border-2 border-blue-100 space-y-3 bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0000FF]" />
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Rubrik Penilaian & Panduan Jawaban Esai
            </label>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Peserta akan diberikan kotak teks besar untuk mengetik uraian. Tulis poin-poin rubrik penilaian di bawah:
          </p>
          <textarea
            rows={3}
            value={options[0]?.option_text || ''}
            onChange={(e) => updateOption(0, { option_text: e.target.value, is_correct: true })}
            placeholder="Panduan Penilaian: Peserta wajib menjelaskan 3 langkah prosedur APAR..."
            className="w-full text-sm font-semibold p-3 rounded-xl border-2 border-blue-100 bg-blue-50/20 text-slate-900 focus:outline-none focus:border-[#0000FF]"
          />
        </Card>
      )}

      {/* CASE E: PASANGAN / MENJODOHKAN (MATCHING) */}
      {qType === 'matching' && (
        <div className="space-y-4">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
            Atur Pasangan Soal & Jawaban (Matching Pairs)
          </label>

          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={opt.id || idx} className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-blue-100 bg-white">
                <input
                  type="text"
                  value={opt.option_text}
                  onChange={(e) => updateOption(idx, { option_text: e.target.value })}
                  placeholder={`Item Pernyataan Kiri ${idx + 1}...`}
                  className="flex-1 font-bold text-sm text-slate-900 bg-transparent border-b border-slate-200 focus:border-[#0000FF] focus:outline-none py-1"
                />

                <ArrowRight className="w-4 h-4 text-[#0000FF] shrink-0" />

                <input
                  type="text"
                  value={opt.matching_pair || ''}
                  onChange={(e) => updateOption(idx, { matching_pair: e.target.value, is_correct: true })}
                  placeholder={`Pasangan Kanan ${idx + 1}...`}
                  className="flex-1 font-bold text-sm text-emerald-700 bg-emerald-50/50 rounded-xl p-2 border border-emerald-200 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {options.length < 8 && (
            <button
              type="button"
              onClick={() => addOption()}
              className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl font-bold text-xs text-slate-700 hover:text-[#0000FF] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pasangan Matching</span>
            </button>
          )}
        </div>
      )}

      {/* CASE F: URUTAN / ORDERING (SEQUENCE) */}
      {qType === 'ordering' && (
        <div className="space-y-4">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
            Urutan Kunci Jawaban Benar (Urutkan dari Langkah Pertama ke Terakhir)
          </label>

          <div className="space-y-2.5">
            {options.map((opt, idx) => (
              <div key={opt.id || idx} className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-blue-100 bg-white">
                <span className="w-7 h-7 rounded-xl bg-[#0000FF] text-white font-black text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={opt.option_text}
                  onChange={(e) => updateOption(idx, { option_text: e.target.value, is_correct: true })}
                  placeholder={`Langkah Ke-${idx + 1}...`}
                  className="flex-1 font-bold text-sm text-slate-900 bg-transparent border-0 focus:outline-none"
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveOption(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOption(idx, 'down')}
                    disabled={idx === options.length - 1}
                    className="p-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {options.length < 8 && (
            <button
              type="button"
              onClick={() => addOption()}
              className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl font-bold text-xs text-slate-700 hover:text-[#0000FF] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Langkah Urutan</span>
            </button>
          )}
        </div>
      )}

      {/* 3. EXPLANATION BOX */}
      <Card className="p-5 border-blue-100 space-y-2 bg-white">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#0000FF]" />
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Penjelasan / Pembahasan Soal (Opsional)
          </label>
        </div>
        <textarea
          rows={2}
          value={activeQ.explanation || ''}
          onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
          placeholder="Tambahkan pembahasan atau penjelasan kunci jawaban yang akan ditampilkan setelah peserta menjawab..."
          className="w-full text-xs font-semibold p-3 rounded-xl border border-blue-100 bg-white text-slate-900 focus:outline-none focus:border-[#0000FF] placeholder:text-slate-400 placeholder:font-normal"
        />
      </Card>
    </div>
  );
};
