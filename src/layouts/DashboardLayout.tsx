import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/shared/Sidebar';
import { useAuthStore } from '../store/authStore';

export const DashboardLayout: React.FC = () => {
  const { user, loading, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (initialized && !loading && !user) {
      navigate('/login');
    }
  }, [user, loading, initialized, navigate]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Training Quiz System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 1. Responsive Left Sidebar (Desktop Fixed + Mobile Drawer) */}
      <Sidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* 2. Main Content Area Offset by Sidebar Width on Desktop (md:pl-64) */}
      <div className="flex-1 pl-0 md:pl-64 flex flex-col min-w-0 bg-white">
        
        {/* Top Header Bar for Dashboard */}
        <header className="h-16 border-b border-blue-100 px-4 md:px-8 flex items-center justify-between bg-white sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-[#0000FF] hover:bg-blue-50 transition-colors border border-blue-100 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Corporate Training Portal
            </span>
          </div>
        </header>

        {/* Dashboard Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-white w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
