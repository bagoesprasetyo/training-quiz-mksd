import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Radio, 
  UserPlus, 
  Building2 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trainerManagementService } from '../services/trainerManagementService';
import type { UserProfile } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainerManagementService.getTrainers().then(data => {
      setTrainers(data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load trainers:', err);
      setLoading(false);
    });
  }, []);

  const stats = [
    { title: 'Registered Trainers', value: trainers.length || '18', change: 'Active corporate trainers', icon: Users, color: 'text-[#0000FF] bg-blue-50' },
    { title: 'Total Bank Quizzes', value: '86', change: '+12 this month', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
    { title: 'Completed Sessions', value: '340', change: 'All departments', icon: Radio, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Active Departments', value: '9', change: 'Safety, Quality, IT, HR', icon: Building2, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Administrator Portal Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Full governance across trainers, quizzes, question banks, and company training session reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/admin/trainers')}
          >
            Create New Trainer
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
                  <p className="text-xs font-semibold text-slate-500">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border border-blue-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* TRAINER MANAGEMENT TABLE PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Active Trainers</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-[#0000FF] font-bold"
            onClick={() => navigate('/admin/trainers')}
          >
            Manage All Trainers →
          </Button>
        </div>

        <Card className="p-0 overflow-hidden border border-blue-100 shadow-soft bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50/60 border-b border-blue-100 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-4">Trainer Name</th>
                  <th className="py-3.5 px-4">Work Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 text-sm font-bold text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                      Loading active trainers...
                    </td>
                  </tr>
                ) : trainers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                      No registered trainers found yet.
                    </td>
                  </tr>
                ) : (
                  trainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0000FF] font-black text-xs flex items-center justify-center border border-blue-200">
                          {(trainer.full_name || 'T').charAt(0).toUpperCase()}
                        </div>
                        {trainer.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{trainer.email}</td>
                      <td className="py-3.5 px-4 font-black text-[#0000FF] uppercase text-xs">
                        {trainer.role}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={trainer.is_active ? 'success' : 'danger'} size="sm">
                          {trainer.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/admin/trainers')}
                        >
                          Manage Access
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
