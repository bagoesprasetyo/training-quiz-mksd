import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  User, 
  Lock, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { trainerManagementService } from '../services/trainerManagementService';
import { supabase, supabaseAdminAuth } from '../services/supabase';
import { useToast } from '../components/ui/ToastProvider';
import type { UserProfile } from '../types';

export const TrainerManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for creating new trainer
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const data = await trainerManagementService.getTrainers();
      setTrainers(data);
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (trainer: UserProfile) => {
    try {
      const newStatus = !trainer.is_active;
      await trainerManagementService.toggleTrainerStatus(trainer.id, newStatus);
      setTrainers(trainers.map(t => t.id === trainer.id ? { ...t, is_active: newStatus } : t));
      showToast(`Status trainer "${trainer.full_name}" berhasil diubah.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status trainer', 'error');
    }
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      setModalError('Semua field wajib diisi');
      return;
    }
    if (password.trim().length < 6) {
      setModalError('Password harus minimal 6 karakter');
      return;
    }

    try {
      setModalLoading(true);
      setModalError('');
      setSuccessNotice('');

      // Gunakan fungsi PostgreSQL create_trainer_confirmed yang membuat
      // akun auth.users dengan email_confirmed_at = NOW() secara langsung
      const { data: fnResult, error: fnError } = await supabase
        .rpc('create_trainer_confirmed', {
          trainer_email: email.trim().toLowerCase(),
          trainer_password: password.trim(),
          trainer_name: fullName.trim(),
        });

      if (fnError) throw fnError;

      const result = fnResult as { success: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || 'Gagal membuat akun trainer');
      }

      setIsModalOpen(false);
      setEmail('');
      setFullName('');
      setPassword('');
      setSuccessNotice(`Akun trainer "${fullName}" berhasil dibuat! Email sudah dikonfirmasi dan siap digunakan untuk login.`);
      await fetchTrainers();

    } catch (err: any) {
      // Fallback jika fungsi SQL belum dibuat: insert ke profiles & signUp biasa
      try {
        const { data: newProfile, error: profileErr } = await supabase
          .from('profiles')
          .insert({
            email: email.trim().toLowerCase(),
            full_name: fullName.trim(),
            role: 'trainer',
            is_active: true,
          })
          .select()
          .single();

        if (profileErr) throw profileErr;

        try {
          await supabaseAdminAuth.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            options: { data: { full_name: fullName.trim(), role: 'trainer' } },
          });
        } catch {
          // ignore auth errors
        }

        setIsModalOpen(false);
        setEmail('');
        setFullName('');
        setPassword('');
        setSuccessNotice(`Akun trainer "${fullName}" dibuat. Jalankan fix_rate_limit_and_fk.sql di Supabase SQL Editor agar bisa langsung login.`);
        if (newProfile) {
          setTrainers(prev => [newProfile as UserProfile, ...prev.filter(t => t.id !== newProfile.id)]);
        }
        await fetchTrainers();
      } catch (fallbackErr: any) {
        setModalError(fallbackErr.message || 'Gagal membuat akun trainer');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(t => 
    (t.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = trainers.filter(t => t.is_active).length;

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trainer Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Create corporate trainer accounts, control access, and manage trainer profiles.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create New Trainer
        </Button>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border-blue-100 bg-blue-50/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Trainers</p>
          <p className="text-3xl font-black text-[#0000FF]">{trainers.length}</p>
        </Card>

        <Card className="p-5 border-emerald-100 bg-emerald-50/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</p>
          <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
        </Card>

        <Card className="p-5 border-slate-200 bg-slate-50/50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disabled Accounts</p>
          <p className="text-3xl font-black text-slate-400">{trainers.length - activeCount}</p>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-md">
        <Input
          placeholder="Search trainer by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* TRAINERS TABLE */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold">Loading trainers list...</div>
      ) : filteredTrainers.length === 0 ? (
        <Card className="py-16 text-center space-y-3 border-blue-100">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Trainers Found</h3>
          <p className="text-xs text-slate-400">Click Create New Trainer to register a trainer account.</p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add Trainer
          </Button>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border border-blue-100 shadow-soft bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50/50 border-b border-blue-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Trainer Name</th>
                  <th className="py-3.5 px-4">Work Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                {filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0000FF] font-bold text-xs flex items-center justify-center border border-blue-200">
                        {(trainer.full_name || 'T').charAt(0).toUpperCase()}
                      </div>
                      {trainer.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{trainer.email}</td>
                    <td className="py-3.5 px-4 font-bold text-[#0000FF] uppercase text-xs">
                      {trainer.role}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={trainer.is_active ? 'success' : 'danger'} size="sm">
                        {trainer.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={trainer.is_active ? 'danger' : 'accent'}
                        size="sm"
                        onClick={() => handleToggleStatus(trainer)}
                      >
                        {trainer.is_active ? 'Disable Access' : 'Enable Access'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE TRAINER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-blue-100 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0000FF] flex items-center justify-center font-bold border border-blue-100">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Buat Akun Trainer Baru</h3>
                <p className="text-xs text-slate-500 font-medium">Daftarkan kredensial login trainer perusahaan</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrainer} className="space-y-4">
              <Input
                label="Nama Lengkap Trainer *"
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Email Perusahaan *"
                type="email"
                placeholder="trainer@mksd.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Password Awal *"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="md" 
                  className="flex-1 font-bold" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  className="flex-1 font-extrabold"
                  isLoading={modalLoading}
                >
                  Buat Akun Trainer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
