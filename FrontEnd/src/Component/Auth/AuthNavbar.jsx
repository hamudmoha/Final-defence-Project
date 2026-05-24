import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown, HiSparkles, HiUser, HiLogout } from "react-icons/hi";
import { useUser } from "../../context/UserContext";
import logo from "../../assets/EthioCampGround header.png";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
const AuthNavbar = () => {
  const { t } = useTranslation();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setIsAccountOpen(false);
    navigate("/login");
  };
  const getInitial = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl py-2 border-b border-slate-100 shadow-sm font-sans">
      {" "}
      <div className="container mx-auto flex items-center justify-between px-6">
        {" "}
        {/* Logo Side */}{" "}
        <Link to="/" className="relative z-10">
          {" "}
          <motion.img
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            src={logo}
            alt="EthioCampGround"
            className="h-10 md:h-12 w-auto object-contain"
          />{" "}
        </Link>{" "}
        {/* Account/Dropdown Side */}{" "}
        <div className="flex items-center gap-4">
          {" "}
          <LanguageSwitcher />{" "}
          <div className="relative">
            {" "}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-medium text-sm transition-all shadow-xl shadow-emerald-200"
            >
              {" "}
              {user ? (
                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-[8px]">
                  {" "}
                  {getInitial()}{" "}
                </div>
              ) : (
                <HiSparkles className="w-4 h-4 text-emerald-400" />
              )}{" "}
              {user ? t("My Account") : t("Access Portal")}{" "}
              <HiChevronDown
                className={`transition-transform duration-300 ${isAccountOpen ? "rotate-180" : ""}`}
              />{" "}
            </motion.button>{" "}
            <AnimatePresence>
              {" "}
              {isAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-60 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 overflow-hidden"
                >
                  {" "}
                  {user ? (
                    <>
                      {" "}
                      <div className="p-4 bg-slate-50 rounded-2xl mb-2">
                        {" "}
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {t("Active Session")}
                        </p>{" "}
                        <p className="text-sm font-black text-slate-900 truncate">
                          {user.fullName || t("Member")}
                        </p>{" "}
                      </div>{" "}
                      <Link
                        to={
                          user.role?.includes("admin")
                            ? "/super-admin"
                            : user.role?.includes("manager")
                              ? "/manager-dashboard"
                              : "/camper-dashboard"
                        }
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-bold text-xs uppercase tracking-wide"
                      >
                        {" "}
                        <HiUser className="w-4 h-4" /> {t("Dashboard")}{" "}
                      </Link>{" "}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-xs uppercase tracking-wide"
                      >
                        {" "}
                        <HiLogout className="w-4 h-4" /> {t("Sign Out")}{" "}
                      </button>{" "}
                    </>
                  ) : (
                    <div className="p-2 space-y-1">
                      {" "}
                      <Link
                        to="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-bold text-xs uppercase tracking-wide"
                      >
                        {" "}
                        {t("Login")}{" "}
                      </Link>{" "}
                      <Link
                        to="/SignUp"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-wide"
                      >
                        {" "}
                        {t("Register")}{" "}
                      </Link>{" "}
                    </div>
                  )}{" "}
                </motion.div>
              )}{" "}
            </AnimatePresence>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </nav>
  );
};
export default AuthNavbar;
