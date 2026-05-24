import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { useUser } from "../../../context/UserContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();

  const displayName = user?.firstName || user?.fullName?.split(" ")[0] || user?.username || "Camper";

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 px-4 sm:px-10 py-6">
      {/* Unsaturated top rainbow line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-400/60 via-violet-400/60 via-indigo-400/60 via-blue-400/60 to-emerald-400/60 shadow-sm"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            {t("Welcome back")}, {displayName}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
            {t("Manage your bookings and explore new adventures.")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-inner">
            <LanguageSwitcher />
          </div>
          
          <div
            className="relative cursor-pointer p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 transition-all duration-500 shadow-sm hover:shadow-xl hover:scale-110 group"
            onClick={() => navigate("/camper-dashboard/notifications")}
          >
            <FaBell className="text-lg text-gray-400 group-hover:text-gray-900 transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
          </div>

          <button
            type="button"
            className="flex items-center gap-3 px-8 py-3 bg-gray-900 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl shadow-gray-200 hover:scale-105 active:scale-95"
            onClick={() => navigate("/camper-dashboard/campsite-directory")}
          >
            + {t("New Booking")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
