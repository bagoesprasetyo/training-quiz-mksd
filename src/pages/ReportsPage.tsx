import React, { useEffect, useState } from 'react';
import { 
  FileSpreadsheet, 
  Download 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../services/supabase';
import { reportExportService } from '../services/reportExportService';

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalParticipants: 0,
    avgScore: 0,
    passRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      const [sessionsRes, participantsRes] = await Promise.all([
        supabase.from('live_sessions').select('*, quiz:quizzes(title, passing_grade)'),
        supabase.from('session_participants').select('*'),
      ]);

      const sessions = sessionsRes.data || [];
      const participants = participantsRes.data || [];

      const totalSessions = sessions.length;
      const totalParticipants = participants.length;
      
      const totalScoreSum = participants.reduce((acc, p) => acc + (p.total_score || 0), 0);
      const avgScore = totalParticipants > 0 ? Math.round(totalScoreSum / totalParticipants) : 0;

      // Calculate pass rate
      const passedCount = participants.filter((p) => {
        const accuracy = Math.round((p.correct_count / 10) * 100);
        return accuracy >= 70;
      }).length;
      const passRate = totalParticipants > 0 ? Math.round((passedCount / totalParticipants) * 100) : 0;

      setMetrics({
        totalSessions,
        totalParticipants,
        avgScore,
        passRate,
      });

      setRecentSessions(sessions.slice(0, 5));
    } catch (err) {
      console.error('Failed to load reports metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    if (recentSessions.length === 0) return;
    const sessionToExport = recentSessions[0];
    const { data: participants } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionToExport.id);

    reportExportService.exportSessionToCSV(sessionToExport, participants || [], 10);
  };

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Corporate Training Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            System-wide metrics, participant accuracy breakdown, and export tools.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportAll}
          disabled={recentSessions.length === 0}
        >
          Export Recent Report (CSV)
        </Button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Training Sessions</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{metrics.totalSessions}</p>
          <p className="text-xs text-slate-400 font-medium">Across all departments</p>
        </Card>

        <Card className="p-5 border-slate-200/80 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees Trained</p>
          <p className="text-3xl font-black text-[#0000FF] tracking-tight">{metrics.totalParticipants}</p>
          <p className="text-xs text-slate-400 font-medium">Session participants</p>
        </Card>

        <Card className="p-5 border-slate-200/80 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</p>
          <p className="text-3xl font-black text-emerald-600 tracking-tight">{metrics.avgScore}</p>
          <p className="text-xs text-slate-400 font-medium">Points per participant</p>
        </Card>

        <Card className="p-5 border-slate-200/80 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Pass Rate</p>
          <p className="text-3xl font-black text-purple-600 tracking-tight">{metrics.passRate}%</p>
          <p className="text-xs text-slate-400 font-medium">Met passing grade threshold</p>
        </Card>
      </div>

      {/* RECENT SESSIONS EXPORT LIST */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">
          Exportable Training Reports
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading reports...</div>
        ) : recentSessions.length === 0 ? (
          <Card className="py-12 text-center text-slate-400">No session reports available yet.</Card>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((s) => (
              <Card key={s.id} hoverable className="p-4 flex items-center justify-between gap-4 border-slate-200/80">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0000FF] font-bold flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {s.quiz?.title || 'Training Session'} (PIN: {s.pin_code})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Date: {new Date(s.created_at).toLocaleDateString()} • Passing Threshold: {s.quiz?.passing_grade || 70}%
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
                  onClick={async () => {
                    const { data: pList } = await supabase
                      .from('session_participants')
                      .select('*')
                      .eq('session_id', s.id);
                    reportExportService.exportSessionToCSV(s, pList || [], 10);
                  }}
                >
                  Download CSV Report
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
