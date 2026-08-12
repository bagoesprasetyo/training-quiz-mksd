import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { useToast } from '../components/ui/ToastProvider';

export const SettingsPage: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setSuccessMsg('');

      // Update profile name
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profErr) throw profErr;

      // Update password if provided
      if (newPassword.trim()) {
        const { error: passErr } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });
        if (passErr) throw passErr;
      }

      await fetchUser();
      showToast('Pengaturan berhasil diperbarui!', 'success');
      setSuccessMsg('Pengaturan berhasil diperbarui!');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui pengaturan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 bg-white min-h-screen w-full">
      
      {/* HEADER */}
      <div className="border-b border-blue-100 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {user?.role === 'administrator' ? 'Administrator Settings' : 'Trainer Settings'}
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage your personal account profile, password, and session preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SETTINGS FORM */}
      <Card className="p-6 md:p-8 space-y-6 border-2 border-blue-100 shadow-soft bg-white">
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#0000FF] font-black text-xl flex items-center justify-center border border-blue-200 shadow-inner">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">{user?.full_name}</h3>
              <p className="text-xs font-bold text-[#0000FF] uppercase">{user?.role} Account</p>
            </div>
          </div>

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Work Email (Read Only)"
            value={user?.email || ''}
            disabled
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Change Password (Optional)"
            type="password"
            placeholder="Leave blank to keep current password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="font-bold px-8"
              isLoading={loading}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
