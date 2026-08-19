import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './layouts/DashboardLayout';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/ToastProvider';

// Lazy-loaded Page Components for Code-Splitting and Optimized Performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const ParticipantJoinPage = lazy(() => import('./pages/ParticipantJoinPage').then(m => ({ default: m.ParticipantJoinPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const TrainerDashboard = lazy(() => import('./pages/TrainerDashboard').then(m => ({ default: m.TrainerDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const QuizListPage = lazy(() => import('./pages/QuizListPage').then(m => ({ default: m.QuizListPage })));
const QuizBuilderPage = lazy(() => import('./pages/QuizBuilderPage').then(m => ({ default: m.QuizBuilderPage })));
const QuestionBankPage = lazy(() => import('./pages/QuestionBankPage').then(m => ({ default: m.QuestionBankPage })));
const LiveSessionPage = lazy(() => import('./pages/LiveSessionPage').then(m => ({ default: m.LiveSessionPage })));
const ProjectorScreenView = lazy(() => import('./features/live-session/ProjectorScreenView').then(m => ({ default: m.ProjectorScreenView })));
const ParticipantSessionPage = lazy(() => import('./pages/ParticipantSessionPage').then(m => ({ default: m.ParticipantSessionPage })));
const SessionHistoryPage = lazy(() => import('./pages/SessionHistoryPage').then(m => ({ default: m.SessionHistoryPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TrainerManagementPage = lazy(() => import('./pages/TrainerManagementPage').then(m => ({ default: m.TrainerManagementPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Training Quiz System...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Standalone Routes WITHOUT Navbar (Landing, Login, Participant Game View) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/join" element={<ParticipantJoinPage />} />
            <Route path="/join/:sessionId" element={<ParticipantJoinPage />} />
            <Route path="/session/:sessionId" element={<ParticipantSessionPage />} />

            {/* Standalone Live Session Routes */}
            <Route path="/live/:sessionId" element={<LiveSessionPage />} />
            <Route path="/live/:sessionId/screen" element={<ProjectorScreenView />} />

            {/* Full Screen Visual Quiz Builder Route */}
            <Route path="/dashboard/quiz/:id" element={<QuizBuilderPage />} />

            {/* Authenticated Dashboard Routes (Trainer & Admin) */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<TrainerDashboard />} />
              <Route path="/dashboard/quiz" element={<QuizListPage />} />
              <Route path="/dashboard/questions" element={<QuestionBankPage />} />
              <Route path="/dashboard/sessions" element={<SessionHistoryPage />} />
              <Route path="/dashboard/reports" element={<ReportsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/trainers" element={<TrainerManagementPage />} />
              <Route path="/admin/quizzes" element={<QuizListPage />} />
              <Route path="/admin/questions" element={<QuestionBankPage />} />
              <Route path="/admin/sessions" element={<SessionHistoryPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
