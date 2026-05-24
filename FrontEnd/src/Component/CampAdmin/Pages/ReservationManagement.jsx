import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, Plus, Calendar, CheckCircle2, Clock, LogOut, 
  MoreVertical, Eye, Download, X, ChevronLeft, ChevronRight, 
  Filter, BarChart2, RefreshCw, Loader2, Shield, Star, Menu
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Bar, ComposedChart, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api.js';
import { useUser } from '../../../context/UserContext.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';
import { RatingModal } from '../../Common/RatingModal.jsx';

export const ReservationManagement = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stats & Charts
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  
  // Filters & Pagination
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCamp, setSelectedCamp] = useState('');
  const [camps, setCamps] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [pageSize] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Modal
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [ratingModal, setRatingModal] = useState({ isOpen: false, bookingId: null, targetId: null, targetName: "" });

  // New manual reservation form states
  const [tents, setTents] = useState([]);
  const [loadingTents, setLoadingTents] = useState(false);
  const [createForm, setCreateForm] = useState({
    tentId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guests: 1,
    totalAmount: 0,
    amountPaid: 0,
    paymentType: 'CASH'
  });

  // Fetch tents for the dropdown when camp details are loaded
  useEffect(() => {
    if (camps.length > 0) {
      const fetchTents = async () => {
        setLoadingTents(true);
        try {
          const promises = camps.map(camp => 
            api.get(`/tents/camp/${camp._id}`)
              .then(res => res.data.data.map(tent => ({ ...tent, campName: camp.name })))
          );
          const results = await Promise.all(promises);
          setTents(results.flat());
        } catch (err) {
          console.error('Failed to fetch tents for manual reservation dropdown:', err);
        } finally {
          setLoadingTents(false);
        }
      };
      fetchTents();
    }
  }, [camps]);

  // Helper to calculate total amount based on price per night and check-in/out dates
  const calculateTotalAmount = (checkIn, checkOut, pricePerNight) => {
    if (!checkIn || !checkOut || !pricePerNight) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end - start;
    const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    return nights * pricePerNight;
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setCreateForm({
      tentId: '',
      checkIn: today,
      checkOut: tomorrow,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      guests: 1,
      totalAmount: 0,
      amountPaid: 0,
      paymentType: 'CASH'
    });
    setShowCreateModal(true);
  };

  const handleCreateDateOrTentChange = (field, val) => {
    const updatedForm = { ...createForm, [field]: val };
    if (field === 'checkIn' && updatedForm.checkOut < val) {
      updatedForm.checkOut = val;
    }
    
    // Find the price of the selected tent
    const selectedTent = tents.find(t => t._id === updatedForm.tentId);
    const tentPrice = selectedTent ? selectedTent.pricePerNight : 0;
    
    const newTotal = calculateTotalAmount(updatedForm.checkIn, updatedForm.checkOut, tentPrice);
    updatedForm.totalAmount = newTotal;
    updatedForm.amountPaid = newTotal;
    setCreateForm(updatedForm);
  };

  const handleCreateReservationSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.tentId) {
      toast.error(t('Please select a tent to occupy!'));
      return;
    }
    setCreating(true);
    try {
      await api.post('/bookings/manual-occupy', createForm);
      toast.success(t('Offline reservation successfully created!'));
      setShowCreateModal(false);
      fetchReservations(); // Refresh list
    } catch (err) {
      console.error('Failed to create manual reservation:', err);
      toast.error(err.response?.data?.message || t('Failed to create reservation'));
    } finally {
      setCreating(false);
    }
  };
  
  // Status options for tabs
  const statuses = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

  // Helper: format currency
  const formatCurrency = (amount) => `ETB ${amount?.toLocaleString() || 0}`;

  // Helper: get status badge color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Fetch stats and charts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reservations/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, []);

  // Fetch chart data
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await api.get('/reservations/charts');
        setChartData(res.data.weekly || []);
        setOccupancyData(res.data.occupancy || []);
      } catch (err) {
        console.error('Failed to fetch charts', err);
      }
    };
    fetchCharts();
  }, []);

  // Fetch camps for filter dropdown
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await api.get('/camps/my/camps');
        setCamps(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch camps', err);
      }
    };
    fetchCamps();
  }, []);

  // Fetch reservations with filters and pagination
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        status: activeStatus === 'All' ? undefined : activeStatus.toLowerCase(),
        search: searchTerm,
        campId: selectedCamp || undefined,
      };
      const res = await api.get('/reservations', { params });
      setReservations(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
      setError(t('Could not load reservations. Please try again.'));
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, activeStatus, searchTerm, selectedCamp, t]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Debounced search to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchReservations();
      } else {
        setCurrentPage(1); // will trigger useEffect again
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchReservations]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update reservation status (confirm / cancel)
  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      await api.patch(`/bookings/${reservationId}/status`, { status: newStatus });
      setReservations(prev => prev.map(r =>
        r._id === reservationId ? { ...r, status: newStatus } : r
      ));
      if (selectedReservation?._id === reservationId) {
        setSelectedReservation(prev => ({ ...prev, status: newStatus }));
      }
      const successMsg = newStatus === 'Confirmed' ? t('Reservation confirmed successfully') : t('Reservation cancelled successfully');
      toast.success(successMsg);
      fetchReservations();
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err.response?.data?.message || t('Failed to update reservation'));
    }
  };

  // Handle export to CSV
  const exportToCSV = () => {
    const headers = [t('Reservation ID'), t('Guest Name'), t('Camp'), t('Check-In'), t('Check-Out'), t('Status'), t('Amount')];
    const rows = reservations.map(r => [
      r.reservationCode || r._id,
      r.guestName,
      r.campName,
      new Date(r.checkIn).toLocaleDateString(),
      new Date(r.checkOut).toLocaleDateString(),
      t(r.status),
      formatCurrency(r.amount)
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats cards animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  // Skeleton loader
  if (loading) {
    return <IntelligenceLoader text={t("Initializing Reservations...")} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      
      {/* Mobile Header with Menu */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold text-slate-800"
          >
            {t('Reservation Management')}
          </motion.h1>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg p-4 space-y-3 z-20"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('Search by guest name or ID...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
              <button 
                onClick={openCreateModal}
                className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('New Reservation')}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-slate-800"
          >
            {t('Reservation Management')}
          </motion.h1>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('Search by guest name or ID...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64 bg-white shadow-sm"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors bg-white shadow-sm">
              <Bell className="w-5 h-5" />
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Reservation')}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t('Total Reservations'), value: stats.totalReservations, subtext: '+8.2% from last month', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', baseColor: 'bg-blue-500', filterVal: 'All' },
            { label: t('Active Bookings'), value: stats.activeBookings, subtext: 'Currently occupied', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', baseColor: 'bg-emerald-500', filterVal: 'Confirmed' },
            { label: t('Pending Approval'), value: stats.pendingApproval, subtext: 'Awaiting confirmation', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', baseColor: 'bg-amber-500', filterVal: 'Pending' },
            { label: t('Cancelled'), value: stats.cancelled || 0, subtext: 'Refunded/void', icon: LogOut, color: 'text-rose-500', bg: 'bg-rose-50', baseColor: 'bg-rose-500', filterVal: 'Cancelled' },
          ].map((stat, idx) => (
            <motion.div
              key={`${stat.label}-${idx}`}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
              onClick={() => {
                setActiveStatus(stat.filterVal);
                setCurrentPage(1);
              }}
              className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg flex flex-col justify-between cursor-pointer group overflow-hidden transition-shadow duration-300"
            >
              {/* L-Shape Color Accent */}
              <div className={`absolute bottom-0 left-0 w-full h-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:h-2`}></div>
              <div className={`absolute bottom-0 left-0 h-full w-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:w-2`}></div>
              
              <div className="relative z-10 flex items-start justify-between mb-4 pl-1">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">{stat.subtext}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8 mt-4 lg:mt-0">
          {/* Weekly Bookings Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 lg:p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-base lg:text-lg font-bold text-slate-800">{t('Weekly Bookings')}</h3>
              <button className="text-slate-400 hover:text-slate-600">
                <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>
            </div>
            <div className="h-48 lg:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                  <Bar dataKey="checkouts" name={t("Check-outs")} fill="#a7f3d0" radius={[4, 4, 0, 0]} barSize={20} />
                  <Area type="monotone" dataKey="bookings" name={t("Bookings")} fill="transparent" stroke="#0d9488" strokeWidth={2} dot={{ r: 3, fill: '#0d9488' }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Occupancy Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 lg:p-6 rounded-xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base lg:text-lg font-bold text-slate-800">{t('Camp Occupancy')}</h3>
              <span className="text-[10px] lg:text-xs font-medium text-slate-400">{t('This Month')}</span>
            </div>
            <div className="h-40 lg:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-1 mt-2">
              {occupancyData.map((entry, index) => (
                <div key={index} className="flex items-center text-[10px] lg:text-xs text-slate-600 font-medium">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-sm mr-1.5" style={{ backgroundColor: entry.color }}></div>
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile Filters Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{t('Filters & Status')}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${mobileFiltersOpen ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {mobileFiltersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-3 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setActiveStatus(status);
                          setCurrentPage(1);
                          setMobileFiltersOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeStatus === status 
                            ? 'bg-teal-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t(status)}
                      </button>
                    ))}
                  </div>
                  <select
                    value={selectedCamp}
                    onChange={(e) => {
                      setSelectedCamp(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-slate-200 bg-white text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">{t('All Camps')}</option>
                    {camps.map(camp => (
                      <option key={camp._id} value={camp._id}>{camp.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={exportToCSV}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4" /> {t('Export to CSV')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reservations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Desktop Table Header & Filters */}
          <div className="hidden lg:flex p-5 border-b border-slate-100 flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 bg-slate-100/50 p-1 rounded-lg">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeStatus === status 
                      ? 'bg-teal-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {t(status)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedCamp}
                onChange={(e) => {
                  setSelectedCamp(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 bg-white text-slate-700 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm"
              >
                <option value="">{t('All Camps')}</option>
                {camps.map(camp => (
                  <option key={camp._id} value={camp._id}>{camp.name}</option>
                ))}
              </select>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" /> {t('Export')}
              </button>
            </div>
          </div>

          {/* Table Content */}
          {error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="px-6 py-4">{t('Reservation ID')}</th>
                      <th className="px-6 py-4">{t('Guest Name')}</th>
                      <th className="px-6 py-4">{t('Camp')}</th>
                      <th className="px-6 py-4">{t('Check-In')}</th>
                      <th className="px-6 py-4">{t('Check-Out')}</th>
                      <th className="px-6 py-4">{t('Status')}</th>
                      <th className="px-6 py-4">{t('Amount')}</th>
                      <th className="px-6 py-4 text-center">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    <AnimatePresence>
                      {reservations.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                            {t('No reservations found.')}
                          </td>
                        </tr>
                      ) : (
                        reservations.map((res, idx) => {
                          const getInitials = (name) => {
                            if (!name) return "G";
                            const names = name.split(" ");
                            if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
                            return names[0].slice(0, 2).toUpperCase();
                          };
                          
                          return (
                            <motion.tr
                              key={res._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: idx * 0.03 }}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-6 py-4 font-bold text-teal-600">{res.reservationCode || res._id.slice(-6)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center border border-teal-50">
                                    <span className="text-teal-700 font-bold text-[10px] tracking-tighter">
                                      {getInitials(res.guestName)}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-slate-800">{res.guestName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{res.campName}</td>
                              <td className="px-6 py-4 text-slate-600">{new Date(res.checkIn).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-slate-600">{new Date(res.checkOut).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 w-max text-xs font-semibold rounded-full ${getStatusColor(res.status)}`}>
                                  {t(res.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {res.status?.toLowerCase() === 'completed' && !res.isRatedByManager && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRatingModal({
                                        isOpen: true,
                                        bookingId: res._id,
                                        targetId: res.userId?._id,
                                        targetName: res.userId?.fullName || res.guestName
                                      });
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-lg text-[10px] font-bold uppercase hover:bg-yellow-100 transition-colors"
                                  >
                                    <Star size={12} fill="currentColor" />
                                    {t('Rate Camper')}
                                  </button>
                                )}
                                {res.isRatedByManager && (
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase italic">
                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                    {t('Rated')}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-800 font-semibold">{formatCurrency(res.totalAmount || res.amount)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center space-x-3 text-slate-400">
                                  <button
                                    onClick={() => {
                                      setSelectedReservation(res);
                                      setShowDetailsModal(true);
                                    }}
                                    className="hover:text-teal-600 transition-colors"
                                    title={t('View')}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="hover:text-teal-600 transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden divide-y divide-slate-100">
                <AnimatePresence>
                  {reservations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      {t('No reservations found.')}
                    </div>
                  ) : (
                    reservations.map((res, idx) => {
                      const getInitials = (name) => {
                        if (!name) return "G";
                        const names = name.split(" ");
                        if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
                        return names[0].slice(0, 2).toUpperCase();
                      };
                      
                      return (
                        <motion.div
                          key={res._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center border border-teal-50 flex-shrink-0">
                                <span className="text-teal-700 font-bold text-xs tracking-tighter">
                                  {getInitials(res.guestName)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{res.guestName}</p>
                                <p className="text-xs text-slate-500 truncate">{res.campName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${getStatusColor(res.status)}`}>
                                {t(res.status)}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedReservation(res);
                                  setShowDetailsModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase">{t('Reservation ID')}</p>
                              <p className="text-slate-700 font-medium text-xs">{res.reservationCode || res._id.slice(-6)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase">{t('Amount')}</p>
                              <p className="text-slate-800 font-semibold text-xs">{formatCurrency(res.totalAmount || res.amount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(res.checkIn).toLocaleDateString()} → {new Date(res.checkOut).toLocaleDateString()}</span>
                            </div>
                            {res.status?.toLowerCase() === 'completed' && !res.isRatedByManager && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRatingModal({
                                    isOpen: true,
                                    bookingId: res._id,
                                    targetId: res.userId?._id,
                                    targetName: res.userId?.fullName || res.guestName
                                  });
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-600 rounded text-[9px] font-bold"
                              >
                                <Star size={10} fill="currentColor" />
                                {t('Rate')}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Pagination - Responsive */}
              {total > 0 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-4 border-t border-slate-100 bg-white">
                  <div className="text-xs lg:text-sm text-slate-500 font-medium order-2 lg:order-1">
                    {t('Showing')} {Math.min(total, (currentPage - 1) * pageSize + 1)} {t('to')} {Math.min(currentPage * pageSize, total)} {t('of')} {total}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex space-x-1 lg:space-x-2 order-1 lg:order-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 lg:p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      <div className="flex space-x-1 lg:space-x-2">
                        {[...Array(Math.min(3, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 3) pageNum = i + 1;
                          else if (currentPage <= 2) pageNum = i + 1;
                          else if (currentPage >= totalPages - 1) pageNum = totalPages - 2 + i;
                          else pageNum = currentPage - 1 + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`min-w-[32px] lg:min-w-[36px] px-2 lg:px-3 py-1 border rounded-lg text-xs lg:text-sm transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 lg:p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>

      {/* Modal: Reservation Details - Responsive */}
      <AnimatePresence>
        {showDetailsModal && selectedReservation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 lg:p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl lg:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-100">
                <h2 className="text-lg lg:text-xl font-bold text-slate-800">{t('Reservation Details')}</h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X className="w-4 h-4 lg:w-5 lg:h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Reservation ID')}</label>
                    <p className="text-sm lg:text-base text-slate-800 font-medium break-all">{selectedReservation.reservationCode || selectedReservation._id}</p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Status')}</label>
                    <p><span className={`inline-block px-2 py-1 text-[10px] lg:text-xs rounded-full ${getStatusColor(selectedReservation.status)}`}>{t(selectedReservation.status)}</span></p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Guest Name')}</label>
                    <p className="text-sm lg:text-base text-slate-800">{selectedReservation.guestName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Guest Email')}</label>
                    <p className="text-sm lg:text-base text-slate-800 break-all">{selectedReservation.guestEmail || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Camp')}</label>
                    <p className="text-sm lg:text-base text-slate-800">{selectedReservation.campName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Check-In')}</label>
                    <p className="text-sm lg:text-base text-slate-800">{new Date(selectedReservation.checkIn).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Check-Out')}</label>
                    <p className="text-sm lg:text-base text-slate-800">{new Date(selectedReservation.checkOut).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Total Amount')}</label>
                    <p className="text-sm lg:text-base text-slate-800 font-bold">{formatCurrency(selectedReservation.totalAmount || selectedReservation.amount)}</p>
                  </div>
                </div>
                {selectedReservation.specialRequests && (
                  <div>
                    <label className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase">{t('Special Requests')}</label>
                    <p className="text-sm lg:text-base text-slate-800">{selectedReservation.specialRequests}</p>
                  </div>
                )}
              </div>
              <div className="p-4 lg:p-6 border-t border-slate-100 bg-gray-50 flex flex-col sm:flex-row justify-end gap-2">
                {['pending', 'confirmed', 'partially_paid', 'fully_paid'].includes(selectedReservation.status?.toLowerCase()) && (
                  <>
                    {selectedReservation.status?.toLowerCase() === 'pending' && (
                      <button
                        onClick={() => updateReservationStatus(selectedReservation._id, 'Confirmed')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      >
                        {t('✓ Confirm')}
                      </button>
                    )}
                    <button
                      onClick={() => updateReservationStatus(selectedReservation._id, 'Cancelled')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      {t('✕ Cancel Booking')}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                >
                  {t('Close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Create Reservation - Responsive */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 lg:p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl lg:rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-slate-800">{t('Create Manual Reservation')}</h2>
                  <p className="text-[10px] lg:text-xs text-slate-500 mt-1">{t('Book an offline walk-in guest')}</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-4 h-4 lg:w-5 lg:h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleCreateReservationSubmit} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                <div>
                  <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Choose Tent *')}</label>
                  {loadingTents ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin text-teal-600" />
                      <span>{t('Loading tents...')}</span>
                    </div>
                  ) : tents.length === 0 ? (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2 lg:p-3 rounded-lg border border-rose-100">
                      {t('No tents found.')}
                    </div>
                  ) : (
                    <select
                      value={createForm.tentId}
                      onChange={(e) => handleCreateDateOrTentChange('tentId', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm cursor-pointer"
                      required
                    >
                      <option value="">{t('-- Select Tent --')}</option>
                      {tents.map(tent => (
                        <option key={tent._id} value={tent._id}>
                          {tent.campName} - {tent.name} ({tent.pricePerNight} ETB)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Check-In')}</label>
                    <input 
                      type="date" 
                      value={createForm.checkIn} 
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleCreateDateOrTentChange('checkIn', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Check-Out')}</label>
                    <input 
                      type="date" 
                      value={createForm.checkOut} 
                      min={createForm.checkIn}
                      onChange={(e) => handleCreateDateOrTentChange('checkOut', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Guest Name *')}</label>
                    <input 
                      type="text" 
                      placeholder="Full name"
                      value={createForm.guestName}
                      onChange={(e) => setCreateForm({...createForm, guestName: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Guest Email')}</label>
                    <input 
                      type="email" 
                      placeholder="Email address"
                      value={createForm.guestEmail}
                      onChange={(e) => setCreateForm({...createForm, guestEmail: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Guest Phone')}</label>
                    <input 
                      type="tel" 
                      placeholder="Phone number"
                      value={createForm.guestPhone}
                      onChange={(e) => setCreateForm({...createForm, guestPhone: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase mb-1">{t('Number of Guests')}</label>
                    <input 
                      type="number" 
                      min="1"
                      value={createForm.guests}
                      onChange={(e) => setCreateForm({...createForm, guests: parseInt(e.target.value) || 1})}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 lg:p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-[10px] lg:text-xs font-bold text-slate-700 uppercase tracking-wider">{t('Payment Details')}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase mb-1">{t('Total Amount')}</label>
                      <input 
                        type="number" 
                        min="0"
                        value={createForm.totalAmount}
                        onChange={(e) => setCreateForm({...createForm, totalAmount: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase mb-1">{t('Amount Paid')}</label>
                      <input 
                        type="number" 
                        min="0"
                        max={createForm.totalAmount}
                        value={createForm.amountPaid}
                        onChange={(e) => setCreateForm({...createForm, amountPaid: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase mb-1">{t('Payment Method')}</label>
                    <select
                      value={createForm.paymentType}
                      onChange={(e) => setCreateForm({...createForm, paymentType: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white cursor-pointer"
                    >
                      <option value="CASH">{t('Cash Payment')}</option>
                      <option value="ONLINE">{t('Online Payment')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors order-2 sm:order-1"
                  >
                    {t('Cancel')}
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating || tents.length === 0} 
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {t('Make Reservation')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
        bookingId={ratingModal.bookingId}
        targetId={ratingModal.targetId}
        targetName={ratingModal.targetName}
        targetType="User"
        onSuccess={() => fetchReservations()}
      />
    </div>
  );
};