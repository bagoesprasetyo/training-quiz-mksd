import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Radio, 
  Users, 
  Award, 
  PlusCircle, 
  HelpCircle, 
  Play, 
  TrendingUp 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock initial stats for dashboard shell UI
  const stats = [
    { title: 'Total Quizzes', value: '12', change: '+2 this week', icon: BookOpen, color: 'text-[#0000FF] bg-blue-50' },
    { title: 'Live Sessions Held', value: '48', change: '+8 this month', icon: Radio, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Participants Trained', value: '1,240', change: '+180 employees', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { title: 'Avg. Pass Accuracy', value: '84.2%', change: '+3.5% vs last batch', icon: Award, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Trainer'} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage corporate training quizzes, launch live sessions, and track participant scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="md"
            leftIcon={<HelpCircle className="w-4 h-4 text-[#0000FF]" />}
            onClick={() => navigate('/dashboard/questions')}
          >
            Question Bank
          </Button>

          <Button 
            variant="primary" 
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/quiz/new')}
          >
            Create New Quiz
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="flex items-center justify-between p-5 border-blue-100 bg-white shadow-soft">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border border-blue-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* RECENT QUIZZES & LIVE SESSIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Recent Quizzes */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Recent Quizzes</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#0000FF] font-bold"
              onClick={() => navigate('/dashboard/quiz')}
            >
              View All Quizzes →
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { id: '1', title: 'Industrial Safety & APAR Protocol 2026', questions: 15, duration: '20 min', status: 'published', category: 'Safety' },
              { id: '2', title: 'ISO 9001 Quality Management Essentials', questions: 20, duration: '30 min', status: 'published', category: 'ISO Standards' },
              { id: '3', title: 'Cybersecurity Awareness for Plant Staff', questions: 10, duration: '15 min', status: 'draft', category: 'IT Security' },
            ].map((quiz) => (
              <Card key={quiz.id} hoverable className="p-4 flex items-center justify-between gap-4 border-blue-100 bg-white shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0000FF] font-bold flex items-center justify-center shrink-0 border border-blue-200">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm hover:text-[#0000FF] transition-colors">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
                      <span>{quiz.questions} Questions</span>
                      <span>•</span>
                      <span>{quiz.duration}</span>
                      <span>•</span>
                      <Badge variant="brand" size="sm">{quiz.category}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={quiz.status === 'published' ? 'success' : 'warning'} size="sm">
                    {quiz.status}
                  </Badge>

                  <Button 
                    variant="primary" 
                    size="sm"
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/dashboard/quiz/${quiz.id}`)}
                  >
                    Start Session
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Quick Launch & Active Sessions */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Quick Live Launch</h2>
          
          <Card className="bg-gradient-to-br from-[#0000FF] to-blue-700 text-white p-6 space-y-4 shadow-lg shadow-blue-500/20">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ready to Train?</h3>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed font-medium">
                Launch an interactive session now. Participants can join instantly via 6-digit PIN or QR Code.
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full font-bold text-slate-900 bg-white hover:bg-slate-100"
              onClick={() => navigate('/dashboard/quiz')}
            >
              Select Quiz & Start
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
