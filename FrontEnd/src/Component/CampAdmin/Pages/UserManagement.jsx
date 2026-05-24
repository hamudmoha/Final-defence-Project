import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Calendar, Tent, CreditCard, User, Ban, CheckCircle,
  ChevronLeft, ChevronRight, AlertCircle, Loader, BarChart3, Users,
  UserCheck, UserX, Activity, Eye, MoreVertical, X, RefreshCw, Check, Send, Shield, Clock, FileText
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../../services/api.js";
import toast, { Toaster } from "react-hot-toast";
import { useUser } from "../../../context/UserContext.jsx";
import ModerationHistoryView from "../../../SystemAdmin/components/ModerationHistoryView.jsx";
import { IntelligenceLoader } from "../../Common/IntelligenceLoader.jsx";

export const CampAdminUserManagement = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useUser();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "all";
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, totalBookings: 0, pendingAppeals: 0 });
  const [updatingBan, setUpdatingBan] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [banReason, setBanReason] = useState("");
  const [userWarnings, setUserWarnings] = useState([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab); // all, active, banned, appeals
 
  const [conflictMessage, setConflictMessage] = useState("");
  const [submittingConflict, setSubmittingConflict] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [tentFilter, setTentFilter] = useState("");
  const [tents, setTents] = useState([]);
  const [sortBy, setSortBy] = useState("name"); // name, date, bookings
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch users and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersRes = await api.get("/manager/users?includeBookings=true");
        if (usersRes.data.success) {
          setUsers(usersRes.data.data);
        }

        const statsRes = await api.get("/manager/users/stats");
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }

        const tentsRes = await api.get("/tents");
        if (tentsRes.data.success) {
          setTents(tentsRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(t("Failed to fetch user data."));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // Compute completely dynamic chart data from actual users and bookings
  const computedChartData = useMemo(() => {
    const months = [];
    // Generate last 6 months dynamically
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        users: 0,
        bookings: 0,
        yearMonth: `${d.getFullYear()}-${d.getMonth()}`
      });
    }

    users.forEach(u => {
      // Tally users based on creation date
      if (u.createdAt) {
        const d = new Date(u.createdAt);
        const ym = `${d.getFullYear()}-${d.getMonth()}`;
        const match = months.find(m => m.yearMonth === ym);
        if (match) match.users += 1;
      }
      
      // Tally bookings
      if (u.bookings && Array.isArray(u.bookings)) {
        u.bookings.forEach(b => {
          if (b.createdAt) {
             const bd = new Date(b.createdAt);
             const bym = `${bd.getFullYear()}-${bd.getMonth()}`;
             const bMatch = months.find(m => m.yearMonth === bym);
             if (bMatch) bMatch.bookings += 1;
          }
        });
      } else if (u.totalBookings) {
          if (u.lastBookingDate) {
             const bd = new Date(u.lastBookingDate);
             const bym = `${bd.getFullYear()}-${bd.getMonth()}`;
             const bMatch = months.find(m => m.yearMonth === bym);
             if (bMatch) bMatch.bookings += u.totalBookings;
          }
      }
    });

    return months;
  }, [users]);

  // Update filteredUsers when users or filters change
  useEffect(() => {
    let filtered = [...users];

    // 1. Filter by Active Tab (Collection Logic)
    if (activeTab === "active") {
      filtered = filtered.filter(u => u.status === "active" && !u.blacklistedFrom?.some(b => (b.managerId === currentUser?._id || b.managerId?._id === currentUser?._id)));
    } else if (activeTab === "banned") {
      filtered = filtered.filter(u => 
        u.status === "banned" || 
        u.blacklistedFrom?.some(b => (b.managerId === currentUser?._id || b.managerId?._id === currentUser?._id))
      );
    } else if (activeTab === "appeals") {
      filtered = filtered.filter(u => u.hasAppeal);
    }

    // 2. Search Logic
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u._id.toLowerCase().includes(term)
      );
    }

    // 3. Date Range Filter
    if (dateRange.from && dateRange.to) {
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      filtered = filtered.filter(u => {
        if (!u.lastBookingDate) return false;
        const last = new Date(u.lastBookingDate);
        return last >= from && last <= to;
      });
    }

    // 4. Tent Filter
    if (tentFilter) {
      filtered = filtered.filter(u =>
        u.bookings?.some(b => b.tentId === tentFilter || b.tentName === tentFilter)
      );
    }

    // 5. Sorting Logic
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "name") {
        aVal = (a.fullName || "").toLowerCase();
        bVal = (b.fullName || "").toLowerCase();
      } else if (sortBy === "date") {
        aVal = a.lastBookingDate ? new Date(a.lastBookingDate).getTime() : 0;
        bVal = b.lastBookingDate ? new Date(b.lastBookingDate).getTime() : 0;
      } else if (sortBy === "bookings") {
        aVal = a.totalBookings || 0;
        bVal = b.totalBookings || 0;
      }
      
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, dateRange, tentFilter, sortBy, sortOrder, activeTab, currentUser]);

  const openManageModal = async (user) => {
    setSelectedUser(user);
    setLoadingWarnings(true);
    setWarningMessage("");
    try {
      const res = await api.get(`/manager/users/${user._id}/warnings`);
      setUserWarnings(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch warnings", err);
    } finally {
      setLoadingWarnings(false);
    }
  };

  const handleSendWarning = async () => {
    if (!warningMessage.trim()) return;
    try {
      const res = await api.post(`/manager/users/${selectedUser._id}/warn`, { message: warningMessage });
      if (res.data.success) {
        toast.success(t("Warning sent successfully"));
        setWarningMessage("");
        const warningsRes = await api.get(`/manager/users/${selectedUser._id}/warnings`);
        setUserWarnings(warningsRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to send warning"));
    }
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error(t("Please provide a reason for the ban"));
      return;
    }
    setUpdatingBan(selectedUser._id);
    try {
      const res = await api.patch(`/manager/users/${selectedUser._id}/ban`, { reason: banReason });
      if (res.data.success) {
        toast.success(t("User restricted from your camps"));
        setBanReason("");
        setSelectedUser(null);
        const usersRes = await api.get("/manager/users?includeBookings=true");
        if (usersRes.data.success) setUsers(usersRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to ban user"));
    } finally {
      setUpdatingBan(null);
    }
  };

  const handleSuspendUser = async () => {
    if (!banReason.trim()) {
      toast.error(t("Please provide a reason for the suspension"));
      return;
    }
    setUpdatingBan(selectedUser._id);
    try {
      const res = await api.patch(`/manager/users/${selectedUser._id}/suspend`, { reason: banReason });
      if (res.data.success) {
        toast.success(t("User suspended from your camps"));
        setBanReason("");
        setSelectedUser(null);
        const usersRes = await api.get("/manager/users?includeBookings=true");
        if (usersRes.data.success) setUsers(usersRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to suspend user"));
    } finally {
      setUpdatingBan(null);
    }
  };

  const handleUnbanUser = async (userId) => {
    setUpdatingBan(userId);
    try {
      const res = await api.patch(`/manager/users/${userId}/unban`);
      if (res.data.success) {
        toast.success(t("Access restored"));
        if (selectedUser?._id === userId) setSelectedUser(null);
        const usersRes = await api.get("/manager/users?includeBookings=true");
        if (usersRes.data.success) setUsers(usersRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to restore access"));
    } finally {
      setUpdatingBan(null);
    }
  };

  const handleConflictAppeal = async () => {
    if (!conflictMessage.trim()) {
      toast.error(t("Please enter a reason."));
      return;
    }
    setSubmittingConflict(true);
    try {
      const res = await api.post(`/manager/users/${selectedUser._id}/conflict-appeal`, { message: conflictMessage });
      if (res.data.success) {
        toast.success(t("Security justification submitted."));
        setConflictMessage("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("Submission failed."));
    } finally {
      setSubmittingConflict(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading && users.length === 0) {
    return <IntelligenceLoader text={t("Initializing User Intelligence...")} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-800">{t('User Management')}</h1>
          <p className="text-slate-500 font-medium">{t('Control camper access, monitor history, and handle security appeals.')}</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        {[
          { label: t("Total Campers"), value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50", baseColor: "bg-blue-500", filterVal: "all" },
          { label: t("Active"), value: stats.active, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", baseColor: "bg-emerald-500", filterVal: "active" },
          { label: t("Restricted"), value: stats.banned, icon: Ban, color: "text-rose-600", bg: "bg-rose-50", baseColor: "bg-rose-500", filterVal: "banned" },
          { label: t("Total Visits"), value: stats.totalBookings, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", baseColor: "bg-amber-500", filterVal: "all" },
          { label: t("Appeals"), value: stats.pendingAppeals, icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50", pulse: stats.pendingAppeals > 0, baseColor: "bg-purple-500", filterVal: "appeals" },
        ].map((stat, idx) => (
          <motion.div
            key={`${stat.label}-${idx}`}
            custom={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
            onClick={() => {
              if (stat.filterVal) setActiveTab(stat.filterVal);
            }}
            className={`relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg flex flex-col justify-between group overflow-hidden transition-shadow duration-300 cursor-pointer ${stat.pulse ? 'ring-1 ring-purple-400' : ''}`}
          >
            {/* L-Shape Color Accent */}
            <div className={`absolute bottom-0 left-0 w-full h-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:h-2`}></div>
            <div className={`absolute bottom-0 left-0 h-full w-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:w-2`}></div>
            
            <div className="relative z-10 flex items-start justify-between mb-4 pl-1">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value.toLocaleString()}</h3>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color} ${stat.pulse ? 'animate-pulse' : ''}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                {t('Registration Growth')}
              </h3>
              <p className="text-sm text-slate-400 font-medium">{t('New campers per month')}</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={computedChartData}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                />
                <Area type="monotone" dataKey="users" stroke="#0d9488" strokeWidth={4} fill="url(#userGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            {t('Recent Activity')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={computedChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: "15px", border: "none" }} />
                <Bar dataKey="bookings" fill="#0d9488" radius={[10, 10, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-100/50 p-1 rounded-lg w-fit">
        {[
          { id: "all", label: t("All Campers"), icon: Users },
          { id: "active", label: t("Active"), icon: UserCheck },
          { id: "banned", label: t("Restricted"), icon: Ban },
          { id: "appeals", label: t("Pending Appeals"), icon: AlertCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            } relative`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === "appeals" && stats.pendingAppeals > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white">
                {stats.pendingAppeals}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-teal-600 transition-colors" />
            <input
              type="text"
              placeholder={t('Search campers...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full pl-9 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
              />
            </div>
            <span className="text-slate-300 font-bold">{t('to')}</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="flex-1 px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={tentFilter}
              onChange={(e) => setTentFilter(e.target.value)}
              className="w-full appearance-none px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none"
            >
              <option value="">{t('All Tents')}</option>
              {tents.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none"
            >
              <option value="name">{t('Name')}</option>
              <option value="date">{t('Last Visit')}</option>
              <option value="bookings">{t('Bookings')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-3 bg-teal-50 text-teal-700 border border-teal-100 rounded-2xl hover:bg-teal-100 transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <motion.div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('Camper Identity')}</th>
                <th className="px-6 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('Contact Node')}</th>
                <th className="px-6 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('History')}</th>
                <th className="px-6 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('Status')}</th>
                <th className="px-8 py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('Control')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <Search className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('No records found for this collection')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user, idx) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50/80 transition-all"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 border border-slate-200 group-hover:from-teal-500 group-hover:to-teal-600 group-hover:text-white group-hover:border-transparent transition-all">
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{user.fullName}</p>
                            <code className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-md mt-1 inline-block">ID-{user._id.slice(-6).toUpperCase()}</code>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-600">{user.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{user.phone || t("No phone listed")}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{user.totalBookings || 0}</p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">{t('Visits')}</p>
                          </div>
                          <div className="w-[1px] h-6 bg-slate-100" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {user.lastBookingDate ? format(new Date(user.lastBookingDate), "MMM dd") : t("Never")}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">{t('Last Seen')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {user.status === "banned" ? (
                          <span className="flex items-center w-fit gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-red-100">
                            <Shield className="w-3 h-3" /> {t('Global Ban')}
                          </span>
                        ) : user.blacklistedFrom?.some(b => (b.managerId === currentUser?._id || b.managerId?._id === currentUser?._id)) ? (
                          <span className="flex items-center w-fit gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-orange-100">
                            <Ban className="w-3 h-3" /> {t('Restricted')}
                          </span>
                        ) : (
                          <span className="flex items-center w-fit gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-emerald-100">
                            <CheckCircle className="w-3 h-3" /> {t('Verified')}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.hasAppeal && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600 animate-bounce">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                          <button
                            onClick={() => openManageModal(user)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t('MANAGE')}
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

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t('Showing')} <span className="text-slate-800">{Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> {t('of')} <span className="text-slate-800">{filteredUsers.length}</span> {t('campers')}
            </p>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-200"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-teal-400"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal Section */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="relative w-full max-w-2xl h-full bg-white rounded-l-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-teal-200">
                    {selectedUser.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedUser.fullName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                        {t('Camper Account')}
                      </span>
                      {selectedUser.hasAppeal && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[10px] font-black uppercase">{t('Pending Appeal')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                
                {/* Moderation History */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-600" />
                      {t('Intelligence Log')}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{t('Secure Audit Trail')}</span>
                  </div>
                  <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800">
                    <div className="p-4 bg-slate-900/50 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('Chronological Events')}</span>
                      </div>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto p-2">
                      <ModerationHistoryView userId={selectedUser._id} isAdmin={false} />
                    </div>
                  </div>
                </section>

                {/* Appeal Message */}
                {selectedUser.hasAppeal && (
                  <section className="bg-gradient-to-br from-orange-600 to-rose-600 p-[2px] rounded-[2rem] shadow-xl shadow-orange-200">
                    <div className="bg-white p-6 rounded-[calc(2rem-2px)]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-slate-800">{t("Camper's Appeal Message")}</h4>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 italic text-slate-700 text-sm leading-relaxed mb-6">
                        "{selectedUser.appealMessage}"
                      </div>
                      <button 
                        onClick={() => handleUnbanUser(selectedUser._id)}
                        className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> {t('Approve Appeal & Restore Access')}
                      </button>
                    </div>
                  </section>
                )}

                {/* Warnings Feed */}
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    {t('Direct Correspondence')}
                  </h4>
                  <div className="space-y-4">
                    <div className="max-h-52 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {loadingWarnings ? (
                        <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 animate-spin text-teal-600" /></div>
                      ) : userWarnings.length > 0 ? (
                        userWarnings.map(w => (
                          <div key={w._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-700 leading-tight">{w.message}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-tighter">
                                {t('Sent')} {format(new Date(w.createdAt), "MMM dd, HH:mm")}
                              </p>
                            </div>
                            {w.isRead ? (
                              <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">{t('READ')}</span>
                            ) : (
                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{t('UNREAD')}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-widest">
                          {t('No history of warnings')}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-xs font-black text-slate-800 mb-3 uppercase tracking-widest">{t('Issue Official Warning')}</p>
                      <textarea
                        value={warningMessage}
                        onChange={(e) => setWarningMessage(e.target.value)}
                        placeholder={t("Detail the behavioral issue. The camper will see this immediately on their console.")}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-teal-500/10 outline-none min-h-[100px] transition-all"
                      />
                      <button
                        onClick={handleSendWarning}
                        disabled={!warningMessage.trim()}
                        className="mt-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> {t('Dispatch Warning Notification')}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Restrict Section */}
                {selectedUser.status !== 'banned' && (
                  <section className="pt-10 border-t border-slate-100">
                    {selectedUser.blacklistedFrom?.some(b => (b.managerId === currentUser?._id || b.managerId?._id === currentUser?._id)) ? (
                      <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Ban className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-rose-800 mb-2 uppercase tracking-tight">{t('Camper is Restricted')}</h4>
                        <p className="text-rose-600 text-sm font-medium mb-6">{t('This user is currently prohibited from booking any of your campsites.')}</p>
                        <button
                          onClick={() => handleUnbanUser(selectedUser._id)}
                          className="w-full py-4 bg-white text-rose-600 border-2 border-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                          {t('Restore Access Privileges')}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <h4 className="text-sm font-black text-red-600 mb-2 uppercase tracking-widest flex items-center gap-2">
                          <UserX className="w-4 h-4" />
                          {t('Security Restriction')}
                        </h4>
                        <p className="text-xs text-slate-500 font-bold mb-6">{t('This will cancel all their current bookings at your camps and block future entry.')}</p>
                        <textarea
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder={t("Legal/Security reason for restriction...")}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-red-500/10 outline-none min-h-[80px] mb-4"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={handleSuspendUser}
                            disabled={!banReason.trim() || updatingBan}
                            className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updatingBan === selectedUser._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                            {t('Suspend')}
                          </button>
                          <button
                            onClick={handleBanUser}
                            disabled={!banReason.trim() || updatingBan}
                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updatingBan === selectedUser._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                            {t('Apply Ban')}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Security Escalation */}
                {selectedUser.status === 'active' && selectedUser.blacklistedFrom?.some(b => (b.managerId === currentUser?._id || b.managerId?._id === currentUser?._id)) && (
                   <section className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 border-dashed">
                      <div className="flex items-center gap-3 text-amber-700 mb-4">
                        <Shield className="w-6 h-6" />
                        <h4 className="font-black text-sm uppercase tracking-widest">{t('Escalate to System Admin')}</h4>
                      </div>
                      <p className="text-xs text-amber-800 font-medium mb-6 leading-relaxed">
                        {t('If you believe a global restoration of this user was an error, submit a detailed risk justification here.')}
                      </p>
                      <textarea
                        value={conflictMessage}
                        onChange={(e) => setConflictMessage(e.target.value)}
                        placeholder={t("Detail specific security threat...")}
                        className="w-full p-4 bg-white border border-amber-200 rounded-2xl text-sm focus:ring-4 focus:ring-amber-500/10 outline-none min-h-[100px] mb-4"
                      />
                      <button
                        onClick={handleConflictAppeal}
                        disabled={submittingConflict || !conflictMessage.trim()}
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        {submittingConflict ? <RefreshCw className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {t('Submit Justification')}
                      </button>
                   </section>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

