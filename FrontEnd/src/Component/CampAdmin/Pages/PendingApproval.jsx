import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, Mail, AlertCircle, LogOut } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { useNavigate } from 'react-router-dom';

export const PendingApproval = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-slate-100 p-8 relative overflow-hidden"
      >
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-8 -mt-8 z-0 opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-8 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Application Pending Review
          </h1>
          
          <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-md mx-auto">
            Hello, <span className="font-bold text-slate-900">{user?.fullName}</span>. Your application for <span className="font-bold text-slate-900">{user?.businessName || 'your camp'}</span> is currently being reviewed by our administration team.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10 text-left">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px]">Verification</p>
                <p className="text-xs text-slate-500">Documents submitted & received.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px]">Notifications</p>
                <p className="text-xs text-slate-500">We'll email you once approved.</p>
              </div>
            </div>
          </div>

          <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 mb-10 text-left">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              You will gain full access to the dashboard and tent management features once your business license has been verified.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all shadow-md"
            >
              Refresh Status
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-slate-400 text-sm font-medium">
        Need help? Contact <a href="mailto:support@ethiocamp.com" className="text-sky-600 hover:underline">support@ethiocamp.com</a>
      </p>
    </div>
  );
};


