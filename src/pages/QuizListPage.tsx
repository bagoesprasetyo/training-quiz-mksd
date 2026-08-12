import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  PlusCircle, 
  Search, 
  Edit3, 
  Copy, 
  Trash2, 
  Filter,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { quizService } from '../services/quizService';
import { liveSessionService } from '../services/liveSessionService';
import { useToast } from '../components/ui/ToastProvider';
import type { Quiz } from '../types';

export const QuizListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, confirm } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, [search, statusFilter]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizService.getQuizzes(search, statusFilter);
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await quizService.createQuiz({ title: newTitle.trim() });
      setIsCreating(false);
      setNewTitle('');
      navigate(`/dashboard/quiz/${created.id}`);
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat kuis baru', 'error');
    }
  };

  const handleDuplicate = async (quizId: string) => {
    try {
      await quizService.duplicateQuiz(quizId);
      showToast('Kuis berhasil diduplikat!', 'success');
      fetchQuizzes();
    } catch (err: any) {
      showToast(err.message || 'Gagal menduplikat kuis', 'error');
    }
  };

  const handleDelete = async (quizId: string) => {
    const ok = await confirm({
      title: 'Hapus Kuis',
      message: 'Apakah Anda yakin ingin menghapus kuis ini? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await quizService.deleteQuiz(quizId);
      showToast('Kuis berhasil dihapus.', 'success');
      fetchQuizzes();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kuis', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quiz Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Create, manage, and edit training quiz templates.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsCreating(true)}
        >
          Create New Quiz
        </Button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
            {['all', 'published', 'draft'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`
                  px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer
                  ${statusFilter === st 
                    ? 'bg-[#0000FF] text-white font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                  }
                `}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUIZZES GRID */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <Card className="py-16 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Quizzes Found</h3>
          <p className="text-xs text-slate-400">Get started by creating your first training quiz.</p>
          <Button variant="primary" size="sm" onClick={() => setIsCreating(true)}>
            Create Quiz
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card hoverable className="p-6 flex flex-col justify-between h-full space-y-5 border-slate-200/80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={quiz.status === 'published' ? 'success' : 'warning'} size="sm">
                      {quiz.status}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-400">
                      Passing: {quiz.passing_grade}%
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-tight">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {quiz.description || 'No description provided for this training quiz.'}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{quiz.questions_count || 0} Questions</span>
                    <span>Updated {new Date(quiz.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {quiz.status === 'published' && (
                      <Button
                        variant="accent"
                        size="sm"
                        leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                        onClick={async () => {
                          try {
                            const newSession = await liveSessionService.createSession(quiz.id);
                            navigate(`/live/${newSession.id}`);
                          } catch (err: any) {
                            showToast(err.message || 'Gagal memulai sesi live', 'error');
                          }
                        }}
                      >
                        Live Session
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 font-bold"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/dashboard/quiz/${quiz.id}`)}
                    >
                      Edit Quiz
                    </Button>

                    <button
                      onClick={() => handleDuplicate(quiz.id)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-blue-100 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center font-bold border border-blue-100">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Buat Kuis Baru</h3>
                <p className="text-xs text-slate-500 font-medium">Masukkan judul kuis untuk membuka Visual Builder</p>
              </div>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <Input
                label="Judul Kuis *"
                placeholder="Contoh: Kuis Pelatihan K3 & Safety Guidelines"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                required
              />

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="md" 
                  className="flex-1 font-bold"
                  onClick={() => setIsCreating(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  className="flex-1 font-extrabold"
                >
                  Buka Visual Builder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
