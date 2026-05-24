import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Activity, CheckCircle, Clock, AlertTriangle, RefreshCw, Building, ChevronRight, Settings, Percent, Search, TrendingUp, X, PieChart as PieIcon, Info, Wrench, Banknote, ShieldCheck, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import SystemAdminLoader from "../components/SystemAdminLoader";

export function FinancialManagement() {
  const { t } = useTranslation();
  const [loading, setLoading]   = useState(true);
  const [fin, setFin]           = useState(null);
  const [activeCard, setActive] = useState("volume");
  const [showModal, setModal]   = useState(false);
  const [rate, setRate]         = useState(10);
  const [reason, setReason]     = useState("");
  const [campId, setCampId]     = useState(null);
  const [q, setQ]               = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/payments/admin-financials");
      if (r.data.success) setFin(r.data.data);
    } catch { toast.error(t("Audit failed. Check sync.")); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCommission = async () => {
    if (!reason) return toast.error(t("Please enter a rationale."));
    const toastId = toast.loading(t("Updating global rates..."));
    try {
      const r = await api.post("/payments/commission", { newRate: parseFloat(rate), reason });
      if (r.data.success) { 
        toast.success(`${t("Rate updated to")} ${rate}%`, { id: toastId }); 
        setModal(false); setReason(""); fetch(); 
      }
    } catch (e) { toast.error(e.response?.data?.message || t("Failed"), { id: toastId }); }
  };

  const handleRepair = async () => {
    const toastId = toast.loading(t("Recalculating ledger splits..."));
    try {
      const r = await api.post("/payments/repair-financials");
      if (r.data.success) { toast.success(r.data.message, { id: toastId }); fetch(); }
    } catch { toast.error(t("Repair failed"), { id: toastId }); }
  };

  const handleManualRefund = async (bookingId) => {
    if (!window.confirm(t("Trigger 100% refund for this rejected booking?"))) return;
    const toastId = toast.loading(t("Processing refund..."));
    try {
      const r = await api.post("/admin/financial/refund", { bookingId });
      if (r.data.success || r.data.data) {
        toast.success(r.data.message || t("Refund processed successfully via Gateway"), { id: toastId });
        fetch();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t("Refund failed"), { id: toastId });
    }
  };

  const stats = fin?.platformStats || {};
  const ledgers = fin?.ledgers || {};

  const bucketMap = {
    commission: { ...ledgers.cashSettled, ...ledgers.escrow, ...ledgers.ready },
    holding:    ledgers.escrow      || {},
    ready:      ledgers.ready       || {},
    cash:       { ...(ledgers.cashSettled || {}), ...(ledgers.cashPending || {}) },
    volume:     { ...(ledgers.escrow || {}), ...(ledgers.ready || {}), ...(ledgers.cashSettled || {}), ...(ledgers.cashPending || {}) },
    dispute:    ledgers.disputed    || {},
  };

  const filteredCamps = useMemo(() => {
    const src = bucketMap[activeCard] || {};
    return Object.entries(src).filter(([, d]) =>
      d.name?.toLowerCase().includes(q.toLowerCase())
    );
  }, [fin, activeCard, q]);

  const selectedCampData = useMemo(() =>
    filteredCamps.find(([id]) => id === campId)?.[1],
  [filteredCamps, campId]);

  const cards = [
    { id: "commission", label: t("Real Commission"),     value: fin?.stats?.realCommission || 0,       accent: "#10b981", bg: "#f0fdf4", icon: DollarSign,     desc: t("Secured from online splits") },
    { id: "holding",    label: t("Escrow (Pending)"),     value: fin?.stats?.totalEscrow || 0,           accent: "#f59e0b", bg: "#fffbeb", icon: Clock,          desc: t("Locked in 18h safety window") },
    { id: "ready",      label: t("Clearing (Ready)"),      value: fin?.stats?.totalReady || 0,            accent: "#3b82f6", bg: "#eff6ff", icon: ShieldCheck,    desc: t("Settlements cleared for manager") },
    { id: "cash",       label: t("Offline Volume"),       value: stats.totalCash || 0,                   accent: "#14b8a6", bg: "#f0fdfa", icon: Banknote,       desc: t("Verified on-site cash collections") },
    { id: "volume",     label: t("Business Volume"),      value: stats.totalVolume || 0,                 accent: "#6366f1", bg: "#eef2ff", icon: Activity,       desc: t("Aggregate net platform volume") },
    { id: "dispute",    label: t("Frozen Funds"),         value: stats.totalDisputed || 0,               accent: "#ef4444", bg: "#fff1f2", icon: AlertTriangle,  desc: t("Active camper disputes") },
  ];

  if (loading && !fin) {
    return <SystemAdminLoader text={t("INITIALIZING FINANCIAL AUDIT...")} />;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("Financial Ledger")}</h1>
          <p className="text-gray-500 mt-1">{t("Monitoring platform-wide virtual splits & escrow safety windows.")}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRepair} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"><Wrench className="w-4 h-4"/> {t("Repair")}</button>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"><Settings className="w-4 h-4" /> {t("Global Rates")}</button>
          <button onClick={fetch} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/> {t("Refresh")}</button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(({ id, label, value, accent, bg, icon: Icon, desc }) => (
          <motion.div key={id} onClick={() => { setActive(id); setCampId(null); }}
            className={`rounded-2xl border p-5 flex flex-col justify-center cursor-pointer hover:shadow-md transition-all ${activeCard === id ? "ring-2 ring-offset-2 ring-gray-900 shadow-sm scale-[1.02]" : "shadow-sm"}`}
            style={{ background: bg, borderColor: accent + "30" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "white" }}>
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{label}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {value.toLocaleString()} <span className="text-sm font-medium text-gray-500">{t("ETB")}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Split Transparency Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input type="text" placeholder={t("Filter by camp name...")} value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-transparent text-sm font-medium outline-none text-gray-900" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider capitalize">{t(activeCard)} {t("Ledger")}</h3>
               <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{filteredCamps.length} {t("Camps")}</span>
             </div>
             <div className="overflow-auto flex-1 custom-scrollbar">
                {filteredCamps.map(([id, data]) => (
                  <button key={id} onClick={() => setCampId(id)}
                    className={`w-full text-left px-6 py-4 border-b border-gray-50 flex items-center justify-between transition-all ${campId === id ? "bg-gray-50" : "hover:bg-gray-50/50"}`}>
                    <div>
                      <p className={`font-semibold text-sm ${campId === id ? 'text-gray-900' : 'text-gray-800'}`}>{data.name}</p>
                      <p className={`text-xs mt-1 ${campId === id ? 'text-gray-500' : 'text-gray-400'}`}>{(data.bookings || []).length} {t("Settlements")}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className={`text-sm font-bold ${campId === id ? 'text-gray-900' : 'text-gray-700'}`}>{(data.total || 0).toLocaleString()} <span className="text-[10px] font-normal text-gray-500">{t("ETB")}</span></p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${campId === id ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Drill-down Table */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {!campId ? (
               <div className="h-full min-h-[500px] bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                 <ShieldCheck className="w-16 h-16 mb-4 opacity-10" />
                 <p className="font-bold text-sm uppercase tracking-wider">{t("Select Camp for Split Audit")}</p>
               </div>
             ) : (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedCampData?.name}</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1 capitalize">{t("Drill-down")}: {t(activeCard)} {t("Bucket")}</p>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          <th className="px-8 py-4">{t("Camper Entity")}</th>
                          <th className="px-8 py-4">{t("Trust Status / Dates")}</th>
                          <th className="px-8 py-4 text-center">{t("Virtual Split Audit")}</th>
                          <th className="px-8 py-4 text-right">{t("Actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedCampData?.bookings.map(b => (
                          <tr key={b._id} className="hover:bg-gray-50/50 transition-all">
                            <td className="px-8 py-5">
                              <p className="font-semibold text-sm text-gray-900">{b.guestName}</p>
                              <p className="text-xs text-gray-500 mt-1">{t("REF")}: {b.reservationCode}</p>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${b.deposit_amount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                {b.deposit_amount > 0 ? t("Trusted (Flex)") : t("New (Full)") }
                              </span>
                              <p className="text-xs text-gray-500 mt-2">{format(new Date(b.checkIn), "MMM dd, yyyy")} {t("Arrival")}</p>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center justify-center gap-3">
                                 <div className="text-center">
                                   <p className="text-[10px] font-bold text-gray-400 uppercase">{t("Input")}</p>
                                   <p className="text-sm font-semibold text-gray-900">{b.amount_paid_online.toLocaleString()}</p>
                                 </div>
                                 <span className="text-gray-300">→</span>
                                 <div className="text-center px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                                   <p className="text-[10px] font-bold text-green-600 uppercase">{t("Comm")}</p>
                                   <p className="text-sm font-semibold text-green-700">-{b.commission_amount.toLocaleString()}</p>
                                 </div>
                                 <span className="text-gray-300">→</span>
                                 <div className="text-center px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                                   <p className="text-[10px] font-bold text-blue-600 uppercase">{t("Net")}</p>
                                   <p className="text-sm font-semibold text-blue-700">{b.manager_net_payout.toLocaleString()}</p>
                                 </div>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                               {b.status === 'REJECTED' && b.amount_paid_online > 0 ? (
                                 <button onClick={()=>handleManualRefund(b._id)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors border border-red-100">
                                   <RotateCcw className="w-3.5 h-3.5" /> {t("Refund")}
                                 </button>
                               ) : (
                                 <span className="text-xs font-semibold text-gray-500">{b.payout_status || t("SETTLED")}</span>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Config Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
               <div className="bg-gray-900 p-8 flex items-center gap-5">
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white"><Percent className="w-7 h-7" /></div>
                 <div>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t("Global Ecosystem")}</p>
                   <h2 className="text-white text-2xl font-black tracking-tight">{t("Commission Rate")}</h2>
                 </div>
               </div>
               <div className="p-8 space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">{t("New Platform % Fee")}</label>
                    <div className="relative">
                      <input type="number" value={rate} onChange={e=>setRate(e.target.value)} className="w-full h-14 text-2xl font-bold bg-gray-50 border-none rounded-xl px-6 focus:ring-2 focus:ring-gray-200 outline-none" />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-300">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">{t("Policy Update Rationale")}</label>
                    <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-gray-200 outline-none" placeholder={t("Describe the reason for this adjustment...")} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={()=>setModal(false)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t("Dismiss")}</button>
                    <button onClick={handleCommission} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">{t("Apply Change")}</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
