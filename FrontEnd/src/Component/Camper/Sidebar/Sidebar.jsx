import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  Calendar,
  Ticket,
  Bell,
  CreditCard,
  User,
  Settings,
  CircleHelp,
  LogOut,
  Globe,
  ChevronRight,
  Menu,
  X,
  Home
} from "lucide-react";
import LogoutConfirm from "./LogoutConfirm";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { cn } from "../../../SystemAdmin/ui/utils";
import logo from "../../../assets/logo-icon.png";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState({ trips: 0, notifications: 0 });
  const { user } = useUser(); 
  const [showLogout, setShowLogout] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const closeSidebar = () => setIsOpen(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const notifRes = await api.get("/notifications");
        const unread = (notifRes.data?.data || []).filter(n => !n.isRead).length;
        const res = await api.get("/bookings/my-bookings");
        const bookings = res.data?.bookings || res.data?.data || [];
        const today = new Date();
        const activeTrips = bookings.filter(b => ['CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'].includes(b.status?.toUpperCase()) && new Date(b.checkOut) >= today).length;
        setCounts({ trips: activeTrips, notifications: unread });
      } catch (err) { console.error("Sidebar stats error:", err); }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const navGroups = [
    {
      title: t("General"),
      items: [
        { to: "/camper-dashboard", icon: LayoutDashboard, label: t("Dashboard"), end: true },
        { to: "/camper-dashboard/campsite-directory", icon: Compass, label: t("Campsites") },
        { to: "/camper-dashboard/reservations", icon: Calendar, label: t("My Bookings"), badge: counts.trips > 0 ? counts.trips : null },
        { to: "/camper-dashboard/tickets", icon: Ticket, label: t("My Tickets") },
      ]
    },
    {
      title: t("Activity"),
      items: [
        { to: "/camper-dashboard/notifications", icon: Bell, label: t("Notifications"), badge: counts.notifications > 0 ? counts.notifications : null },
        { to: "/camper-dashboard/payments", icon: CreditCard, label: t("Payments") },
      ]
    },
    {
      title: t("Settings"),
      items: [
        { to: "/camper-dashboard/profile", icon: User, label: t("My Profile") },
        { to: "/camper-dashboard/settings", icon: Settings, label: t("Settings") },
        { to: "/camper-dashboard/support", icon: CircleHelp, label: t("Support") },
      ]
    },
    {
      title: t("System"),
      items: [
        { to: "/", icon: Home, label: t("Back to Home") },
      ]
    }
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] lg:hidden" 
            onClick={closeSidebar} 
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed top-0 left-0 z-[70] lg:sticky h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile Toggle */}
        <div className="lg:hidden absolute -right-12 top-4">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-white shadow-md rounded-lg border border-gray-200 text-blue-600 active:scale-90 transition-transform"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Logo */}
        <div className="px-6 py-8 flex items-center justify-between">
          <NavLink to="/camper-dashboard" end onClick={closeSidebar} className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={logo} alt="EthioCamp Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">{t("EthioCamp")}</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{t("Camper")}</p>
            </div>
          </NavLink>
          <LanguageSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
          {navGroups.map((group, gIndex) => (
            <div key={gIndex} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, iIndex) => (
                  <NavItem 
                    key={iIndex}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    end={item.end}
                    onClick={closeSidebar}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div 
                className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-50 overflow-hidden cursor-pointer flex-shrink-0"
                onClick={() => setShowLogout(true)}
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} className="w-full h-full object-cover" alt="" />
                ) : (
                  user?.fullName?.slice(0, 2).toUpperCase() || "C"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.fullName || t("Camper")}</p>
                <p className="text-[10px] font-medium text-gray-400 truncate">{user?.email || t("Account")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogout(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <LogoutConfirm open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}

function NavItem({ icon: Icon, label, to, badge, onClick, end = false }) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-semibold",
        isActive 
          ? "text-blue-700 bg-blue-50/80 shadow-sm" 
          : "text-gray-500 hover:bg-gray-50 hover:text-blue-600"
      )}
    >
      <Icon className={cn(
        "w-4.5 h-4.5 transition-all",
        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
      )} />
      <span className="flex-1 truncate">{label}</span>
      
      {badge && (
        <span className="bg-blue-600 text-white text-[10px] min-w-[18px] h-4.5 flex items-center justify-center rounded-md px-1 font-bold shadow-sm">
          {badge}
        </span>
      )}

      {isActive && (
        <motion.div 
          layoutId="activeTab"
          className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-blue-600 rounded-r-full"
        />
      )}
      
      {!isActive && (
        <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
      )}
    </NavLink>
  );
}
