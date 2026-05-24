import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Bell, Download, ChevronDown,
  Banknote, CalendarCheck, Tent, Users,
  TrendingUp, TrendingDown, MoreHorizontal, X,
  CheckCircle, XCircle, Eye, AlertCircle, RefreshCw, AlertTriangle, MapPin, Loader, Shield, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../SystemAdmin/ui/select";
import { Input } from "../../../SystemAdmin/ui/input";
import api from '../../../services/api';
import { useUser } from '../../../context/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import toast, { Toaster } from 'react-hot-toast';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';
import { useTranslation } from 'react-i18next';

export const CampAdminDashboard = () => {
  const { t } = useTranslation();
  const { user, loadingUser } = useUser();

  // Helper: Get initials from name
  const getInitials = (name) => {
    if (!name) return "G";
    const names = name.split(" ");
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
    return names[0].slice(0, 2).toUpperCase();
  };

  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date range state
  const [dateRange, setDateRange] = useState('today'); // 'today', 'week', 'month', 'year'

  // Chart data states
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [campDistribution, setCampDistribution] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chartCategory, setChartCategory] = useState('revenue'); // 'revenue', 'campers', 'redundancy'
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [camperStats, setCamperStats] = useState(null);
  const [loadingCamperStats, setLoadingCamperStats] = useState(false);
  const [camperSearchQuery, setCamperSearchQuery] = useState('');
  const [foundCampers, setFoundCampers] = useState([]);
  const [selectedCamper, setSelectedCamper] = useState(null);
  const [isSearchingCamper, setIsSearchingCamper] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'camps', 'bookings', 'preview'
  const [campsList, setCampsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [previewBooking, setPreviewBooking] = useState(null);
  const [previewCamperDetails, setPreviewCamperDetails] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  
  // Welcome Popup state
  const [showWelcome, setShowWelcome] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  // Check for welcome param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove the param from URL without refreshing
      const newPath = location.pathname;
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  const formatCurrency = (amount) => `ETB ${amount?.toLocaleString() ?? 0}`;

  // Fetch stats based on date range
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/dashboard/stats', { params: { range: dateRange } });
      const statsData = res.data.stats;
      setStats({
        totalMyCamps: statsData.totalMyCamps,
        activeBookings: statsData.activeBookings,
        totalRevenue: statsData.totalRevenue || 0,
        activeUsers: statsData.activeUsers || 0,
        redundancyRate: statsData.redundancyRate || 0,
        revenueGrowth: statsData.revenueGrowth || 0,
        reservationsGrowth: statsData.reservationsGrowth || 0,
        usersGrowth: statsData.usersGrowth || 0,
      });
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [dateRange]);

  // Fetch recent bookings (limited to 4) respecting date range
  const fetchRecentBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get('/dashboard/manager/recent-bookings', {
        params: { limit: 4, range: dateRange }
      });
      const bookingsData = res.data.data;
      const formatted = bookingsData.map(booking => ({
        _id: booking._id,
        guest: booking.camperId?.fullName || 'Guest',
        image: booking.camperId?.profilePicture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        campSite: booking.campId?.name || 'Unknown Camp',
        dates: new Date(booking.createdAt).toLocaleDateString(),
        amount: formatCurrency(booking.totalAmount || 0),
        status: booking.status,
        camperId: booking.camperId?._id,
        campId: booking.campId?._id,
        bookingDetails: booking
      }));
      setRecentBookings(formatted);
    } catch (err) {
      console.error('Recent bookings fetch error:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [dateRange]);

  // Fetch charts data
  const fetchChartsData = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const params = { 
        range: dateRange, 
        category: chartCategory,
        camperId: selectedCamper?._id,
        ...(dateRange === 'custom' && { startDate: customDates.start, endDate: customDates.end })
      };
      
      const revenueRes = await api.get('/dashboard/charts/revenue', { params });
      setRevenueChartData(revenueRes.data.data);

      const distRes = await api.get('/dashboard/charts/camp-distribution', { params: { range: dateRange } });
      setCampDistribution(distRes.data.data);
    } catch (err) {
      console.error('Charts fetch error:', err);
    } finally {
      setLoadingCharts(false);
    }
  }, [dateRange, chartCategory, customDates, selectedCamper]);

  // Search for campers
  const searchCampers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setFoundCampers([]);
      return;
    }
    setIsSearchingCamper(true);
    try {
      // Assuming there's a search endpoint or we use the users endpoint
      const res = await api.get(`/users/search?q=${query}`);
      setFoundCampers(res.data.data || []);
    } catch (err) {
      console.error('Camper search error:', err);
    } finally {
      setIsSearchingCamper(false);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await api.get('/alerts/manager');
      const alertsData = res.data.data;
      setAlerts(alertsData);
      const unread = alertsData.filter(a => !a.read).length;
      setUnreadAlertsCount(unread);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  // Mark alert as read
  const markAlertRead = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, read: true } : a));
      setUnreadAlertsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadDashboard = async () => {
      if (isInitialLoad) {
        setLoading(true);
        await Promise.all([fetchStats(), fetchRecentBookings(), fetchChartsData(), fetchAlerts()]);
        setLoading(false);
        setIsInitialLoad(false);
      }
    };
    loadDashboard();
  }, [fetchStats, fetchRecentBookings, fetchChartsData, fetchAlerts, isInitialLoad]);

  // Reload data background when date range changes (without full page loading)
  useEffect(() => {
    if (!isInitialLoad) {
      fetchStats();
      fetchRecentBookings();
      fetchChartsData();
    }
  }, [dateRange, fetchStats, fetchRecentBookings, fetchChartsData, isInitialLoad]);

  // Fetch camps list
  useEffect(() => {
    if (activeModal === 'camps' && campsList.length === 0 && !loadingCamps) {
      const fetchCamps = async () => {
        setLoadingCamps(true);
        try {
          const res = await api.get('/camps/my/camps');
          setCampsList(res.data.data);
        } catch (err) {
          console.error('Failed to fetch camps', err);
        } finally {
          setLoadingCamps(false);
        }
      };
      fetchCamps();
    }
  }, [activeModal, campsList.length, loadingCamps]);

  // Fetch full bookings list for modal
  useEffect(() => {
    if (activeModal === 'bookings' && bookingsList.length === 0 && !loadingBookings) {
      const fetchBookings = async () => {
        setLoadingBookings(true);
        try {
          const res = await api.get('/dashboard/manager/recent-bookings', { params: { limit: 100, range: dateRange } });
          setBookingsList(res.data.data);
        } catch (err) {
          console.error('Failed to fetch bookings', err);
        } finally {
          setLoadingBookings(false);
        }
      };
      fetchBookings();
    }
  }, [activeModal, bookingsList.length, loadingBookings, dateRange]);

  // Fetch camper details for preview
  const fetchCamperDetailsForPreview = async (camperId, campId) => {
    // Extract IDs if objects were passed
    const cId = typeof camperId === 'object' ? (camperId?._id || camperId?.id) : camperId;
    const cmpId = typeof campId === 'object' ? (campId?._id || campId?.id) : campId;

    if (!cId || cId === "[object Object]") {
      console.error('Invalid camperId provided to preview:', camperId);
      return;
    }

    setLoadingPreview(true);
    setLoadingCamperStats(true);
    try {
      const [detailsRes, statsRes] = await Promise.all([
        api.get(`/users/camper/${cId}/details`, { params: { campId: cmpId } }),
        api.get(`/dashboard/camper/${cId}/stats`)
      ]);
      setPreviewCamperDetails(detailsRes.data.data);
      setCamperStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch camper data', err);
      setPreviewCamperDetails(null);
      setCamperStats(null);
    } finally {
      setLoadingPreview(false);
      setLoadingCamperStats(false);
    }
  };

  const openPreviewModal = (booking) => {
    setPreviewBooking(booking);
    fetchCamperDetailsForPreview(booking.camperId, booking.campId);
    setActiveModal('preview');
  };

  const closeModal = () => {
    setActiveModal(null);
    setPreviewBooking(null);
    setPreviewCamperDetails(null);
    setCamperStats(null);
  };

  // Handle accept/reject booking
  const updateBookingStatus = async (bookingId, newStatus) => {
    // Robustly extract ID
    const bId = typeof bookingId === 'object' ? (bookingId?._id || bookingId?.id) : bookingId;

    if (!bId || bId === "[object Object]") {
      console.error('Invalid bookingId provided for status update:', bookingId);
      return;
    }

    try {
      await api.patch(`/bookings/${bId}/status`, { status: newStatus });
      // Refresh data
      await fetchRecentBookings();
      if (activeModal === 'bookings') {
        // Refresh full list if modal open
        const res = await api.get('/dashboard/manager/recent-bookings', { params: { limit: 100, range: dateRange } });
        setBookingsList(res.data.data);
      }
      await fetchStats();
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  // Export functions
  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportBookings = () => {
    const exportData = bookingsList.length ? bookingsList.map(b => ({
      'Guest Name': b.camperId?.fullName || 'Guest',
      'Email': b.camperId?.email || '',
      'Camp': b.campId?.name || 'Unknown',
      'Booking Date': new Date(b.createdAt).toLocaleDateString(),
      'Amount': b.totalAmount,
      'Status': b.status
    })) : recentBookings.map(b => ({
      'Guest Name': b.guest,
      'Camp': b.campSite,
      'Booking Date': b.dates,
      'Amount': b.amount,
      'Status': b.status
    }));
    exportToCSV(exportData, `bookings_${dateRange}`);
  };

  const exportRevenueData = () => {
    exportToCSV(revenueChartData, `revenue_${dateRange}`);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRangeLabel = () => {
    const labels = { today: 'Today', week: 'This Week', month: 'This Month', lastMonth: 'Last Month', year: 'This Year' };
    return labels[dateRange] || 'Today';
  };

  // Colors for pie chart
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#A569BD'];

  if (loading || loadingUser) {
    return <IntelligenceLoader text="Initializing Dashboard..." icon={Activity} />;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>Error loading dashboard: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t("Camp Manager Dashboard")}</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reservations, camps..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-72 bg-white"
            />
          </div>
          <button
            onClick={() => setShowAlertsPanel(!showAlertsPanel)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
        </div>
      </div>

      {/* Urgent Alert Sign for Manager */}
      {alerts.some(a => !a.read && (a.category === 'Alert' || a.type === 'warning')) && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-xl text-white">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-amber-800 font-bold text-lg">Official System Alert</h3>
              <p className="text-amber-600 text-sm">The administration has sent you an important message regarding your camps or account.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAlertsPanel(true)}
            className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-md"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Alerts Slide-out Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${showAlertsPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">Alerts & Notifications</h3>
          <button onClick={() => setShowAlertsPanel(false)} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {loadingAlerts ? (
            <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-teal-600" /></div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No alerts</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map(alert => (
                <div key={alert._id} className={`p-4 ${!alert.read ? 'bg-teal-50' : ''} hover:bg-slate-50 transition-colors`}>
                  <div className="flex items-start gap-3">
                    {alert.category === 'Appeal' ? (
                      <AlertTriangle className="w-5 h-5 mt-0.5 text-orange-500" />
                    ) : (
                      <AlertCircle className={`w-5 h-5 mt-0.5 ${alert.type === 'warning' ? 'text-amber-500' : 'text-teal-500'}`} />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                      {alert.category === 'Appeal' && (
                        <button
                          onClick={() => {
                            markAlertRead(alert._id);
                            navigate('/manager/users?tab=appeals');
                          }}
                          className="mt-2 w-full py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-bold hover:bg-orange-600 transition-colors"
                        >
                          Review Appeal
                        </button>
                      )}
                      <p className="text-xs text-slate-400 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    {!alert.read && alert.category !== 'Appeal' && (
                      <button onClick={() => markAlertRead(alert._id)} className="text-xs text-teal-600 hover:underline">Mark read</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 flex items-center justify-between mb-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {t("Welcome back")}, {user?.fullName || t("Camp Manager")}! <span className="text-2xl">👋</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t("Here's what's happening at your camps today.")}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportBookings}
            className="flex items-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t("Export Bookings")}</span>
          </button>
          <div className="relative">
            <button
              className="flex items-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <span>{getRangeLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="today">{t("Today")}</option>
              <option value="week">{t("This Week")}</option>
              <option value="month">{t("This Month")}</option>
              <option value="lastMonth">{t("Last Month")}</option>
              <option value="year">{t("This Year")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        {[
          { 
            label: t('Total Revenue'), value: stats?.totalRevenue || stats?.totalRevenue === 0 ? formatCurrency(stats.totalRevenue) : formatCurrency(0), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', baseColor: 'bg-emerald-500',
            bottom: (
              <div className="flex items-center text-sm relative z-10">
                {stats?.revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                <span className={stats?.revenueGrowth >= 0 ? "text-emerald-500" : "text-red-500"}>{Math.abs(stats?.revenueGrowth || 0)}%</span>
                <span className="text-slate-400 ml-1 truncate">{t("vs last period")}</span>
              </div>
            )
          },
          { 
            label: t('Active Bookings'), value: stats?.activeBookings || 0, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50', baseColor: 'bg-blue-500',
            onClick: () => setActiveModal('bookings'),
            bottom: (
              <div className="flex items-center text-sm relative z-10">
                {stats?.reservationsGrowth >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                <span className={stats?.reservationsGrowth >= 0 ? "text-emerald-500" : "text-red-500"}>{Math.abs(stats?.reservationsGrowth || 0)}%</span>
                <span className="text-slate-400 ml-1 truncate">{t("vs last period")}</span>
              </div>
            )
          },
          { 
            label: t('Your Camps'), value: stats?.totalMyCamps || 0, icon: Tent, color: 'text-amber-500', bg: 'bg-amber-50', baseColor: 'bg-amber-500',
            onClick: () => setActiveModal('camps'),
            bottom: <div className="h-5"></div>
          },
          { 
            label: t('Net Payout'), value: formatCurrency(user?.net_payout || 0), icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50', baseColor: 'bg-teal-500',
            onClick: () => navigate('/manager-dashboard/payments'),
            bottom: <span className="text-teal-600 font-bold text-sm truncate relative z-10">{t("Available for withdrawal")}</span>
          },
          { 
            label: t('User Redundancy'), value: `${stats?.redundancyRate || 0}%`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', baseColor: 'bg-purple-500',
            bottom: <span className="text-xs text-slate-400 truncate relative z-10">{t("Returning customer rate")}</span>
          }
        ].map((stat, idx) => (
          <motion.div
            key={`${stat.label}-${idx}`}
            custom={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
            onClick={stat.onClick}
            className={`relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg flex flex-col justify-between group overflow-hidden transition-shadow duration-300 ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            {/* L-Shape Color Accent */}
            <div className={`absolute bottom-0 left-0 w-full h-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:h-2`}></div>
            <div className={`absolute bottom-0 left-0 h-full w-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:w-2`}></div>

            <div className="relative z-10 flex items-start justify-between mb-4 pl-1">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                {loadingStats ? (
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                )}
              </div>
            </div>
            {stat.bottom && <div className="pl-1">{loadingStats ? <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div> : stat.bottom}</div>}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t("Performance Analytics")}</h3>
            <div className="flex items-center gap-3">
              <Select value={chartCategory} onValueChange={setChartCategory}>
                <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-xs font-bold text-slate-600 h-9">
                  <SelectValue placeholder={t('Metric')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="revenue">{t('Total Revenue')}</SelectItem>
                  <SelectItem value="campers">{t('Total Campers')}</SelectItem>
                  <SelectItem value="redundancy">{t('Redundancy Rate')}</SelectItem>
                  <SelectItem value="camper_bookings">{t('Specific Camper')}</SelectItem>
                </SelectContent>
              </Select>

              {chartCategory === 'camper_bookings' && (
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 animate-in fade-in slide-in-from-left-4">
                    <Search className="w-3 h-3 text-slate-400" />
                    <input 
                      type="text"
                      placeholder={t("Name, Email or Phone...")}
                      className="bg-transparent border-none outline-none text-xs w-40 placeholder:text-slate-300"
                      value={camperSearchQuery}
                      onChange={(e) => {
                        setCamperSearchQuery(e.target.value);
                        searchCampers(e.target.value);
                      }}
                    />
                    {selectedCamper && (
                      <button onClick={() => { setSelectedCamper(null); setCamperSearchQuery(''); }} className="text-red-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {foundCampers.length > 0 && !selectedCamper && (
                    <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 mt-2 max-h-48 overflow-y-auto overflow-hidden divide-y divide-slate-50">
                      {foundCampers.map(camper => (
                        <div 
                          key={camper._id} 
                          onClick={() => {
                            setSelectedCamper(camper);
                            setCamperSearchQuery(camper.fullName);
                            setFoundCampers([]);
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">
                            {getInitials(camper.fullName)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{camper.fullName}</p>
                            <p className="text-[10px] text-slate-400">{camper.email || camper.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-xs font-bold text-slate-600 h-9">
                  <SelectValue placeholder={t('Range')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="today">{t('Today')}</SelectItem>
                  <SelectItem value="week">{t('This Week')}</SelectItem>
                  <SelectItem value="month">{t('This Month')}</SelectItem>
                  <SelectItem value="lastMonth">{t('Last Month')}</SelectItem>
                  <SelectItem value="year">{t('This Year')}</SelectItem>
                  <SelectItem value="custom">{t('Custom')}</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={exportRevenueData}
                className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1 ml-2 font-bold"
              >
                <Download className="w-4 h-4" /> {t("Export")}
              </button>
            </div>
          </div>
          <div className="h-64 relative">
            {loadingCharts && (
              <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('Syncing Analytics...')}</p>
              </div>
            )}
            
            {revenueChartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                {chartCategory === 'revenue' ? (
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value) => [formatCurrency(value), t('Revenue')]} 
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                ) : (
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value) => [value, t(chartCategory)]} 
                    />
                    <Bar 
                      dataKey={chartCategory === 'campers' ? 'count' : 'rate'} 
                      fill="#3b82f6" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32} 
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-slate-400 font-medium">
                {t("No analytics data for selected period")}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t("Revenue Distribution")}</h3>
          <div className="h-64">
            {loadingCharts && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            )}
            {campDistribution.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={campDistribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    animationDuration={1000}
                  >
                    {campDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-slate-400 font-medium">{t("No distribution data")}</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col mb-8 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{t("Recent Reservations")}</h3>
          <button
            onClick={() => setActiveModal('bookings')}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
          >
            {t("View All")}
          </button>
        </div>
        <div className="overflow-x-auto relative min-h-[200px]">
          {loadingBookings && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-500 animate-pulse uppercase tracking-widest">{t("Syncing Reservations...")}</p>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Guest")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Camp Site")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Booking Date")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Amount")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Status")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center border border-teal-50 mr-3">
                          <span className="text-teal-700 font-bold text-xs">
                            {getInitials(booking.guest)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{booking.guest}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{booking._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{booking.campSite}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{booking.dates}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-800">{booking.amount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openPreviewModal(booking)}
                          className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg transition-colors"
                          title="Preview Camper"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {booking.status?.toLowerCase() === 'pending' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'Confirmed')}
                              className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-lg transition-colors"
                              title="Accept"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'Cancelled')}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No recent bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Camps List */}
      {activeModal === 'camps' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Your Camps</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingCamps ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
              ) : campsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No camps found. Create your first camp!</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campsList.map(camp => (
                    <div key={camp._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <h3 className="font-bold text-lg text-slate-800">{camp.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {typeof camp.location === 'string' ? camp.location : (camp.location?.address || 'Location not set')}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          camp.businessStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          camp.businessStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {camp.businessStatus || camp.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bookings List (Full) */}
      {activeModal === 'bookings' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">All Bookings</h2>
              <div className="flex gap-2">
                <button onClick={exportBookings} className="text-teal-600 text-sm flex items-center gap-1 px-3 py-1 border rounded-lg"><Download className="w-4 h-4"/> Export</button>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingBookings ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
              ) : bookingsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No bookings yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Guest</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Camp</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsList.map(booking => (
                        <tr key={booking._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                {getInitials(booking.camperId?.fullName || 'Guest')}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{booking.camperId?.fullName || 'Guest'}</div>
                                <div className="text-[10px] text-slate-500">{booking.camperId?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">{booking.campId?.name || 'Unknown'}</td>
                          <td className="py-3">{new Date(booking.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 font-semibold">{formatCurrency(booking.totalAmount)}</td>
                          <td className="py-3"><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span></td>
                          <td className="py-3">
                            <button
                              onClick={() => openPreviewModal({ ...booking, campSite: booking.campId?.name, guest: booking.camperId?.fullName, image: booking.camperId?.profilePicture })}
                              className="text-teal-600 hover:text-teal-800"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Preview Camper Details */}
      {activeModal === 'preview' && previewBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Camper Details</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar">
              {loadingPreview ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
              ) : previewCamperDetails ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {previewCamperDetails.profilePicture ? (
                      <img src={previewCamperDetails.profilePicture} className="w-16 h-16 rounded-full object-cover border-2 border-teal-200" alt="Camper" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-200 text-teal-700 font-bold text-xl">
                        {getInitials(previewCamperDetails.fullName)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{previewCamperDetails.fullName}</h3>
                      <p className="text-sm text-slate-500">Member since {new Date(previewCamperDetails.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Email:</span> <span className="font-medium">{previewCamperDetails.email}</span></div>
                    <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{previewCamperDetails.phoneNumber || 'Not provided'}</span></div>
                    <div><span className="text-slate-500">Trust Rating:</span> <span className="font-medium text-amber-600">{previewCamperDetails.trustRating || '★☆☆☆☆'}</span></div>
                    <div><span className="text-slate-500">Total Bookings:</span> <span className="font-medium">{previewCamperDetails.totalBookings || 0}</span></div>
                  </div>
                  <div className="border-t pt-3 mt-2">
                    <p className="text-sm font-semibold">Past stays at this camp:</p>
                    {previewCamperDetails.pastStaysAtThisCamp?.length ? (
                      <ul className="text-sm text-slate-600 mt-1 space-y-1">
                        {previewCamperDetails.pastStaysAtThisCamp.map((stay, idx) => (
                          <li key={idx}>✔️ {stay.dates} – {stay.status === 'completed' ? 'Completed ✅' : stay.status}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No previous stays at this camp.</p>
                    )}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg mt-2">
                    <p className="text-xs text-slate-500">Current booking: <span className="font-medium">{previewBooking.campSite}</span> on {previewBooking.dates}</p>
                  </div>

                  {/* Camper Specific Dashboard Stats */}
                  {camperStats && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t pt-4 mt-4 space-y-4"
                    >
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-600" />
                        Camper Performance Profile
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
                          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Success Rate</p>
                          <p className="text-lg font-black text-teal-900">{camperStats.successPercentage || 0}%</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Stays</p>
                          <p className="text-lg font-black text-blue-900">{camperStats.totalBookings}</p>
                        </div>
                      </div>

                      {/* Status Distribution Graph */}
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Outcome Distribution</p>
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={camperStats.outcomeDistribution || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {(camperStats.outcomeDistribution || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#0d9488', '#f59e0b', '#ef4444', '#6366f1'][index % 4]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Tent Frequency Graph */}
                      {camperStats.tentPreferences?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Tent Preferences</p>
                          <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={camperStats.tentPreferences} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px' }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Outcome Summary</p>
                        <div className="flex flex-wrap gap-4">
                          {(camperStats.outcomeDistribution || []).map((item) => (
                            <div key={item.name} className="flex flex-col">
                              <span className="text-xs font-bold">{item.value}</span>
                              <span className="text-[9px] uppercase tracking-tighter opacity-60">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load camper details.</div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              {previewBooking.status?.toLowerCase() === 'pending' && (
                <>
                  <button onClick={() => updateBookingStatus(previewBooking._id, 'Confirmed')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Accept</button>
                  <button onClick={() => updateBookingStatus(previewBooking._id, 'Cancelled')} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Reject</button>
                </>
              )}
              <button onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowWelcome(false)}
            />
            
            {/* Confetti effect */}
            <Confetti
              width={width}
              height={height}
              numberOfPieces={200}
              recycle={false}
              gravity={0.1}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl overflow-hidden max-w-lg w-full p-8 text-center"
            >
              {/* Decorative background circle */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-50 rounded-full z-0" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-50 rounded-full z-0" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-teal-200">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Aboard!</h2>
                <p className="text-teal-600 font-bold mb-6">Your Manager Account is Fully Approved</p>
                
                <p className="text-slate-500 leading-relaxed mb-8">
                  Congratulations, <strong>{user?.fullName}</strong>! Your documentation has been verified and your camp is now live. You can now manage tents, accept reservations, and track your revenue.
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Get Started
                  </button>
                  <p className="text-xs text-slate-400">
                    Need help? Check out our <span className="text-teal-600 cursor-pointer hover:underline">Quick Start Guide</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add global animation keyframes via style tag (if not in global CSS) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

