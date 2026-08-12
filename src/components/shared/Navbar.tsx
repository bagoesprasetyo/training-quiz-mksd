import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LogIn, Hash } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { CompanyLogo } from './CompanyLogo';
import { useToast } from '../ui/ToastProvider';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useToast();

  const isAuthPage = location.pathname === '/login' || location.pathname.startsWith('/join');

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo: PT Multikarya Sinardinamika */}
        <Link to="/" className="flex items-center group">
          <CompanyLogo size="md" />
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Home Link */}
          <Link
            to="/"
            className="text-xs font-extrabold text-slate-700 hover:text-[#0000FF] transition-colors px-2 py-1"
          >
            Beranda
          </Link>

          {!location.pathname.startsWith('/join') && (
            <Link to="/join">
              <Button variant="outline" size="sm" leftIcon={<Hash className="w-4 h-4 text-[#0000FF]" />}>
                Join with PIN
              </Button>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to={user.role === 'administrator' ? '/admin' : '/dashboard'}
                className="text-sm font-extrabold text-slate-800 hover:text-[#0000FF] transition-colors"
              >
                Dashboard
              </Link>
              
              <div className="flex items-center gap-2.5 pl-3 border-l border-blue-100">
                <div className="w-8.5 h-8.5 rounded-full bg-blue-100 text-[#0000FF] font-bold text-xs flex items-center justify-center border border-blue-200">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold uppercase">{user.role}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            !isAuthPage && (
              <Link to="/login">
                <Button variant="primary" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  Trainer Login
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};
