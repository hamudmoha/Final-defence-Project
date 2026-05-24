import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  Camera, 
  ShieldCheck, 
  Trophy, 
  MapPin, 
  Calendar, 
  Flame, 
  Star, 
  Mail, 
  Phone, 
  User, 
  BadgeCheck, 
  Sparkles, 
  ArrowRight, 
  Heart,
  ChevronRight,
  Clock,
  Settings,
  LogOut,
  Activity,
  CircleCheck,
  RefreshCw,
  Zap,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../../SystemAdmin/ui/utils";

// Consistent StatCard component used in other Camper pages
function StatCard({ icon: Icon, accent, bg, label, value, sub, subColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 flex items-center gap-4 transition-all duration-300",
        "bg-gradient-to-br from-white via-slate-50/30 to-white", // Base subtle gradient
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : ""
      )}
      style={{ 
        borderColor: accent ? accent + "30" : "#e5e7eb",
        background: `linear-gradient(135deg, ${accent}05 0%, #ffffff 50%, ${accent}05 100%)` 
      }}
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

export const MyProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loadingUser, logout, refreshUser } = useUser();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    trustScore: 0,
    role: "Camper",
    _id: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || user.name || t("Explorer"),
        email: user.email || "",
        phone: user.phone || t("Not provided"),
        role: user.role || "Camper",
        status: user.status || "Active",
        trustScore: user.trustScore || user.trust_score || 0,
        _id: user._id,
      });

      if (user.profilePicture) setAvatarPreview(user.profilePicture);
      
      const fetchData = async () => {
        try {
          const [favRes, bookRes] = await Promise.all([
            api.get("/users/favorites"),
            api.get("/bookings/my-bookings")
          ]);
          
          if (favRes.data.success) setFavorites(favRes.data.data || []);
          
          const bookings = bookRes.data?.bookings || bookRes.data?.data || [];
          setHistory(bookings.slice(0, 5));
        } catch (err) {
          console.error("Profile fetch error:", err);
        } finally {
          setHistoryLoading(false);
        }
      };

      fetchData();
    }
  }, [user, t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
    toast.success(t("Profile synchronized"));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success(t("Logged out successfully"));
  };

  if (loadingUser) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 p-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section - Standardized with Dashboard */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('My Identity')}</h1>
          <p className="text-gray-500 mt-1">{t('Personal profile, security, and activity archives')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {t('Sync')}
          </button>
          <button 
            onClick={() => navigate("/camper-dashboard/settings")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t("Settings")}
          </button>
        </div>
      </div>

      {/* Profile Card Section with Rainbow Gradient */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8 sm:p-10 group">
        {/* Subtle Rainbow Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-gradient-to-r from-rose-400 via-violet-400 via-indigo-400 via-blue-400 to-emerald-400" />
        <div className="absolute top-0 left-0 w-full h-[3px] opacity-20 bg-gradient-to-r from-rose-400 via-violet-400 via-indigo-400 via-blue-400 to-emerald-400 shadow-sm group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Avatar Area */}
          <div className="relative">
            <div className="w-40 h-40 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-300 text-5xl font-bold overflow-hidden shadow-sm">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" alt={profile.fullName} />
              ) : (
                profile.fullName?.charAt(0).toUpperCase() || "C"
              )}
            </div>
            <button className="absolute -bottom-3 -right-3 p-3 bg-white border border-gray-200 text-blue-600 rounded-xl shadow-lg hover:bg-gray-50 transition-all group/cam">
              <Camera size={20} className="group-hover/cam:scale-110 transition-transform" />
            </button>
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">{profile.fullName}</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-widest">
                  {t(profile.role)}
                </span>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest",
                  profile.status === 'Active' || profile.status === 'active' || profile.status === 'ACTIVE' 
                    ? 'bg-green-50 text-green-700 border-green-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                )}>
                  {t(profile.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Mail size={16} className="text-gray-400" /></div>
                {profile.email}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Phone size={16} className="text-gray-400" /></div>
                {profile.phone}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><MapPin size={16} className="text-gray-400" /></div>
                {t("Ethiopia")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Standardized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <StatCard 
          icon={Activity}
          accent="#10b981"
          bg="#ecfdf5"
          label={t("Trips Completed")}
          value={user?.completed_bookings || 0}
          sub={t("Platform activity")}
          subColor="text-green-600"
        />
        <StatCard 
          icon={CircleCheck}
          accent="#3b82f6"
          bg="#eff6ff"
          label={t("Trust Integrity")}
          value={`${profile.trustScore}%`}
          sub={t("Account reliability")}
          subColor="text-blue-600"
        />
        <StatCard 
          icon={Zap}
          accent="#a855f7"
          bg="#faf5ff"
          label={t("Flex Pay Status")}
          value={(user?.completed_bookings >= 1 && profile.trustScore >= 80) ? t("Eligible") : t("Ineligible")}
          sub={user?.completed_bookings < 1 ? t("Unlocked after 1st trip") : profile.trustScore < 80 ? t("Trust too low") : t("Deposit enabled")}
          subColor={(user?.completed_bookings >= 1 && profile.trustScore >= 80) ? "text-purple-600" : "text-rose-500"}
        />
        <StatCard 
          icon={Star}
          accent="#f59e0b"
          bg="#fffbeb"
          label={t("Review Average")}
          value={user?.avgRating || "5.0"}
          sub={t("Public feedback")}
          subColor="text-amber-600"
        />
        <StatCard 
          icon={Heart}
          accent="#ef4444"
          bg="#fef2f2"
          label={t("Favorites")}
          value={favorites.length}
          sub={t("Saved campsites")}
          subColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t("Security & Identity")}</h3>
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-10 bg-gradient-to-r from-rose-400 via-violet-400 via-indigo-400 via-blue-400 to-emerald-400 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
              <DetailRow label={t("Member ID")} value={(profile._id || "").slice(-10).toUpperCase()} isMono />
              <DetailRow label={t("Member Since")} value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t("N/A")} />
              <DetailRow label={t("Identity Status")} value={t("Verified")} isBadge />
            </div>

            <div className="relative z-10 pt-6 border-t border-gray-100">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t("Achievements")}</h4>
               <div className="grid grid-cols-2 gap-3">
                 <Badge icon={<ShieldCheck size={16} />} label={t("Verified")} active={true} />
                 <Badge icon={<Flame size={16} />} label={t("Explorer")} active={user?.completed_bookings > 0} />
                 <Badge icon={<Trophy size={16} />} label={t("Veteran")} active={user?.completed_bookings > 5} />
                 <Badge icon={<Sparkles size={16} />} label={t("Reviewer")} active={false} />
               </div>
            </div>

            <button 
              onClick={handleLogout}
              className="relative z-10 w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all border border-red-100"
            >
              <LogOut size={16} />
              {t("Sign Out")}
            </button>
          </div>
        </div>

        {/* Recent Activity / Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("Recent Activity Archive")}</h3>
            <button 
              onClick={() => navigate("/camper-dashboard/reservations")}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              {t("View Full History")}
            </button>
          </div>

          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-10 bg-gradient-to-r from-rose-400 via-violet-400 via-indigo-400 via-blue-400 to-emerald-400 group-hover:opacity-100 transition-opacity" />
            {historyLoading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{t("Syncing...")}</p>
              </div>
            ) : history.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {history.map((trip, idx) => (
                  <div 
                    key={trip._id} 
                    className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-all cursor-pointer group"
                    onClick={() => navigate(`/camper-dashboard/book/${trip.campId?._id}`)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{trip.campId?.name || t("Campsite Journey")}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-400">
                            {new Date(trip.checkIn).toLocaleDateString()}
                          </p>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <p className="text-xs text-gray-400">
                            {trip.guests} {t("Guests")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">ETB {trip.totalPrice?.toLocaleString()}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                          ['FULLY_PAID', 'COMPLETED'].includes(trip.status) 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        )}>
                          {t(trip.status)}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50/30">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-500">{t("No activity recorded yet")}</p>
                <button 
                  onClick={() => navigate("/camper-dashboard/campsite-directory")}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm"
                >
                  {t("Book First Trip")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, isMono, isBadge }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{label}</span>
    {isBadge ? (
      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-md border border-green-100 uppercase">
        {value}
      </span>
    ) : (
      <span className={cn("text-sm font-bold text-gray-900", isMono ? "font-mono text-blue-600" : "")}>
        {value}
      </span>
    )}
  </div>
);

const Badge = ({ icon, label, active }) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300",
        active 
          ? 'bg-white border-gray-100 shadow-sm' 
          : 'bg-gray-50 border-transparent opacity-40 grayscale'
      )}
    >
      <div className={cn("mb-2", active ? 'text-blue-500' : 'text-gray-400')}>
        {icon}
      </div>
      <span className="text-[9px] font-bold text-gray-800 uppercase tracking-tighter text-center">{label}</span>
    </div>
  );
};

export default MyProfile;
