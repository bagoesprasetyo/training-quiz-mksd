import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  Search, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { supabase } from '../services/supabase';
import { reportExportService } from '../services/reportExportService';
import { useToast } from '../components/ui/ToastProvider';

export const SessionHistoryPage: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [search]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('live_sessions')
        .select('*, quiz:quizzes(title, passing_grade), participants:session_participants(count)')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch session history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSession = async (sessionData: any) => {
    try {
      const { data: participants } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionData.id);

      reportExportService.exportSessionToCSV(sessionData, participants || [], 10);
      showToast('Laporan berhasil diekspor ke CSV!', 'success');
    } catch (err: any) {
      showToast('Gagal mengekspor laporan: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Live Session History
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Review past corporate training sessions and export participant scores.
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-md">
        <Input
          placeholder="Search by quiz title or PIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* SESSIONS TABLE */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 font-bold">Loading session history...</div>
      ) : sessions.length === 0 ? (
        <Card className="py-16 text-center space-y-4 border-2 border-blue-100">
          <Radio className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-800">No Session History Yet</h3>
          <p className="text-xs text-slate-500 font-medium">Launch a live session from Quiz Management to record session results.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-blue-100 text-xs font-black uppercase tracking-wider text-slate-900">
                  <th className="py-4 px-5">Quiz Title</th>
                  <th className="py-4 px-5">PIN Code</th>
                  <th className="py-4 px-5">Session Date</th>
                  <th className="py-4 px-5">Participants</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-5 font-black text-slate-900 text-sm">
                      {s.quiz?.title || 'Training Quiz'}
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-mono font-black text-[#0000FF] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 text-xs shadow-2xs">
                        {s.pin_code}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-800 font-bold text-xs">
                      {new Date(s.created_at).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-5 font-black text-slate-900">
                      {s.participants?.[0]?.count || 0} Employees
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={s.status === 'finished' ? 'success' : s.status === 'in_progress' ? 'brand' : 'warning'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
                        onClick={() => handleExportSession(s)}
                      >
                        Export CSV
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-extrabold text-[#0000FF] border border-blue-200 hover:bg-blue-50"
                        leftIcon={<ExternalLink className="w-3.5 h-3.5 text-[#0000FF]" />}
                        onClick={() => window.open(`/live/${s.id}`, '_blank')}
                      >
                        View Session
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
