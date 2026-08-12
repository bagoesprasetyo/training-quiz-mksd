import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  Search, 
  FolderPlus, 
  Trash2 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { questionService } from '../services/questionService';
import { useToast } from '../components/ui/ToastProvider';
import type { Question, Category } from '../types';

export const QuestionBankPage: React.FC = () => {
  const { showToast, confirm } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State for new Bank Question
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('multiple_choice');
  const [qCatId, setQCatId] = useState('');
  const [qDiff, setQDiff] = useState('medium');

  useEffect(() => {
    loadData();
  }, [selectedCategory, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, qList] = await Promise.all([
        questionService.getCategories(),
        questionService.getBankQuestions(selectedCategory || undefined, search || undefined),
      ]);
      setCategories(cats);
      setQuestions(qList);
    } catch (err) {
      console.error('Failed to load question bank data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await questionService.createCategory({ name: newCatName.trim() });
      setNewCatName('');
      setIsAddingCategory(false);
      showToast('Kategori berhasil dibuat!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat kategori', 'error');
    }
  };

  const handleCreateBankQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    try {
      await questionService.createQuestion(
        {
          question_text: qText.trim(),
          question_type: qType as any,
          category_id: qCatId || undefined,
          difficulty: qDiff as any,
          is_bank_question: true,
          points_type: 'standard',
          custom_points: 100,
          time_limit: 30,
        },
        [
          { option_text: 'Option A (Correct)', is_correct: true, sort_order: 0 },
          { option_text: 'Option B', is_correct: false, sort_order: 1 },
          { option_text: 'Option C', is_correct: false, sort_order: 2 },
          { option_text: 'Option D', is_correct: false, sort_order: 3 },
        ]
      );
      setQText('');
      setIsAddingQuestion(false);
      showToast('Pertanyaan berhasil ditambahkan ke bank soal!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat pertanyaan', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus Pertanyaan',
      message: 'Apakah Anda yakin ingin menghapus pertanyaan ini dari bank soal?',
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await questionService.deleteQuestion(id);
      showToast('Pertanyaan berhasil dihapus.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pertanyaan', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Centralized Question Bank
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Reusable training questions library categorized by subject.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<FolderPlus className="w-4 h-4 text-purple-500" />}
            onClick={() => setIsAddingCategory(true)}
          >
            Add Category
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsAddingQuestion(true)}
          >
            Add Question to Bank
          </Button>
        </div>
      </div>

      {/* SEARCH AND CATEGORY FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <Input
            placeholder="Search questions in bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="md:col-span-6 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`
              px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border
              ${selectedCategory === '' 
                ? 'bg-[#0000FF] text-white border-[#0000FF]' 
                : 'bg-white text-slate-700 border-slate-200'
              }
            `}
          >
            All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border
                ${selectedCategory === cat.id 
                  ? 'bg-[#0000FF] text-white border-[#0000FF]' 
                  : 'bg-white text-slate-700 border-slate-200'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* QUESTION BANK LIST */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold">Loading Question Bank...</div>
      ) : questions.length === 0 ? (
        <Card className="py-16 text-center space-y-4">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Question Bank Empty</h3>
          <p className="text-xs text-slate-400">Add questions to your central library for reuse across quizzes.</p>
          <Button variant="primary" size="sm" onClick={() => setIsAddingQuestion(true)}>
            Add First Question
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id} hoverable className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200/80">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="brand" size="sm">{q.question_type.replace('_', ' ')}</Badge>
                  <Badge variant="outline" size="sm">Difficulty: {q.difficulty}</Badge>
                  <span className="text-xs text-slate-400">• {q.options?.length || 0} Choices</span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                  {q.question_text}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {q.options?.map((opt, i) => (
                    <span 
                      key={opt.id || i}
                      className={`
                        px-2 py-0.5 rounded-md border text-[11px] font-medium
                        ${opt.is_correct 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' 
                          : 'bg-slate-50 border-slate-200'
                        }
                      `}
                    >
                      {String.fromCharCode(65 + i)}. {opt.option_text}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 text-red-500"
                  title="Remove from Bank"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-blue-100 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center font-bold border border-blue-100">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Tambah Kategori Bank Soal</h3>
                <p className="text-xs text-slate-500 font-medium">Buat kategori baru untuk mengelompokkan soal kuis</p>
              </div>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                label="Nama Kategori *"
                placeholder="Contoh: Keselamatan Kerja / Quality Control ISO"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setIsAddingCategory(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" className="flex-1 font-extrabold">
                  Simpan Kategori
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BANK QUESTION MODAL */}
      {isAddingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-blue-100 p-6 space-y-5 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center font-bold border border-blue-100">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Tambah Soal ke Bank Soal</h3>
                <p className="text-xs text-slate-500 font-medium">Simpan pertanyaan ke perpustakaan pusat untuk dipakai berulang</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateBankQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Teks Pertanyaan *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik pertanyaan kuis di sini..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0000FF] focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tipe Soal
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:border-[#0000FF] transition-all cursor-pointer"
                  >
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="multiple_answer">Pilihan Kompleks</option>
                    <option value="poll">Poll / Survei</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={qCatId}
                    onChange={(e) => setQCatId(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:border-[#0000FF] transition-all cursor-pointer"
                  >
                    <option value="">Tanpa Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={qDiff}
                    onChange={(e) => setQDiff(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:border-[#0000FF] transition-all cursor-pointer"
                  >
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setIsAddingQuestion(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" className="flex-1 font-extrabold">
                  Simpan ke Bank Soal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
