import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CampProvider } from '../../../context/CampContext';
import { useUser } from '../../../context/UserContext';
import { PendingApproval } from '../Pages/PendingApproval';

export const CampAdminLayout = () => {
  const { user, loadingUser } = useUser();

  if (loadingUser) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;

  if (user?.status === 'pending') {
    return <PendingApproval />;
  }

  return (
    <CampProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-auto px-6 py-6 border-t border-slate-200 bg-white sm:bg-transparent flex flex-col items-center justify-center">
            <p className="text-sm text-slate-500 font-medium text-center">
              © 2026 EthioCamp Ground. All rights reserved.
            </p>
          </footer>
        </main>
      </div>
    </CampProvider>
  );
};


