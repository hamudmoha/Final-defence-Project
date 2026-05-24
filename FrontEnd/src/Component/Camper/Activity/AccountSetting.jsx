import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { User, Shield, Bell, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export const AccountSetting = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      label: t("Profile Information"),
      icon: User,
      path: "/camper-dashboard/settings",
    },
    {
      label: t("Security & Password"),
      icon: Shield,
      path: "/camper-dashboard/settings/security-password",
    },
    {
      label: t("Notifications"),
      icon: Bell,
      path: "/camper-dashboard/settings/notification",
    },
  ];

  return (
    <aside className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-6 w-full h-fit space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
          <Settings className="w-5 h-5 text-teal-500" />
          {t("Settings")}
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
          {t("System Preferences")}
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map(({ label, icon: Icon, path }) => {
          const isActive = path === "/camper-dashboard/settings" 
            ? location.pathname === path 
            : location.pathname.startsWith(path);

          return (
            <NavLink
              key={label}
              to={path}
              className={`
                group flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                ${isActive 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-2" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }
              `}
            >
              <Icon size={18} className={isActive ? "text-teal-400" : "text-slate-300 group-hover:text-slate-400"} />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
