import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Ticket,
  Calendar,
  Star,
  Search,
  CalendarPlus,
  TriangleAlert,
  MapPin,
  ArrowRight,
  Sparkles,
  Bell,
  Clock,
  Compass,
  CircleCheck,
  RefreshCw,
  Tent,
  AlertCircle
} from "lucide-react";
import { useUser } from "../../../context/UserContext"
import api from "../../../services/api";
import { useTranslation } from "react-i18next";
import { cn } from "../../../SystemAdmin/ui/utils";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../SystemAdmin/ui/select";
import { Input } from "../../../SystemAdmin/ui/input";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, accent, bg, label, value, sub, subColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 flex items-center gap-4 transition-all duration-300 bg-white",
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : ""
      )}
      style={{ borderColor: accent ? accent + "30" : "#e5e7eb" }}
    >
      <div 
        className="p-3 rounded-xl flex-shrink-0"
        style={{ background: bg || "#f9fafb" }}
      >
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
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

export const CamperDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [stats, setStats] = useState({ active: 0, upcoming: 0, points: 0 });
  const [allBookings, setAllBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadAlert, setUnreadAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applicationState, setApplicationState] = useState(null);

  const [chartMetric, setChartMetric] = useState("bookings");
  const [chartRange, setChartRange] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/bookings/my-bookings");
      const bookings = res.data?.bookings || res.data?.data || [];
      const today = new Date();

      const activeCount = bookings.filter(
        (b) => ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID'].includes(b.status?.toUpperCase()) && new Date(b.checkIn) <= today && new Date(b.checkOut) >= today
      ).length;
      const upcomingCount = bookings.filter(
        (b) => ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID'].includes(b.status?.toUpperCase()) && new Date(b.checkIn) > today
      ).length;

      setStats({
        active: activeCount,
        upcoming: upcomingCount,
        points: user?.trustScore || 0,
      });

      setAllBookings(bookings);
      setRecentBookings(bookings.slice(0, 3));

      // Fetch role request status
      try {
        const appRes = await api.get('/role-requests/my-request');
        setApplicationState(appRes.data?.data);
      } catch (e) {
        console.error("Failed to fetch role request:", e);
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const all = res.data?.data || [];
      setNotifications(all);
      
      const alert = all.find(n => n.category === 'Alert' && !n.isRead);
      if (alert) {
        setUnreadAlert(alert);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchNotifications();
    } else setLoading(false);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (unreadAlert?._id === id) {
        setUnreadAlert(null);
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const chartData = useMemo(() => {
    if (!allBookings || allBookings.length === 0) return [];
    
    let filtered = allBookings;
    const now = new Date();
    
    if (chartRange !== 'all_time') {
      filtered = allBookings.filter(b => {
        const d = new Date(b.createdAt || b.checkIn);
        if (chartRange === 'today') {
           return d.toDateString() === now.toDateString();
        } else if (chartRange === 'this_week') {
           const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
           return d >= weekAgo;
        } else if (chartRange === 'this_month') {
           return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (chartRange === 'last_month') {
           const lm = new Date(now);
           lm.setMonth(lm.getMonth() - 1);
           return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
        } else if (chartRange === 'custom') {
           if (!startDate || !endDate) return true;
           const s = new Date(startDate);
           const e = new Date(endDate);
           e.setHours(23, 59, 59, 999);
           return d >= s && d <= e;
        }
        return true;
      });
    }

    const groups = {};
    filtered.forEach(b => {
      const d = new Date(b.createdAt || b.checkIn);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      if (!groups[dateKey]) {
        groups[dateKey] = { dateKey, label, bookings: 0, money: 0 };
      }
      groups[dateKey].bookings += 1;
      groups[dateKey].money += (b.totalAmount || 0);
    });

    return Object.values(groups).sort((a, b) => a.dateKey.localeCompare(b.dateKey)).map(g => ({
      label: g.label,
      value: chartMetric === 'money' ? g.money : g.bookings
    }));
  }, [allBookings, chartMetric, chartRange, startDate, endDate]);

  const displayName = user?.firstName || user?.fullName?.split(" ")[0] || user?.username || "Camper";

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-gray-200 rounded-xl w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* System Admin Style Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Welcome back')}, {displayName}</h1>
          <p className="text-gray-500 mt-1">{t('Manage your bookings and explore new campsites')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {t('Refresh')}
          </button>
          <button 
            onClick={() => navigate("/camper-dashboard/campsite-directory")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {t("Find Campsites")}
          </button>
          {(!applicationState || applicationState.rejectionCount < 3) && (
            <button 
              onClick={() => navigate("/camper-dashboard/list-your-camp")}
              disabled={applicationState?.status === 'pending'}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Tent className="w-4 h-4" />
              {applicationState?.status === 'pending' ? t("Application Pending Review") : t("List Your Camp")}
            </button>
          )}
        </div>
      </div>

      {applicationState?.status === 'pending' && (
        <div 
          onClick={() => navigate("/camper-dashboard/list-your-camp")}
          className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-100/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
              <TriangleAlert className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-sm">{t("Application Under Review")}</h3>
              <p className="text-gray-600 text-sm mt-0.5">{t("Your application to become a Camp Manager is currently under review by the System Admin. You will be notified once approved.")}</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition-colors shadow-sm group-hover:bg-blue-50 whitespace-nowrap hidden sm:block">
             {t("View Application")}
          </button>
        </div>
      )}

      {applicationState?.status === 'rejected' && applicationState?.rejectionCount < 3 && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-sm">{t("Application Rejected")}</h3>
              <p className="text-gray-600 text-sm mt-0.5">{t("Reason")}: {applicationState.rejectionReason}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/camper-dashboard/list-your-camp")}
            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-sm"
          >
            {t("Fix & Resubmit")}
          </button>
        </div>
      )}

      {unreadAlert && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between shadow-sm border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-orange-100">
              <TriangleAlert className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-sm">{t("System Alert")}</h3>
              <p className="text-gray-600 text-sm mt-0.5">{unreadAlert.title}</p>
            </div>
          </div>
          <button 
            onClick={() => handleMarkAsRead(unreadAlert._id)}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            {t("Dismiss")}
          </button>
        </div>
      )}

      {/* Dashboard Stats in System Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Ticket} 
          accent="#3b82f6" 
          bg="#eff6ff"
          label={t("Active Bookings")} 
          value={stats.active} 
          sub={t("Current bookings")}
          subColor="text-blue-600"
          onClick={() => navigate("/camper-dashboard/reservations")} 
        />
        <StatCard 
          icon={Calendar} 
          accent="#a855f7" 
          bg="#faf5ff"
          label={t("Upcoming Bookings")} 
          value={stats.upcoming} 
          sub={t("Upcoming trips")}
          subColor="text-purple-600"
          onClick={() => navigate("/camper-dashboard/reservations")} 
        />
        <StatCard 
          icon={Star} 
          accent="#ea580c" 
          bg="#fff7ed"
          label={t("Trust Score")} 
          value={stats.points} 
          sub={t("Platform progression")}
          subColor="text-orange-600"
          onClick={() => navigate("/camper-dashboard/profile")} 
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h3 className="font-semibold text-lg">{t('Activity Overview')}</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={chartMetric} onValueChange={setChartMetric}>
              <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                <SelectValue placeholder={t('Select Metric')} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="bookings">{t('Total Bookings')}</SelectItem>
                <SelectItem value="money">{t('Money Spent')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartRange} onValueChange={setChartRange}>
              <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                <SelectValue placeholder={t('Select Range')} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="today">{t('Today')}</SelectItem>
                <SelectItem value="this_week">{t('This Week')}</SelectItem>
                <SelectItem value="this_month">{t('This Month')}</SelectItem>
                <SelectItem value="last_month">{t('Last Month')}</SelectItem>
                <SelectItem value="all_time">{t('All Time')}</SelectItem>
                <SelectItem value="custom">{t('Custom Range')}</SelectItem>
              </SelectContent>
            </Select>

            {chartRange === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="w-auto bg-gray-50 border-gray-200 text-sm h-10" 
                />
                <span className="text-gray-400 text-sm font-medium">{t('to')}</span>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="w-auto bg-gray-50 border-gray-200 text-sm h-10" 
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="relative min-h-[300px]">
          {chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              {chartMetric === 'money' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMoney" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, t('Money Spent')]} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMoney)" />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [value, t('Bookings')]} 
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-sm gap-2">
              <Ticket className="w-8 h-8 text-gray-200" />
              {t('No data available for the selected range')}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-semibold text-lg text-gray-900">{t("Recent Activity")}</h3>
            <button 
              onClick={() => navigate("/camper-dashboard/reservations")} 
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1"
            >
              {t("View All")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {recentBookings.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <BookingItem
                    key={b._id}
                    image={b.tentId?.images?.[0] || b.campId?.images?.[0]}
                    title={b.tentId?.name || b.campId?.name || t("Campsite")}
                    place={b.campId?.location?.address || t("Location")}
                    date={`${new Date(b.checkIn).toLocaleDateString()} - ${new Date(b.checkOut).toLocaleDateString()}`}
                    status={b.status}
                    onClick={() => navigate(`/camper-dashboard/book/${b.campId?._id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50/30">
                <Compass className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">{t("No recent bookings found")}</p>
                <button 
                  onClick={() => navigate("/camper-dashboard/campsite-directory")}
                  className="mt-4 text-blue-600 text-sm font-semibold hover:underline"
                >
                  {t("Start Exploring")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-semibold text-lg text-gray-900">{t("Notifications")}</h3>
            <button 
              onClick={() => navigate("/camper-dashboard/notifications")} 
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t("See More")}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
            {notifications.slice(0, 4).map(n => (
              <NotificationItem
                key={n._id}
                title={n.title}
                message={n.message}
                isRead={n.isRead}
                onClick={() => handleMarkAsRead(n._id)}
              />
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm font-medium">{t("No notifications")}</p>
              </div>
            )}
            <button 
              onClick={() => navigate("/camper-dashboard/notifications")} 
              className="w-full mt-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold transition-colors border border-gray-100"
            >
              {t("View All Notifications")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const BookingItem = ({ image, title, place, date, status, onClick }) => {
  const { t } = useTranslation();
  return (
    <div 
      onClick={onClick} 
      className="flex items-center gap-5 p-5 hover:bg-gray-50 transition-all cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
        <img 
          src={image || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=200\u0026q=80"} 
          className="w-full h-full object-cover" 
          alt="" 
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{place}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 font-medium">
          <Clock className="w-3 h-3" />
          {date}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={cn(
          "text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider",
          ['confirmed', 'CONFIRMED', 'FULLY_PAID', 'COMPLETED'].includes(status) ? 'bg-green-50 text-green-700 border-green-100' : 
          ['pending', 'PENDING', 'PARTIALLY_PAID'].includes(status) ? 'bg-amber-50 text-amber-700 border-amber-100' : 
          'bg-red-50 text-red-700 border-red-100'
        )}>
          {t(status)}
        </span>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

const NotificationItem = ({ title, message, isRead, onClick }) => {
  const { t } = useTranslation();
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "p-3 rounded-xl border transition-all cursor-pointer",
        !isRead 
          ? 'bg-blue-50/50 border-blue-100 shadow-sm' 
          : 'bg-white border-transparent hover:bg-gray-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-xs font-bold text-gray-900 mb-0.5 truncate">{title}</h5>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{message}</p>
        </div>
        {!isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1 shadow-sm"></div>}
      </div>
    </div>
  );
};
