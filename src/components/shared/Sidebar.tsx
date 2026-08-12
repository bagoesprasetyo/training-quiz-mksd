import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HelpCircle, 
  BookOpen, 
  Radio, 
  FileSpreadsheet, 
  Settings, 
  Users, 
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { CompanyLogo } from './CompanyLogo';
import { useToast } from '../ui/ToastProvider';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'administrator';
  const { confirm } = useToast();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Konfirmasi Sign Out',
      message: 'Apakah Anda yakin ingin keluar dari sistem?',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal',
      variant: 'danger',
    });
    if (ok) {
      await signOut();
      navigate('/login');
    }
  };

  const trainerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/quiz', label: 'Quiz Management', icon: BookOpen },
    { to: '/dashboard/questions', label: 'Question Bank', icon: HelpCircle },
    { to: '/dashboard/sessions', label: 'Live Sessions', icon: Radio },
    { to: '/dashboard/reports', label: 'Reports & Analytics', icon: FileSpreadsheet },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/trainers', label: 'Trainer Management', icon: Users },
    { to: '/admin/quizzes', label: 'Quiz Management', icon: BookOpen },
    { to: '/admin/questions', label: 'Global Question Bank', icon: HelpCircle },
    { to: '/admin/sessions', label: 'Session History', icon: Radio },
    { to: '/admin/reports', label: 'System Reports', icon: FileSpreadsheet },
    { to: '/admin/settings', label: 'Admin Settings', icon: ShieldCheck },
  ];

  const links = isAdmin ? adminLinks : trainerLinks;

  const content = (
    <div className="w-64 h-full bg-white flex flex-col justify-between shrink-0 shadow-xs border-r border-blue-100">
      
      {/* 1. LOGO PERUSAHAAN DI PALING ATAS SIDEBAR */}
      <div className="h-16 px-3 border-b border-blue-100 flex items-center justify-between bg-white shrink-0">
        <CompanyLogo size="sm" showSubtitle={true} />
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. USER INFO BADGE */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0000FF] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-900 truncate">
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[10px] font-bold text-[#0000FF] uppercase tracking-wider">
              {user?.role === 'administrator' ? 'Administrator' : 'Trainer'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. MENU NAVIGATION */}
      <div className="px-4 py-2 flex-1 overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
          Menu
        </p>
        <nav className="space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive 
                    ? 'bg-blue-50 text-[#0000FF] border border-blue-200 font-extrabold shadow-xs' 
                    : 'text-slate-600 hover:text-[#0000FF] hover:bg-blue-50/40'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* 4. LOGOUT BUTTON & FOOTER */}
      <div className="p-4 border-t border-blue-100 space-y-3 bg-white shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="text-[10px] text-slate-400 text-center font-medium">
          PT Multikarya Sinardinamika · v1.0.0
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (FIXED LEFT) */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-30 h-screen">
        {content}
      </aside>

      {/* MOBILE SIDEBAR DRAWER (MOBILE OVERLAY) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={onClose} 
          />
          <div className="relative z-10 animate-slide-in h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
