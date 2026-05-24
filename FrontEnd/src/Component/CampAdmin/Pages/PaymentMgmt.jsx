import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, FileText, CheckCircle2, Clock, Wallet, 
  MoreVertical, Eye, Download, X, ChevronLeft, ChevronRight, 
  Filter, BarChart2, PieChart as PieChartIcon, RefreshCw, Zap,
  Banknote, ArrowUpRight, ShieldCheck, Info, Loader, Shield
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Bar, ComposedChart, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api.js';
import { useUser } from '../../../context/UserContext.jsx';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';

export const PaymentMgmt = () => {
  const { t } = useTranslation();
  const { user, fetchUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data
  const [bookings, setBookings] = useState([]);
  
  // Filters & Pagination
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Status options for tabs
  const filters = ['All', 'Cash Pending', 'Escrow', 'Ready', 'Paid'];

  // Responsive page size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPageSize(5);
      } else if (window.innerWidth < 1024) {
        setPageSize(8);
      } else {
        setPageSize(10);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper: format currency
  const formatCurrency = (amount) => `ETB ${amount?.toLocaleString() || 0}`;

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/manager-bookings");
      if (res.data.success) setBookings(res.data.data || []);
    } catch (err) { 
      toast.error(t("Failed to sync ledger")); 
      setError(t("Failed to sync ledger"));
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchFinancials(); }, []);

  const handleVerifyCash = async (id) => {
    const toastId = toast.loading(t("Verifying on-site receipt..."));
    try {
      const res = await api.post(`/bookings/${id}/mark-cash-paid`);
      if (res.data.success) {
        toast.success(t("Cash verified. Alert sent to Admin & Camper."), { id: toastId });
        fetchFinancials();
        fetchUser(); // Sync manager's total earnings
      }
    } catch (e) { toast.error(e.response?.data?.message || t("Failed"), { id: toastId }); }
  };

  const handlePayoutRequest = async () => {
    const totalAvailable = (user?.net_payout || 0) + (user?.pending_earnings || 0);
    if (totalAvailable <= 0) {
      toast.error(t("No funds available for payout yet."));
      return;
    }

    const toastId = toast.loading(t("Submitting payout request..."));
    try {
      const res = await api.post('/payments/request-payout');
      if (res.data.success) {
        toast.success(t("Request sent to Admin"), { id: toastId });
        fetchFinancials();
      }
    } catch (e) { toast.error(e.response?.data?.message || t("Check eligibility"), { id: toastId }); }
  };

  // Processing Data for UI
  const filteredAndSortedBookings = useMemo(() => {
    let result = bookings.filter(b => {
      const matchesSearch = b.reservationCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           b.guestName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilter === "Cash Pending") matchesFilter = !b.is_balance_cleared && b.status !== 'CANCELLED';
      else if (activeFilter === "Escrow") matchesFilter = b.payout_status === 'PENDING';
      else if (activeFilter === "Ready") matchesFilter = b.payout_status === 'READY';
      else if (activeFilter === "Paid") matchesFilter = b.payout_status === 'PAID';
      
      return matchesSearch && matchesFilter;
    });

    result.sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.createdAt || b.checkIn) < new Date(a.createdAt || a.checkIn) ? -1 : 1;
      if (sortBy === 'Oldest') return new Date(a.createdAt || a.checkIn) < new Date(b.createdAt || b.checkIn) ? -1 : 1;
      if (sortBy === 'Highest Price') return b.totalAmount - a.totalAmount;
      if (sortBy === 'Lowest Price') return a.totalAmount - b.totalAmount;
      return 0;
    });

    return result;
  }, [bookings, activeFilter, searchTerm, sortBy]);

  // Pagination
  const total = filteredAndSortedBookings.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentBookings = filteredAndSortedBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate Real Chart Data
  const { chartData, occupancyData } = useMemo(() => {
    // Occupancy / Payout Status Pie Chart
    let escrowCount = 0;
    let readyCount = 0;
    let paidCount = 0;
    let cashPendingCount = 0;

    bookings.forEach(b => {
      if (!b.is_balance_cleared && b.status !== 'CANCELLED') cashPendingCount++;
      else if (b.payout_status === 'PENDING') escrowCount++;
      else if (b.payout_status === 'READY') readyCount++;
      else if (b.payout_status === 'PAID') paidCount++;
    });

    const pieData = [
      { name: t('Cash Pending'), value: cashPendingCount, color: '#f59e0b' },
      { name: t('In Escrow'), value: escrowCount, color: '#3b82f6' },
      { name: t('Ready'), value: readyCount, color: '#10b981' },
      { name: t('Paid'), value: paidCount, color: '#64748b' }
    ].filter(d => d.value > 0);

    // If no data, provide an empty slice
    if (pieData.length === 0) pieData.push({ name: t('No Data'), value: 1, color: '#e2e8f0' });

    // Weekly Earnings Bar Chart (Last 7 days)
    const weekData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      weekData.push({
        day: format(d, 'EEE'),
        date: d,
        gross: 0,
        net: 0
      });
    }

    bookings.forEach(b => {
      if (b.status === 'CANCELLED') return;
      const bDate = new Date(b.createdAt || b.checkIn);
      const dayData = weekData.find(wd => isSameDay(wd.date, bDate));
      if (dayData) {
        dayData.gross += b.totalAmount || 0;
        dayData.net += b.manager_net_payout || 0;
      }
    });

    return { chartData: weekData, occupancyData: pieData };
  }, [bookings, t]);

  // Export
  const exportToCSV = () => {
    const headers = [t('Transaction ID'), t('Guest Name'), t('Date'), t('Gross Revenue'), t('Net Payout'), t('Status')];
    const rows = filteredAndSortedBookings.map(b => [
      b.reservationCode || b._id,
      b.guestName,
      new Date(b.checkIn).toLocaleDateString(),
      b.totalAmount,
      b.manager_net_payout,
      b.payout_status || (b.is_balance_cleared ? t('SETTLED') : t('CASH_PENDING'))
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financials_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
  };

  if (loading) {
    return <IntelligenceLoader text={t("Initializing Financials...")} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-slate-800"
          >
            {t('Financial Hub')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs sm:text-sm text-slate-500 mt-1 font-medium"
          >
            {t('Net Earnings & Trust-Based Settlement Ledger')}
          </motion.p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Filter className="w-4 h-4" /> {t('Filters')}
          </button>
          <button onClick={handlePayoutRequest} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-bold shadow-md hover:bg-slate-800 transition-colors group">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400 group-hover:animate-pulse" /> 
            <span className="hidden xs:inline">{t('Request Payout')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800">{t('Filters & Sort')}</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-xl bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Search')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={t('Search transactions...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Sort By')}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none"
                  >
                    <option value="Newest">{t('Newest First')}</option>
                    <option value="Oldest">{t('Oldest First')}</option>
                    <option value="Highest Price">{t('Highest Price')}</option>
                    <option value="Lowest Price">{t('Lowest Price')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Status Filter')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {filters.map(filter => (
                      <button
                        key={filter}
                        onClick={() => {
                          setActiveFilter(filter);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeFilter === filter 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {t(filter)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm"
                >
                  {t('Apply Filters')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
        {[
          { label: t('Ready to Withdraw'), value: user?.net_payout || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', baseColor: 'bg-emerald-500', desc: t('Cleared online funds'), filterVal: 'Ready' },
          { label: t('In Escrow (Pending)'), value: user?.pending_earnings || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', baseColor: 'bg-amber-500', desc: t('Safety window: 18h post-arrival'), filterVal: 'Escrow' },
          { label: t('Cash Owed to You'), value: bookings.reduce((a,b)=>a+(!b.is_balance_cleared && b.status!=='CANCELLED' ? b.balance_due : 0),0), icon: Banknote, color: 'text-indigo-500', bg: 'bg-indigo-50', baseColor: 'bg-indigo-500', desc: t('Balances to collect on-site'), filterVal: 'Cash Pending' },
          { label: t('Lifetime Earnings'), value: user?.total_earnings || 0, icon: Wallet, color: 'text-slate-700', bg: 'bg-slate-200', baseColor: 'bg-slate-700', desc: t('Total received & settled'), filterVal: 'All' },
        ].map((stat, idx) => (
          <motion.div
            key={`${stat.label}-${idx}`}
            custom={idx}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { duration: 0.3, ease: "easeOut" } }}
            onClick={() => {
              setActiveFilter(stat.filterVal);
              setCurrentPage(1);
              setMobileFiltersOpen(false);
            }}
            className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg flex flex-col justify-between cursor-pointer group overflow-hidden transition-shadow duration-300"
          >
            <div className={`absolute bottom-0 left-0 w-full h-1 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:h-1.5`}></div>
            <div className={`absolute bottom-0 left-0 h-full w-1 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:w-1.5`}></div>

            <div className="relative z-10 flex items-start justify-between mb-2 sm:mb-3 lg:mb-4 pl-1">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 ${stat.color}`} />
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] lg:tracking-[0.3em]">{stat.label}</p>
                <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{stat.value.toLocaleString()} <span className="text-[10px] sm:text-xs font-medium text-slate-400">ETB</span></h3>
              </div>
            </div>
            <p className="relative z-10 text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 font-medium uppercase tracking-wider border-t border-slate-50 pt-2 sm:pt-3 lg:pt-4 pl-1">{stat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Earnings Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">{t('7-Day Earnings Trend')}</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="h-48 sm:h-56 lg:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', marginTop: '8px' }} />
                <Bar dataKey="gross" name={t("Gross Revenue")} fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={15} />
                <Area type="monotone" dataKey="net" name={t("Net Payout")} fill="url(#colorNet)" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">{t('Funds Status')}</h3>
            <span className="text-[10px] sm:text-xs font-medium text-slate-400">{t('All Time')}</span>
          </div>
          <div className="h-40 sm:h-48 lg:h-56 w-full flex items-center justify-center relative mt-2 sm:mt-3 lg:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-2 gap-x-1 mt-2 sm:mt-3 lg:mt-4">
            {occupancyData.map((entry, index) => (
              <div key={index} className="flex items-center text-[10px] sm:text-xs text-slate-600 font-medium">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm mr-1.5 sm:mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Ledger Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Table Header & Filters - Desktop */}
        <div className="hidden lg:flex p-4 sm:p-5 border-b border-slate-100 flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-1 bg-slate-100/50 p-1 rounded-lg overflow-x-auto">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeFilter === filter 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {t(filter)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('Search transactions...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-sm"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm"
            >
              <option value="Newest">{t('Newest First')}</option>
              <option value="Oldest">{t('Oldest First')}</option>
              <option value="Highest Price">{t('Highest Price')}</option>
              <option value="Lowest Price">{t('Lowest Price')}</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t('Export')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          <AnimatePresence>
            {currentBookings.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-500 font-medium">
                {t('No matching transactions found.')}
              </div>
            ) : (
              currentBookings.map((b, idx) => (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-4 space-y-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{b.guestName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {format(new Date(b.checkIn), "MMM dd")} • {b.reservationCode}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTransaction(b);
                        setShowDetailsModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${b.deposit_amount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {b.deposit_amount > 0 ? t("15% Flex") : t("100% Upfront")}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${b.is_balance_cleared ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        <p className="text-[9px] font-bold text-slate-500 uppercase">
                          {b.is_balance_cleared ? t("Settled") : t("Awaiting Cash")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Net</p>
                      <p className="text-sm font-bold text-emerald-600">{b.manager_net_payout.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] text-slate-400">Gross: {b.totalAmount.toLocaleString()}</p>
                      <span className="text-slate-200">|</span>
                      <p className="text-[9px] text-rose-500">-{b.commission_amount.toLocaleString()}</p>
                    </div>
                    {!b.is_balance_cleared && b.status !== 'CANCELLED' ? (
                      <button 
                        onClick={() => handleVerifyCash(b._id)} 
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm hover:bg-emerald-700 transition-all"
                      >
                        {t('Verify Cash')}
                      </button>
                    ) : (
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${b.payout_status==='PAID'?'text-emerald-600':'text-slate-500'}`}>
                        {t(b.payout_status || "SETTLED")}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-6 py-4">{t('Transaction Detail')}</th>
                <th className="px-6 py-4">{t('Fulfillment Model')}</th>
                <th className="px-6 py-4 text-center">{t('Split Breakdown')}</th>
                <th className="px-6 py-4 text-right">{t('Actions')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              <AnimatePresence>
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                      {t('No matching transactions found.')}
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((b, idx) => (
                    <motion.tr
                      key={b._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{b.guestName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {format(new Date(b.checkIn), "MMM dd, yyyy")} • {t('REF')}: <span className="font-medium text-slate-700">{b.reservationCode}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${b.deposit_amount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {b.deposit_amount > 0 ? t("15% Flex Pay") : t("100% Upfront")}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                           <div className={`w-2 h-2 rounded-full ${b.is_balance_cleared ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                             {b.is_balance_cleared ? t("Balance Settled") : t("Awaiting Cash")}
                           </p>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                           <div className="text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Gross')}</p>
                              <p className="text-sm font-bold text-slate-900">{b.totalAmount.toLocaleString()}</p>
                           </div>
                           <ArrowUpRight className="w-4 h-4 text-slate-300" />
                           <div className="text-center px-3 py-1 bg-rose-50 rounded-lg">
                              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{t('Fee')}</p>
                              <p className="text-sm font-bold text-rose-600">-{b.commission_amount.toLocaleString()}</p>
                           </div>
                           <ArrowUpRight className="w-4 h-4 text-slate-300" />
                           <div className="text-center px-3 py-1 bg-emerald-50 rounded-lg">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('Your Net')}</p>
                              <p className="text-sm font-bold text-emerald-700">{(b.manager_net_payout).toLocaleString()}</p>
                           </div>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!b.is_balance_cleared && b.status !== 'CANCELLED' ? (
                            <button 
                              onClick={() => handleVerifyCash(b._id)} 
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-emerald-700 hover:shadow transition-all"
                            >
                              {t('Verify Cash')}
                            </button>
                          ) : (
                            <div className="flex flex-col items-end mr-2">
                              <span className={`text-[11px] font-bold uppercase tracking-wider ${b.payout_status==='PAID'?'text-emerald-600':'text-slate-500'}`}>
                                {t(b.payout_status || "SETTLED")}
                              </span>
                              {b.payout_status === 'CASH_SETTLED' && <p className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">{t('Verified on-site')}</p>}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTransaction(b);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title={t('View')}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                       </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination - Responsive */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-white">
            <div className="text-[11px] sm:text-sm text-slate-500 font-medium text-center sm:text-left">
              {t('Showing')} {Math.min(total, (currentPage - 1) * pageSize + 1)} {t('to')} {Math.min(currentPage * pageSize, total)} {t('of')} {total} {t('entries')}
            </div>
            {totalPages > 1 && (
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 sm:px-3 py-1 border rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal: Virtual Receipt - Responsive */}
      <AnimatePresence>
        {showDetailsModal && selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0, scale: 1 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 1 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] sm:mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">{t('Settlement Audit')}</h2>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{t('REF')}: {selectedTransaction.reservationCode}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-6">
                   <div className="p-3 sm:p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Manager Share (Digital)')}</p>
                      <p className="text-lg sm:text-2xl font-black text-slate-900">{Math.max(0, (selectedTransaction.amount_paid_online - selectedTransaction.commission_amount)).toLocaleString()} <span className="text-xs sm:text-sm font-medium text-slate-500">ETB</span></p>
                      <p className="text-[9px] sm:text-xs font-bold text-emerald-600 uppercase mt-1.5 sm:mt-2">{t('In Platform Escrow')}</p>
                   </div>
                   <div className="p-3 sm:p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-[8px] sm:text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">{t('Direct Cash Share')}</p>
                      <p className="text-lg sm:text-2xl font-black text-indigo-900">{selectedTransaction.balance_due.toLocaleString()} <span className="text-xs sm:text-sm font-medium text-indigo-500">ETB</span></p>
                      <p className="text-[9px] sm:text-xs font-bold text-indigo-700 uppercase mt-1.5 sm:mt-2">{t('Collected On-Site')}</p>
                   </div>
                 </div>

                 <div className="p-3 sm:p-5 bg-slate-900 rounded-xl flex items-center justify-between text-white shadow-lg">
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-bold text-white/60 uppercase tracking-wider mb-0.5 sm:mb-1">{t('Total Net Profit')}</p>
                      <p className="text-base sm:text-2xl font-black">{selectedTransaction.manager_net_payout.toLocaleString()} ETB</p>
                    </div>
                    <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-400 opacity-90" />
                 </div>

                 <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <Info className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] sm:text-sm text-slate-600 leading-relaxed">
                     {t('This booking followed the')} <strong>{selectedTransaction.deposit_amount > 0 ? t("Trust-Based Flex Pay") : t("Standard Full Pay")}</strong> {t('model. The platform commission was automatically deducted from the online portion. Verification alerts are logged for transparency.')}
                   </p>
                 </div>
              </div>

              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setShowDetailsModal(false)} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
                   {t('Close Audit')}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};