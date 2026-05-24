import React, { useState, useEffect } from "react";
import { HiMenu, HiX, HiChevronDown, HiLogout, HiUser, HiSparkles } from "react-icons/hi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import logo from "../../assets/EthioCampGround header.png";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setIsAccountOpen(false);
    navigate("/login");
  };

  const Navlinks = [
    { href: "/", label: t("Home") },
    { href: "/camps", label: t("Explore Camps") },
    { href: "/about", label: t("About Us") },
    { href: "/contact", label: t("Contact") },
  ];

  const getInitial = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? "bg-white/80 backdrop-blur-xl py-3 shadow-lg border-b border-slate-100" : "bg-transparent py-6"}`}>
      <div className="container mx-auto flex items-center justify-between px-6">
        
        <Link to="/" className="relative z-10">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={logo} 
            alt="EthioCampGround" 
            className="h-14 md:h-16 w-auto object-contain" 
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-10">
          {Navlinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`text-sm font-bold uppercase tracking-widest transition-all duration-300 relative group ${location.pathname === link.href ? "text-emerald-600" : "text-slate-900 hover:text-emerald-600"}`}
            >
              {link.label}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-emerald-600 transition-all duration-300 ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"}`}></span>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${isScrolled ? "bg-slate-900 text-white" : "bg-white text-slate-900 shadow-xl"}`}
            >
              {user ? (
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                  {getInitial()}
                </div>
              ) : (
                <HiSparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
              )}
              {user ? t("Dashboard") : t("Join Free")}
              <HiChevronDown className={`transition-transform duration-300 ${isAccountOpen ? "rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {isAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 overflow-hidden"
                >
                  {user ? (
                    <>
                      <div className="p-4 bg-slate-50 rounded-2xl mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("Explorer Account")}</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.fullName || t("Member")}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                       <Link 
                        to={
                          user.role?.includes("admin") || user.role === "system_admin"
                            ? "/super-admin"
                            : user.role === "manager" || user.role === "camp_manager"
                              ? "/manager-dashboard"
                              : "/camper-dashboard"
                        }
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-bold text-sm"
                      >
                        <HiUser className="w-5 h-5" /> {t("My Portal")}
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm"
                      >
                        <HiLogout className="w-5 h-5" /> {t("Sign Out")}
                      </button>
                    </>
                  ) : (
                    <div className="p-2 space-y-1">
                      <Link to="/login" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-bold text-sm">
                        {t("Login to Portal")}
                      </Link>
                      <Link to="/SignUp" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl transition-all font-bold text-sm">
                        {t("Create Account")}
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-3 rounded-2xl transition-all ${isScrolled ? "bg-slate-100 text-slate-900" : "bg-white/20 text-white backdrop-blur-md"}`}
          >
            {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {Navlinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-2xl font-bold text-slate-900 hover:text-emerald-600 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
