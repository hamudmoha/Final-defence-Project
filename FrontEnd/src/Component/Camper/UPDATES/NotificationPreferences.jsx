import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import { AccountSetting } from "../Activity/AccountSetting";
import {
  Calendar,
  CreditCard,
  Megaphone,
  Bell,
  Sparkles,
  Zap,
  ShieldCheck,
  Info,
  CircleAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "../../../SystemAdmin/ui/utils";

export const NotificationPreferences = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const [preferences, setPreferences] = useState({
    booking: true,
    payment: true,
    promo: false,
    system: true,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user?.metadata?.notifications) {
      setPreferences(user.metadata.notifications);
    }
    if (user) {
      setInitialLoading(false);
    }
  }, [user]);

  const toggle = async (key) => {
    if (loading) return;

    const previousPrefs = preferences;
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);

    try {
      setLoading(true);
      const payload = {
        metadata: {
          ...user?.metadata,
          notifications: newPrefs,
        },
      };
      await api.patch("/users/me", payload);
      await refreshUser();
      toast.success(t("Preferences updated"));
    } catch (err) {
      if (err.response?.status === 404 && user?._id) {
        try {
          await api.patch(`/users/${user._id}`, { metadata: { ...user?.metadata, notifications: newPrefs } });
          await refreshUser();
          toast.success(t("Preferences updated"));
        } catch (fallbackErr) {
          setPreferences(previousPrefs);
          toast.error(t("Failed to update preferences"));
        }
      } else {
        setPreferences(previousPrefs);
        toast.error(t("Failed to update preferences"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      <p className="text-sm font-medium text-gray-500">{t("Loading preferences...")}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Notification Settings')}</h1>
          <p className="text-gray-500 mt-1">{t('Configure how you want to receive system and booking updates')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 xl:col-span-3">
          <AccountSetting />
        </div>

        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("Communication Channels")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("Enable or disable specific notification types")}</p>
              </div>
              <Bell className="text-blue-500 w-5 h-5" />
            </div>

            <div className="divide-y divide-gray-100">
              <PreferenceItem
                icon={<Calendar className="w-5 h-5" />}
                title={t("Booking Updates")}
                description={t("Notifications about your reservation status and check-in reminders.")}
                enabled={preferences.booking}
                onToggle={() => toggle("booking")}
                loading={loading}
                accent="#3b82f6"
                bg="#eff6ff"
              />
              <PreferenceItem
                icon={<CreditCard className="w-5 h-5" />}
                title={t("Payment Alerts")}
                description={t("Updates on payment confirmations, invoices, and refund status.")}
                enabled={preferences.payment}
                onToggle={() => toggle("payment")}
                loading={loading}
                accent="#10b981"
                bg="#f0fdf4"
              />
              <PreferenceItem
                icon={<Megaphone className="w-5 h-5" />}
                title={t("Promotions & Offers")}
                description={t("Stay informed about new campsites and special seasonal discounts.")}
                enabled={preferences.promo}
                onToggle={() => toggle("promo")}
                loading={loading}
                accent="#f59e0b"
                bg="#fffbeb"
              />
              <PreferenceItem
                icon={<ShieldCheck className="w-5 h-5" />}
                title={t("Account Security")}
                description={t("Critical alerts regarding your account login and security changes.")}
                enabled={preferences.system}
                onToggle={() => toggle("system")}
                loading={loading}
                accent="#ef4444"
                bg="#fef2f2"
              />
            </div>

            <div className="px-8 py-4 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Info size={14} />
                <span className="text-xs font-medium italic">
                  {loading ? t("Updating preferences...") : t("Settings are saved automatically")}
                </span>
              </div>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              )}
            </div>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
            <Zap className="text-blue-600 w-5 h-5 shrink-0" />
            <p className="text-sm text-blue-900 font-medium leading-relaxed">
              <span className="font-bold">{t("Note")}:</span> {t("Some critical system notifications (like password resets) cannot be disabled for security reasons.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceItem({ icon, title, description, enabled, onToggle, loading, accent, bg }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 hover:bg-gray-50/50 transition-all group">
      <div className="flex items-start gap-5 pr-8">
        <div 
          className="p-3 rounded-xl shadow-sm transition-all group-hover:scale-105 border border-white"
          style={{ background: bg, color: accent }}
        >
          {icon}
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={loading}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-all outline-none",
          enabled ? "bg-blue-600" : "bg-gray-200",
          loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <motion.span
          animate={{ x: enabled ? 22 : 4 }}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"
        >
          {loading && (
            <div className="animate-spin h-2 w-2 border-2 border-blue-600 border-t-transparent rounded-full" />
          )}
        </motion.span>
      </button>
    </div>
  );
}
