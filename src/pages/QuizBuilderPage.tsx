import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { QuizBuilderHeader } from '../features/quiz-builder/QuizBuilderHeader';
import { QuestionListSidebar } from '../features/quiz-builder/QuestionListSidebar';
import { QuestionCanvasEditor } from '../features/quiz-builder/QuestionCanvasEditor';
import { RightPropertiesPanel } from '../features/quiz-builder/RightPropertiesPanel';
import { useQuizBuilderStore } from '../store/quizBuilderStore';
import { quizService } from '../services/quizService';
import { useToast } from '../components/ui/ToastProvider';

export const QuizBuilderPage: React.FC = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const { loadQuiz, loading, quiz } = useQuizBuilderStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (quizId === 'new') {
      // Auto-create new training quiz draft when navigating to /dashboard/quiz/new
      quizService.createQuiz({ title: 'New Training Quiz' })
        .then((created) => {
          navigate(`/dashboard/quiz/${created.id}`, { replace: true });
        })
        .catch((err: any) => {
          showToast(err.message || 'Gagal inisialisasi kuis baru', 'error');
          navigate('/dashboard/quiz');
        });
    } else if (quizId) {
      loadQuiz(quizId);
    }
  }, [quizId, loadQuiz, navigate]);

  if (loading || quizId === 'new') {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Opening Visual Quiz Builder...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="space-y-5 max-w-md p-8 border-2 border-blue-100 rounded-2xl shadow-elevated bg-white">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center mx-auto border border-blue-200">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">Create New Training Quiz</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Launch the 3-column Visual Quiz Builder workspace to design interactive questions, timers, and answer options.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => navigate('/dashboard/quiz')}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quiz List</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const created = await quizService.createQuiz({ title: 'New Corporate Training Quiz' });
                  navigate(`/dashboard/quiz/${created.id}`, { replace: true });
                } catch (err: any) {
                  showToast(err.message || 'Gagal membuat kuis baru', 'error');
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0000FF] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* HEADER */}
      <QuizBuilderHeader />

      {/* 3-COLUMN VISUAL BUILDER WORKSPACE (Responsive Stack on Mobile, 3-Column on Desktop) */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden min-h-0 bg-white">
        {/* LEFT SIDEBAR: Question List */}
        <QuestionListSidebar />

        {/* CENTER CANVAS: Visual Question Editor */}
        <QuestionCanvasEditor />

        {/* RIGHT SIDEBAR: Question Properties */}
        <RightPropertiesPanel />
      </div>
    </div>
  );
};
