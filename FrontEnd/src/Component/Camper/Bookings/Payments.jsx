import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import {
  Wallet,
  CreditCard,
  Clock,
  CircleCheck,
  FileText,
  ArrowRight,
  Search,
  Filter,
  X,
  Calendar,
  Users,
  Info,
  ShieldCheck,
  DollarSign,
  CircleAlert,
  ShieldAlert,
  ArrowUpDown,
  Zap,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "../../../SystemAdmin/ui/utils";

function StatCard({ icon: Icon, accent, bg, label, value, sub, subColor, onClick, showCurrency = true }) {
  const displayCurrency = showCurrency && !label.toLowerCase().includes("transaction") && !label.toLowerCase().includes("history");
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 flex items-center gap-4 transition-all duration-300 bg-white shadow-sm",
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : ""
      )}
      style={{ borderColor: accent ? accent + "20" : "#e5e7eb" }}
    >
      <div 
        className="p-3 rounded-xl flex-shrink-0"
        style={{ background: bg || "#f9fafb" }}
      >
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()} 
          {displayCurrency && <span className="text-xs text-gray-400 ml-1">ETB</span>}
        </p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {sub && (
          <p className={cn("text-xs mt-1 font-semibold", subColor || "text-gray-400")}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export const Payments = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [sortOption, setSortOption] = useState("date-newest");
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const trx_ref = searchParams.get("trx_ref");
    if (trx_ref) handleAutoVerify(trx_ref);
    fetchPayments();
  }, [searchParams]);

  const fetchPayments = async () => {
    try {
      const res = await api.get("/bookings/my-bookings");
      if (res.data.success) setBookings(res.data.data);
    } catch { toast.error(t("Failed to load records")); }
    finally { setLoading(false); }
  };

  const handleAutoVerify = async (trx_ref) => {
    const toastId = toast.loading(t("Verifying payment..."));
    try {
      const res = await api.get(`/payments/verify/${trx_ref}`);
      if (res.data.success) {
        toast.success(t("Payment verified!"), { id: toastId });
        fetchPayments();
      }
    } catch { toast.error(t("Verification failed"), { id: toastId }); }
  };

  const handlePayBalance = async (booking) => {
    const toastId = toast.loading(t("Initializing payment..."));
    try {
      const res = await api.post('/payments/initialize', { bookingId: booking._id });
      if (res.data.success) window.location.href = res.data.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.message || t("Payment failed"), { id: toastId });
    }
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(b => {
      const s = b.status?.toUpperCase();
      if (filter === "paid") return ['FULLY_PAID', 'COMPLETED'].includes(s);
      if (filter === "pending") return b.balance_due > 0 && s !== 'CANCELLED';
      return true;
    });

    return filtered.sort((a, b) => {
      const nameA = (a.campId?.name || "").toLowerCase();
      const nameB = (b.campId?.name || "").toLowerCase();
      const amountA = a.totalAmount || 0;
      const amountB = b.totalAmount || 0;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      switch (sortOption) {
        case "az": return nameA.localeCompare(nameB);
        case "za": return nameB.localeCompare(nameA);
        case "amount-low": return amountA - amountB;
        case "amount-high": return amountB - amountA;
        case "date-oldest": return dateA - dateB;
        case "date-newest": return dateB - dateA;
        default: return 0;
      }
    });
  }, [bookings, filter, sortOption]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      <p className="text-sm font-medium text-gray-500">{t("Loading financial records...")}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Payments & Billing')}</h1>
          <p className="text-gray-500 mt-1">{t('Track your payment history and manage outstanding balances')}</p>
        </div>

        {user?.completed_bookings >= 1 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-100 rounded-lg shadow-sm">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <p className="text-sm font-bold text-green-800">{t("Verified Member")}</p>
          </div>
        )}
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Wallet} 
          accent="#10b981" 
          bg="#f0fdf4"
          label={t("Total Paid")} 
          value={bookings.reduce((a,b)=>a+(b.amount_paid_online||0),0)} 
          sub={t("Settled through platform")}
          subColor="text-green-600"
          onClick={() => setFilter("paid")} 
        />
        <StatCard 
          icon={Clock} 
          accent="#f59e0b" 
          bg="#fffbeb"
          label={t("Balance Due")} 
          value={bookings.reduce((a,b)=>a+(b.status!=='CANCELLED'?b.balance_due:0),0)} 
          sub={t("Pending field payments")}
          subColor="text-amber-600"
          onClick={() => setFilter("pending")} 
        />
        <StatCard 
          icon={FileText} 
          accent="#3b82f6" 
          bg="#eff6ff"
          label={t("Total Transactions")} 
          value={bookings.length} 
          sub={t("Total booking history")}
          subColor="text-blue-600"
          onClick={() => setFilter("all")} 
          showCurrency={false}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200">
          {['all', 'pending', 'paid'].map(t_val => (
            <button 
              key={t_val} 
              onClick={()=>setFilter(t_val)} 
              className={cn(
                "px-6 py-1.5 rounded-md text-sm font-semibold transition-all",
                filter === t_val ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t(t_val.charAt(0).toUpperCase() + t_val.slice(1))}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm group">
            <ArrowUpDown className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer pr-6"
            >
              <option value="date-newest">{t("Newest First")}</option>
              <option value="date-oldest">{t("Oldest First")}</option>
              <option value="az">{t("Name A-Z")}</option>
              <option value="amount-high">{t("Highest Amount")}</option>
              <option value="amount-low">{t("Lowest Amount")}</option>
            </select>
          </div>
          
          <div className="relative flex-1 md:flex-none md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t("Search by code...")}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" 
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-gray-50/50 rounded-2xl p-24 text-center border border-dashed border-gray-200">
            <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">{t("No transactions found")}</h3>
            <p className="text-sm text-gray-500 mt-1">{t("Your financial history will appear here")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(b => (
              <PaymentRow key={b._id} b={b} onPay={()=>handlePayBalance(b)} onOpen={()=>setSelectedBooking(b)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <DetailModal 
            b={selectedBooking} 
            onClose={()=>setSelectedBooking(null)} 
            onPay={()=>handlePayBalance(selectedBooking)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentRow({ b, onPay, onOpen }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (b.status?.toUpperCase() !== 'PENDING') return;
    const calculate = () => {
      const expiresAt = new Date(b.createdAt).getTime() + 15 * 60 * 1000;
      const difference = expiresAt - Date.now();
      if (difference <= 0) { setTimeLeft("EXPIRED"); setIsExpired(true); return; }
      const minutes = Math.floor((difference / 60000) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [b.createdAt, b.status]);

  const parts = timeLeft.includes(":") ? timeLeft.split(":") : [timeLeft, ""];
  const minutesDisplay = parts[0] || "00";
  const secondsDisplay = parts[1] || "00";

  return (
    <div 
      className={cn(
        "bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative group cursor-pointer",
        isExpired && 'opacity-60 grayscale-[0.5]'
      )}
      onClick={onOpen}
    >
      {b.status?.toUpperCase() === 'PENDING' && !isExpired && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-3 right-6 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1 shadow-sm select-none z-10 hover:shadow-md transition-all duration-300"
        >
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-blue-900 tracking-wide flex items-center">
            {t("Expires in:")} <span className="font-mono font-extrabold text-sm text-blue-600 ml-1.5">{timeLeft}</span>
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{b.campId?.name}</h3>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  ['FULLY_PAID', 'COMPLETED'].includes(b.status) ? 'bg-green-50 text-green-700 border-green-100' : 
                  b.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                )}>
                  {isExpired ? t("EXPIRED") : t(b.status.replace('_', ' '))}
                </span>
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">#{b.reservationCode}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Booking Dates")}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{format(new Date(b.checkIn), "MMM dd")} - {format(new Date(b.checkOut), "MMM dd")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Payment Plan")}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{b.deposit_amount < b.totalAmount ? t("15% Deposit") : t("100% Full Payment")}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Status")}</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">{b.is_balance_cleared ? t("Cleared") : t("Pending")}</p>
            </div>
          </div>
        </div>

        <div className="lg:w-80 w-full p-6 bg-gray-50 rounded-xl border border-gray-100 space-y-5 flex flex-col justify-between group-hover:bg-white group-hover:border-blue-100 transition-all">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
              <span>{t("Total Amount")}</span>
              <span className="text-gray-900">{b.totalAmount.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-green-600 uppercase">
              <span>{t("Amount Paid")}</span>
              <span>- {b.amount_paid_online.toLocaleString()} ETB</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
              <span className="text-xs font-bold text-gray-900 uppercase">{t("Balance Due")}</span>
              <span className={cn(
                "text-xl font-bold tracking-tight",
                b.balance_due > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {b.balance_due.toLocaleString()} <span className="text-xs font-medium text-gray-400">ETB</span>
              </span>
            </div>
          </div>

          {b.balance_due > 0 && b.status !== 'CANCELLED' && !isExpired ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onPay(); }} 
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {t("Pay Now")}
            </button>
          ) : (
            <div className="w-full py-2.5 bg-white border border-gray-200 text-gray-400 group-hover:text-blue-600 group-hover:border-blue-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
              {t("View Details")}
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ b, onClose, onPay }) {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10 border border-gray-100"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-all"><X size={24} /></button>
        
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg"><FileText className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t("Invoice Details")}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase mt-0.5 tracking-wider">ID: {b._id.slice(-12).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Booking Information")}</p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-gray-900 text-sm">{b.campId?.name}</p>
                <p className="text-xs text-blue-600 font-bold mt-1">{format(new Date(b.checkIn), "MMM dd, yyyy")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Security Status")}</p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <ShieldCheck className={cn("w-5 h-5", b.is_balance_cleared ? "text-green-500" : "text-amber-500")} />
                <p className="text-xs font-bold text-gray-700">{b.is_balance_cleared ? t("Verified") : t("Pending")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-3">
              {t("Amount Breakdown")} <span className="h-px bg-gray-100 flex-1"></span>
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              <ModalRow label={t("Subtotal")} val={b.totalAmount} />
              <ModalRow label={t("Online Payment")} val={-b.amount_paid_online} neg />
              <ModalRow label={t("Remaining Balance")} val={b.balance_due} highlight />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg flex gap-3 border border-blue-100">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              {t("Your payment is securely processed. Check-in is permitted once the required deposit or full amount is cleared.")}
            </p>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Code")}: {b.reservationCode}</p>
           <div className="flex gap-3">
             <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-sm font-bold transition-all">{t("Close")}</button>
             {b.balance_due > 0 && b.status !== 'CANCELLED' && (
               <button 
                 onClick={()=>{onClose(); onPay();}} 
                 className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
               >
                 {t("Pay Balance")}
               </button>
             )}
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function ModalRow({ label, val, neg, highlight }) {
  return (
    <div className="px-5 py-4 flex justify-between items-center">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className={cn(
        "text-base font-bold tracking-tight",
        neg ? 'text-red-600' : highlight ? 'text-blue-600' : 'text-gray-900'
      )}>
        {val.toLocaleString()} <span className="text-xs font-medium text-gray-400">ETB</span>
      </span>
    </div>
  );
}
