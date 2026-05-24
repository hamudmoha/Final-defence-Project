import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Tent,
  Calendar,
  CreditCard,
  Users,
  BarChart,
  Bell,
  Settings,
  LogOut,
  UserCheck,
  ChevronDown,
  PlusCircle,
  LayoutGrid,
  User,
  LifeBuoy,
  Menu,
  X
} from "lucide-react";
import LogoutConfirm from "./LogoutConfirm";
import { useUser } from '../../../context/UserContext';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import logo from "../../../assets/logo-icon.png";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const [isCampMenuOpen, setIsCampMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const { t } = useTranslation();

  // Load user data for the dynamic profile section
  useEffect(() => {
    // Auto-open submenu if on related routes
    const campSubRoutes = ["/manager-dashboard/tent-management", "/manager-dashboard/add-tent"];
    if (campSubRoutes.includes(location.pathname)) {
      setIsCampMenuOpen(true);
    }
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const mainMenu = [
    { name: t("Reservation Mgmt"), href: "/manager-dashboard/reservations", icon: Calendar },
    { name: t("Payment Mgmt"), href: "/manager-dashboard/payments", icon: CreditCard },
  ];

  const adminMenu = [
    { name: t("User Management"), href: "/manager-dashboard/users", icon: Users },
    { name: t("Report & Analytics"), href: "/manager-dashboard/analytics", icon: BarChart },
    { name: t("Notification Mgmt"), href: "/manager-dashboard/notifications", icon: Bell },
    { name: t("System Settings"), href: "/manager-dashboard/settings", icon: Settings },
    { name: t("Support"), href: "/manager-dashboard/support", icon: LifeBuoy },
  ];

  const campSubItems = [
    { name: t("Tent management"), href: "/manager-dashboard/tent-management", icon: LayoutGrid },
    { name: t("Add tent"), href: "/manager-dashboard/add-tent", icon: PlusCircle },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex items-center justify-between px-4 sm:px-6 mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 flex items-center justify-center"
          >
            <img src={logo} alt="EthioCamp Logo" className="w-full h-full object-contain" />
          </motion.div>
          <span className="text-lg sm:text-xl font-extrabold text-teal-900 tracking-tight">EthioCamp</span>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        
        {/* Desktop Language Switcher */}
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-6 sm:space-y-8 pb-4 custom-scrollbar">
        {/* Main Group */}
        <div>
          <h3 className="px-4 mb-3 sm:mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t("Main Menu")}</h3>
          <div className="space-y-1">
            <NavLink
              to="/manager-dashboard/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive ? "bg-teal-600 text-white shadow-md shadow-teal-100" : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{t("Dashboard")}</span>
            </NavLink>

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsCampMenuOpen(!isCampMenuOpen)}
                className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isCampMenuOpen ? "text-teal-700 bg-teal-50/50" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Tent className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">{t("Camp Mgmt")}</span>
                </div>
                <motion.div animate={{ rotate: isCampMenuOpen ? 180 : 0 }}>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isCampMenuOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50/30 rounded-xl mt-1 ml-1 sm:ml-2"
                  >
                    {campSubItems.map((sub) => (
                      <NavLink
                        key={sub.href}
                        to={sub.href}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition-all ${
                            isActive ? "text-teal-600" : "text-slate-500 hover:text-teal-600"
                          }`
                        }
                      >
                        <sub.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-[11px] sm:text-xs">{sub.name}</span>
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {mainMenu.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive ? "bg-teal-600 text-white shadow-md shadow-teal-100" : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
                  }`
                }
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Admin Group */}
        <div>
          <h3 className="px-4 mb-3 sm:mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t("Administration")}</h3>
          <div className="space-y-1">
            {adminMenu.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive ? "bg-teal-600 text-white shadow-md shadow-teal-100" : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
                  }`
                }
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Language Switcher */}
      <div className="sm:hidden px-4 py-3 border-t border-slate-100">
        <LanguageSwitcher />
      </div>

      {/* DYNAMIC USER CARD SECTION */}
      <div className="p-3 sm:p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden flex-1">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-100 border border-teal-50 overflow-hidden cursor-pointer shadow-sm"
              onClick={() => setShowLogout(true)}
            >
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-teal-50 flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                </div>
              )}
            </motion.div>

            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-none truncate">
                {user?.fullName || "Loading..."}
              </p>
              <p className="text-[9px] sm:text-[10px] text-teal-600 mt-1 font-black uppercase tracking-tighter truncate">
                {user?.role?.replace('_', ' ') || "Camp Manager"}
              </p>
            </div>
          </div>

          {/* Always Visible Red Logout Button */}
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: "#fee2e2" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowLogout(true)}
            className="p-2 sm:p-2.5 text-red-600 bg-white hover:text-red-700 rounded-xl transition-all shadow-sm border border-red-50 flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-white rounded-lg shadow-lg border border-slate-200 text-teal-600 hover:bg-slate-50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 w-72 h-full bg-white border-r border-slate-100 flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-full bg-white border-r border-slate-100 flex-col">
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      <LogoutConfirm
        open={showLogout}
        onClose={() => setShowLogout(false)}
      />

      {/* Custom styles for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        @media (max-width: 1024px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }
        }
      `}</style>
    </>
  );
};