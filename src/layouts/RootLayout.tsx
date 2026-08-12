import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="flex-1 flex flex-col bg-white">
        <Outlet />
      </main>
    </div>
  );
};
