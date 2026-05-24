import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { User, Phone, Mail, Zap, Bell, ShieldCheck, Save, Sparkles, CircleAlert, AlertTriangle, Trash2 } from "lucide-react";
import { AccountSetting } from "./AccountSetting";
import { useUser } from "../../../context/UserContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "../../../SystemAdmin/ui/utils";

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    notifications: {
      allAlerts: true,
      systemOnly: false,
      soundEnabled: true
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || user.phoneNumber || "",
        notifications: user.metadata?.preferences || {
          allAlerts: true,
          systemOnly: false,
          soundEnabled: true
        }
      });
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        metadata: {
          ...user.metadata,
          preferences: formData.notifications
        }
      };

      const res = await api.patch(`/users/${user._id}`, payload);
      if (res.data.success) {
        await refreshUser();
        toast.success(t("Profile updated successfully"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleInitiateDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await api.get('/bookings/my-bookings');
      const activeBookings = res.data.data.filter(b => 
        ['PENDING', 'CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'].includes(b.status) && 
        new Date(b.checkIn) >= new Date()
      );
  
      if (activeBookings.length > 0) {
        setDeleteError("Cannot delete account. You have active or upcoming reservations.");
        setDeleteLoading(false);
        return;
      }
  
      await api.post('/auth/deletion-otp');
      setDeleteStep(2);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to initiate deletion");
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api.post('/auth/self-delete', { otp });
      toast.success("Account successfully deleted");
      localStorage.removeItem("token");
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      <p className="text-sm font-medium text-gray-500">{t("Loading settings...")}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Settings')}</h1>
          <p className="text-gray-500 mt-1">{t('Manage your account preferences and information')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 xl:col-span-3">
          <AccountSetting />
        </div>

        <section className="lg:col-span-8 xl:col-span-9 space-y-8">
          {/* Profile Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("Personal Information")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("Update your profile and contact details")}</p>
              </div>
              <User className="text-blue-500 w-5 h-5" />
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Full Name")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Email Address")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Phone Number")}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+251..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("Notification Preferences")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("Manage how you want to be notified")}</p>
              </div>
              <Bell className="text-blue-500 w-5 h-5" />
            </div>
            
            <div className="p-8 space-y-4">
              <ToggleRow 
                icon={<CircleAlert size={18} />} 
                title={t("Critical Only")} 
                desc={t("Only receive important system and booking alerts")}
                active={formData.notifications.systemOnly}
                onClick={() => setFormData({
                  ...formData, 
                  notifications: { ...formData.notifications, systemOnly: !formData.notifications.systemOnly }
                })}
              />

              <ToggleRow 
                icon={<Bell size={18} />} 
                title={t("Sound Alerts")} 
                desc={t("Play a sound when you receive a new notification")}
                active={formData.notifications.soundEnabled}
                onClick={() => setFormData({
                  ...formData, 
                  notifications: { ...formData.notifications, soundEnabled: !formData.notifications.soundEnabled }
                })}
              />
            </div>

            <div className="px-8 py-6 bg-gray-50 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t("Save Changes")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/50 rounded-2xl border border-red-100 shadow-sm overflow-hidden mt-8">
            <div className="px-8 py-6 border-b border-red-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-red-900">{t("Danger Zone")}</h2>
                <p className="text-sm text-red-700 mt-1">{t("Irreversible and destructive actions")}</p>
              </div>
              <AlertTriangle className="text-red-500 w-5 h-5" />
            </div>
            
            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-md font-bold text-gray-900">{t("Delete Account")}</h4>
                <p className="text-sm text-gray-600 mt-1 max-w-xl">
                  {t("Permanently delete your account and remove all personal data. Active bookings must be completed or cancelled first.")}
                </p>
              </div>
              <button 
                onClick={() => {
                  setDeleteStep(1);
                  setOtp("");
                  setDeleteError("");
                  setShowDeleteModal(true);
                }}
                className="px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                {t("Delete Account")}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">{t("Delete Account")}</h3>
            </div>
            
            {deleteStep === 1 ? (
              <>
                <p className="text-gray-600 mb-6">
                  {t("Are you sure you want to delete your account? This action cannot be undone. All your personal data will be permanently anonymized.")}
                </p>
                {deleteError && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{deleteError}</div>}
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">{t("Cancel")}</button>
                  <button onClick={handleInitiateDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {deleteLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : null}
                    {t("Initiate Deletion")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {t("We've sent a 6-digit verification code to your email. Enter it below to confirm deletion.")}
                </p>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)}
                  placeholder="------"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-6 font-mono text-center text-2xl tracking-widest font-bold text-gray-900"
                  maxLength={6}
                />
                {deleteError && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{deleteError}</div>}
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">{t("Cancel")}</button>
                  <button onClick={handleConfirmDelete} disabled={deleteLoading || otp.length !== 6} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                    {deleteLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : null}
                    {t("Permanently Delete")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ icon, title, desc, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-lg border shadow-sm transition-colors",
          active ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-400 border-gray-100"
        )}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <button 
        className={cn(
          "w-11 h-6 rounded-full transition-all relative",
          active ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <motion.div 
          animate={{ x: active ? 22 : 4 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
        />
      </button>
    </div>
  );
}
