import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  CircleCheck,
  CircleX,
  Clock,
  Tent,
  CircleAlert,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Search,
  Sparkles,
  Info
} from "lucide-react";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../../SystemAdmin/ui/utils";
import { RatingModal } from "../../Common/RatingModal.jsx";
import { Star } from "lucide-react";

export const MyReservations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("active");
  const [sortOption, setSortOption] = useState("date-newest");
  const [stats, setStats] = useState({
    active: 0,
    upcoming: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  const [ratingModal, setRatingModal] = useState({ isOpen: false, bookingId: null, targetId: null, targetName: "" });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/bookings/my-bookings");
        const allBookings = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.bookings) ? res.data.bookings : [];
        setBookings(allBookings);

        const today = new Date();
        const active = allBookings.filter(
          (b) => ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID'].includes(b.status?.toUpperCase()) && new Date(b.checkIn) <= today && new Date(b.checkOut) >= today
        ).length;
        const upcoming = allBookings.filter(
          (b) => ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID'].includes(b.status?.toUpperCase()) && new Date(b.checkIn) > today
        ).length;
        const pending = allBookings.filter(
          (b) => b.status?.toUpperCase() === 'PENDING'
        ).length;
        const completed = allBookings.filter(
          (b) => b.status?.toUpperCase() === 'COMPLETED'
        ).length;
        const cancelled = allBookings.filter((b) => b.status?.toUpperCase() === "CANCELLED").length;

        setStats({ active, upcoming, pending, completed, cancelled });
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error(t("Could not load your bookings."));
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [t]);

  const getFilteredBookings = (type) => {
    if (!Array.isArray(bookings) || bookings.length === 0) return [];
    const today = new Date();
    let filtered = bookings.filter((b) => {
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      if (type === "active") return ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID'].includes(b.status?.toUpperCase()) && start <= today && end >= today;
      if (type === "upcoming") return ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID'].includes(b.status?.toUpperCase()) && start > today;
      if (type === "pending") return b.status?.toUpperCase() === 'PENDING';
      if (type === "completed") return b.status?.toUpperCase() === 'COMPLETED' || (['CONFIRMED', 'FULLY_PAID'].includes(b.status?.toUpperCase()) && end < today);
      if (type === "cancelled") return b.status?.toUpperCase() === 'CANCELLED';
      return false;
    });

    return filtered.sort((a, b) => {
      const nameA = (a.tentId?.name || a.campId?.name || "").toLowerCase();
      const nameB = (b.tentId?.name || b.campId?.name || "").toLowerCase();
      const priceA = a.totalAmount || 0;
      const priceB = b.totalAmount || 0;
      const dateA = new Date(a.checkIn).getTime();
      const dateB = new Date(b.checkIn).getTime();

      switch (sortOption) {
        case "az": return nameA.localeCompare(nameB);
        case "za": return nameB.localeCompare(nameA);
        case "price-low": return priceA - priceB;
        case "price-high": return priceB - priceA;
        case "date-oldest": return dateA - dateB;
        case "date-newest": return dateB - dateA;
        default: return 0;
      }
    });
  };

  const currentBookings = getFilteredBookings(selectedFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">{t("Loading reservations...")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('My Reservations')}</h1>
          <p className="text-gray-500 mt-1">{t('Manage and track all your campsite bookings in one place')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <ArrowUpDown className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer pr-6"
            >
              <option value="date-newest">{t("Newest")}</option>
              <option value="date-oldest">{t("Oldest")}</option>
              <option value="az">{t("A-Z")}</option>
              <option value="price-low">{t("Lowest Price")}</option>
              <option value="price-high">{t("Highest Price")}</option>
            </select>
          </div>
          
          <button 
            onClick={() => navigate("/camper-dashboard/campsite-directory")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Search size={16} />
            {t("New Booking")}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <FilterTab title={t("Active")} value={stats.active} icon={<Clock />} accent="#10b981" bg="#f0fdf4" isActive={selectedFilter === "active"} onClick={() => setSelectedFilter("active")} />
        <FilterTab title={t("Upcoming")} value={stats.upcoming} icon={<Calendar />} accent="#3b82f6" bg="#eff6ff" isActive={selectedFilter === "upcoming"} onClick={() => setSelectedFilter("upcoming")} />
        <FilterTab title={t("On Hold")} value={stats.pending} icon={<CircleAlert />} accent="#f59e0b" bg="#fffbeb" isActive={selectedFilter === "pending"} onClick={() => setSelectedFilter("pending")} />
        <FilterTab title={t("Completed")} value={stats.completed} icon={<CircleCheck />} accent="#6366f1" bg="#eef2ff" isActive={selectedFilter === "completed"} onClick={() => setSelectedFilter("completed")} />
        <FilterTab title={t("Cancelled")} value={stats.cancelled} icon={<CircleX />} accent="#ef4444" bg="#fef2f2" isActive={selectedFilter === "cancelled"} onClick={() => setSelectedFilter("cancelled")} />
      </div>

      {/* Booking List */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {t(selectedFilter)} {t("Reservations")}
          </h2>
        </div>
        
        <AnimatePresence mode="wait">
          {currentBookings.length > 0 ? (
            <motion.div 
              key={selectedFilter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {currentBookings.map((b) => (
                <BookingCard 
                  key={b._id} 
                  booking={b} 
                  onClick={() => navigate(`/camper-dashboard/book/${b.campId?._id}`)}
                  onRate={() => setRatingModal({
                    isOpen: true,
                    bookingId: b._id,
                    targetId: b.campId?._id,
                    targetName: b.campId?.name || t("Campsite")
                  })}
                />
              ))}
            </motion.div>
          ) : (
            <div className="bg-gray-50/50 rounded-2xl p-24 text-center border border-dashed border-gray-200">
               <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <p className="text-sm font-medium text-gray-400">{t("No reservations found in this category")}</p>
               <button 
                 onClick={() => navigate("/camper-dashboard/campsite-directory")}
                 className="mt-4 text-blue-600 text-sm font-bold hover:underline"
               >
                 {t("Browse Campsites")}
               </button>
            </div>
          )}
        </AnimatePresence>
      </div>
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
        bookingId={ratingModal.bookingId}
        targetId={ratingModal.targetId}
        targetName={ratingModal.targetName}
        targetType="Camp"
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

function FilterTab({ title, value, icon, isActive, onClick, accent, bg }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border transition-all text-left flex items-center gap-4 bg-white",
        isActive ? "border-blue-200 shadow-sm ring-2 ring-blue-500/5" : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm"
        style={{ background: bg, color: accent, borderColor: accent + "20" }}
      >
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 leading-none mb-1">{value}</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
    </button>
  );
}

function BookingCard({ booking, onClick, onRate }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const campName = booking.tentId?.name || booking.campId?.name || t("Unknown Campsite");
  const hasPaid = ['PARTIALLY_PAID', 'FULLY_PAID', 'COMPLETED'].includes(booking.status);
  const locationText = booking.campId?.location?.address || booking.campId?.location || t("Location details pending");
  const checkIn = new Date(booking.checkIn).toLocaleDateString();
  const checkOut = new Date(booking.checkOut).toLocaleDateString();
  const bookingId = booking.reservationCode || (booking._id ? booking._id.slice(-6).toUpperCase() : "###");

  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (booking.status?.toUpperCase() !== 'PENDING') return;
    const updateTime = () => {
      const createdAt = new Date(booking.createdAt).getTime();
      const expiresAt = createdAt + 15 * 60 * 1000;
      const difference = expiresAt - Date.now();
      if (difference <= 0) { setTimeLeft(t("EXPIRED")); setIsExpired(true); return; }
      const minutes = Math.floor((difference / 60000) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [booking.createdAt, booking.status, t]);

  const parts = timeLeft.includes(":") ? timeLeft.split(":") : [timeLeft, ""];
  const minutesDisplay = parts[0] || "00";
  const secondsDisplay = parts[1] || "00";

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 relative group cursor-pointer",
        isExpired && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col lg:flex-row justify-between gap-8">
        <div className="flex flex-col sm:flex-row gap-6 flex-1">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden flex-shrink-0 group-hover:border-blue-100 transition-colors">
             {booking.tentId?.images?.[0] || booking.campId?.images?.[0] ? (
                <img src={booking.tentId?.images?.[0] || booking.campId?.images?.[0]} className="w-full h-full object-cover" alt="" />
             ) : (
                <Tent className="w-10 h-10 text-gray-200 group-hover:text-blue-500 transition-colors" />
             )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{campName}</h3>
              <span className={cn(
                "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm",
                ['CONFIRMED', 'FULLY_PAID', 'COMPLETED'].includes(booking.status) ? 'bg-green-50 text-green-700 border-green-100' :
                ['PENDING', 'PARTIALLY_PAID'].includes(booking.status) ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-red-50 text-red-700 border-red-100'
              )}>
                {isExpired ? t("EXPIRED") : t(booking.status)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              {locationText}
            </div>

            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Booking ID")}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{bookingId}</p>
              </div>
              <div className="w-px h-6 bg-gray-100"></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Guests")}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.guests} {t("Persons")}</p>
              </div>
              <div className="w-px h-6 bg-gray-100"></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Payment")}</p>
                <p className={cn("text-sm font-bold mt-0.5", hasPaid ? "text-green-600" : "text-amber-600")}>
                  {hasPaid ? t("Paid") : t("Pending")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex lg:flex-col items-center lg:items-end justify-center gap-4 flex-shrink-0">
          {booking.status?.toUpperCase() === 'PENDING' && !isExpired && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1 shadow-sm select-none shrink-0 hover:shadow-md transition-all duration-300">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-blue-900 tracking-wide flex items-center">
                {t("Expires in:")} <span className="font-mono font-extrabold text-sm text-blue-600 ml-1.5">{timeLeft}</span>
              </span>
            </div>
          )}
          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-blue-600 border border-gray-100 shadow-sm"><Calendar className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Check-In")}</p>
            <p className="text-sm font-bold text-gray-900">{checkIn}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-blue-600 border border-gray-100 shadow-sm"><Calendar className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Check-Out")}</p>
            <p className="text-sm font-bold text-gray-900">{checkOut}</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t("Total Price")}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {(booking.totalAmount || booking.totalPrice || 0).toLocaleString()} 
            <span className="text-xs font-bold text-gray-400 ml-1.5">ETB</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 mt-6">
        {booking.balance_due > 0 && booking.status !== 'CANCELLED' && !isExpired && (
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/camper-dashboard/payments'); }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Sparkles size={14} />
            {t("Pay Balance")}
          </button>
        )}
        {booking.amount_paid_online > 0 && !booking.is_disputed && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const reason = window.prompt(t("Please provide a reason for the dispute:"));
              if (reason) api.post(`/payments/dispute/${booking._id}`, { reason }).then(() => { toast.success(t("Dispute submitted successfully")); window.location.reload(); });
            }}
            className="px-6 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100 hover:border-red-200 transition-all shadow-sm"
          >
            {t("Dispute Booking")}
          </button>
        )}
        {booking.status === 'COMPLETED' && !booking.isRatedByCamper && (
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(); }}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Star size={14} fill="currentColor" />
            {t("Rate Experience")}
          </button>
        )}
        {booking.isRatedByCamper && (
          <div className="px-6 py-2 text-gray-400 text-sm font-medium flex items-center gap-2 italic">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            {t("Rated")}
          </div>
        )}
      </div>
    </div>
  );
}
