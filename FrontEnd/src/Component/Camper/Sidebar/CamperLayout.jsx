import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUser } from '../../../context/UserContext';
import { useTranslation } from 'react-i18next';

export const CamperLayout = () => {
  const { loadingUser } = useUser();
  const { t } = useTranslation();

  if (loadingUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t("Loading application...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
        
        <footer className="px-8 py-6 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            © 2026 {t("EthioCamp. All rights reserved.")}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors">{t("Privacy Policy")}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {t("System Status: Online")}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};


