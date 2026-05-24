import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  CreditCard,
  TriangleAlert,
  CircleCheck,
  Trash2,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import { useTranslation } from "react-i18next";
import { cn } from "../../../SystemAdmin/ui/utils";

export const Notifications = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        const all = res.data?.data || [];
        
        if (all.length > 0) {
          const mapped = all.map(n => ({
            id: n._id,
            type: n.category?.toLowerCase() || 'system',
            title: n.title,
            desc: n.message,
            time: new Date(n.createdAt).toLocaleDateString(),
            timestamp: new Date(n.createdAt).getTime(),
            unread: !n.isRead,
            icon: getIconForCategory(n.category),
            color: getColorForCategory(n.category)
          }));
          setNotifications(mapped);
        } else {
          // Fallback logic
          const bookRes = await api.get("/bookings/my-bookings");
          const bookings = bookRes.data?.bookings || bookRes.data?.data || [];
          const generated = bookings.map((booking) => {
            const isPaid = ['FULLY_PAID', 'COMPLETED'].includes(booking.status?.toUpperCase());
            const isConfirmed = booking.status?.toUpperCase() === "CONFIRMED";
            const campName = booking.tentId?.name || booking.campId?.name || t("Campsite");
            
            let type = "system", title = t("Update on your booking"), desc = `${t("Status update for")} ${campName}`, 
                icon = <TriangleAlert className="text-amber-500" />, color = "bg-amber-50";
            
            if (isPaid && isConfirmed) { 
              type = "bookings"; title = t("Booking Confirmed!"); desc = `${t("Your reservation at")} ${campName} ${t("is finalized.")}`; icon = <CircleCheck className="text-green-500" />; color = "bg-green-50"; 
            }
            else if (!isPaid && booking.status !== "CANCELLED") { 
              type = "payments"; title = t("Payment Required"); desc = `${t("Please finalize the payment for")} ${campName}. ${t("Total")}: ${booking.totalAmount?.toLocaleString()} ETB.`; icon = <CreditCard className="text-blue-500" />; color = "bg-blue-50"; 
            }
            else if (booking.status === "CANCELLED") { 
              type = "system"; title = t("Booking Cancelled"); desc = `${t("Your reservation at")} ${campName} ${t("has been cancelled.")}`; icon = <TriangleAlert className="text-red-500" />; color = "bg-red-50"; 
            }
            
            return { 
              id: booking._id, type, title, desc, 
              time: new Date(booking.updatedAt || booking.createdAt).toLocaleDateString(), 
              timestamp: new Date(booking.updatedAt || booking.createdAt).getTime(), 
              unread: !isPaid && booking.status !== "CANCELLED", icon, color 
            };
          });
          generated.sort((a, b) => b.timestamp - a.timestamp);
          setNotifications(generated);
        }
      } catch (err) { 
        console.error("Error loading notifications:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchNotifications();
  }, [t]);

  const getIconForCategory = (cat) => {
    switch(cat) {
      case 'Alert': return <TriangleAlert className="text-red-500" />;
      case 'System': return <ShieldCheck className="text-green-500" />;
      case 'Booking': return <Calendar className="text-blue-500" />;
      case 'Payment': return <CreditCard className="text-amber-500" />;
      default: return <Bell className="text-gray-500" />;
    }
  };

  const getColorForCategory = (cat) => {
    switch(cat) {
      case 'Alert': return 'bg-red-50';
      case 'System': return 'bg-green-50';
      case 'Booking': return 'bg-blue-50';
      case 'Payment': return 'bg-amber-50';
      default: return 'bg-gray-50';
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const filteredNotifications = activeTab === "all" ? notifications : notifications.filter((n) => n.type === activeTab);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {t("Notifications")}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                {unreadCount} {t("New")}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">{t("Stay updated with your latest booking and account activity")}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-600 shadow-sm flex items-center gap-2"
          >
            <ShieldCheck size={16} /> {t("Mark all as read")}
          </button>
          <button
            onClick={() => setNotifications([])}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-red-600 shadow-sm flex items-center gap-2"
          >
            <Trash2 size={16} /> {t("Clear All")}
          </button>
        </div>
      </div>

      {/* Tabs - System Admin Style */}
      <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200">
        {["all", "bookings", "payments", "system"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === tab
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4 max-w-4xl">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-xl border border-gray-200" />
            ))
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <motion.div 
                key={n.id} 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-5 cursor-pointer",
                  !n.unread && 'opacity-70 bg-gray-50/50'
                )}
                onClick={() => { 
                  handleMarkAsRead(n.id);
                  if (n.type === 'payments') navigate('/camper-dashboard/payments'); 
                  else if (n.type === 'bookings') navigate('/camper-dashboard/reservations'); 
                }}
              >
                <div className="flex gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-sm",
                    n.color
                  )}>
                    {n.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {n.title}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          {n.time} • {n.type.toUpperCase()}
                        </p>
                      </div>
                      {n.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shadow-sm"></div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                      {n.desc}
                    </p>

                    {n.unread && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0">
                        {t("View Details")} <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Inbox size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t("No notifications yet")}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("We'll notify you when something important happens")}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
