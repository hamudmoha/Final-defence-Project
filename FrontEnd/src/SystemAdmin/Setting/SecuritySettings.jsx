import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Save,
  Clock,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const SecuritySettings = () => {
  const [toggles, setToggles] = useState({
    twoFactor: true,
    emailAlerts: true,
    ipLogging: false,
    sessionTimeout: true
  });

  const toggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-10 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
           <div className="flex items-center gap-2.5 mb-2">
             <div className="p-2 bg-rose-50 rounded-lg">
               <Shield className="w-4 h-4 text-rose-500" />
             </div>
             <span className="text-[11px] font-black text-rose-500 uppercase tracking-[2.5px]">System Infrastructure Safety</span>
           </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security Configuration</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure global authentication policies and infrastructure protection</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg shadow-slate-900/10 hover:bg-emerald-600 transition-all active:scale-95 leading-none">
          <Save className="w-4 h-4" /> Save Security Policy
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Sections */}
        <div className="lg:col-span-2 space-y-8">
          {/* Authentication Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[32px] p-10 border-none shadow-2xl shadow-slate-200/50"
          >
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Authentication Policy</h2>
                <p className="text-sm text-slate-400 font-medium">Manage how administrators and users authenticate</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'twoFactor', title: "Two-Factor Authentication", desc: "Mandatory for all administration accounts", icon: Smartphone, enabled: toggles.twoFactor },
                { id: 'sessionTimeout', title: "Session Timeout Locking", desc: "Automatically lock account after 30 minutes of inactivity", icon: Clock, enabled: toggles.sessionTimeout },
                { id: 'emailAlerts', title: "Critical Event Alerts", desc: "Send email notifications for failed login attempts", icon: AlertTriangle, enabled: toggles.emailAlerts },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all shadow-sm">
                      <item.icon className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-slate-900 tracking-tight">{item.title}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">{item.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggle(item.id)}
                    className={`w-14 h-7 rounded-full transition-all relative ${item.enabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${item.enabled ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Password Policy */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[32px] p-10 border-none shadow-2xl shadow-slate-200/50"
          >
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Key className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Password Requirements</h2>
                <p className="text-sm text-slate-400 font-medium">Define global complexity rules for new passwords</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Minimum Length", value: "12 Characters", sub: "Standard policy" },
                { label: "Complexity", value: "Mixed Case + Special", sub: "High entropy" },
                { label: "Rotation Policy", value: "Every 90 Days", sub: "Periodic update" },
                { label: "Lockout Threshold", value: "5 Failed Attempts", sub: "Brute force protection" },
              ].map((policy) => (
                <div key={policy.label} className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3">{policy.label}</span>
                  <div className="flex justify-between items-end">
                    <span className="text-[16px] font-black text-slate-900 tracking-tighter">{policy.value}</span>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">{policy.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Audit Log / Quick Actions */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-[32px] p-10 border-none shadow-2xl bg-slate-900 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16" />
            
            <h3 className="text-lg font-black text-white mb-8 tracking-tight relative z-10">Threat Landscape</h3>
            
            <div className="relative z-10 space-y-6">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Optimal Level</span>
                  <span className="text-lg font-black text-white tabular-nums">98%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[98%] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                </div>
              </div>
              
              <p className="text-[12px] text-slate-400 font-medium leading-relaxed">System state is stable. All integrity checks passed in the last automated scan.</p>
              
              <div className="pt-4 space-y-3">
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[13px] font-black transition-all flex items-center justify-center gap-3 active:scale-95 leading-none border border-white/5">
                  <Eye className="w-4 h-4" /> Full Security Audit
                </button>
                <button className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl text-[13px] font-black transition-all border border-rose-500/20 active:scale-95 leading-none">
                  Revoke All Sessions
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[32px] p-10 border-none shadow-2xl shadow-slate-200/50"
          >
            <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight">Login Forensics</h3>
            <div className="space-y-8">
              {[
                { loc: "Addis Ababa, ET", browser: "Chrome / Windows", time: "Just now", status: "success" },
                { loc: "Singapore, SG", browser: "Safari / macOS", time: "2 hours ago", status: "success" },
                { loc: "London, UK", browser: "Edge / Windows", time: "Yesterday", status: "failed" },
              ].map((entry, i) => (
                <div key={i} className="flex gap-5 group cursor-default">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${entry.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                  <div>
                    <p className="text-[14px] font-black text-slate-800 tracking-tight">{entry.loc}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-1">{entry.browser}</p>
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-[1.5px] mt-2">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-10 py-4 rounded-2xl bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-[2px] hover:bg-slate-100 transition-all active:scale-95">
              View Detailed Logs
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
