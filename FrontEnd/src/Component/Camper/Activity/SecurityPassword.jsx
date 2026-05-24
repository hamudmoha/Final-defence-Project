import React, { useState } from "react";
import { Lock, Shield, Check, Save, ShieldAlert, Sparkles, CircleCheck, CircleAlert } from "lucide-react";
import { AccountSetting } from "./AccountSetting";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { cn } from "../../../SystemAdmin/ui/utils";

export const SecurityPassword = () => {
  const { t } = useTranslation();
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: ""
  });
  const [loading, setLoading] = useState(false);

  const getStrength = () => {
    const len = passwords.newPass.length;
    if (len === 0) return { label: "", color: "", width: "0%" };
    if (len < 6) return { label: t("Weak"), color: "bg-red-500", textColor: "text-red-500", width: "33%" };
    if (len < 10) return { label: t("Moderate"), color: "bg-amber-500", textColor: "text-amber-500", width: "66%" };
    return { label: t("Strong"), color: "bg-green-500", textColor: "text-green-500", width: "100%" };
  };

  const handleUpdate = async () => {
    if (passwords.newPass !== passwords.confirm) {
      toast.error(t("Passwords do not match"));
      return;
    }
    
    setLoading(true);
    try {
      // Logic for password change
      toast.success(t("Password updated successfully"));
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(t("Failed to update password"));
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Security & Password')}</h1>
          <p className="text-gray-500 mt-1">{t('Manage your password and account security settings')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-4 xl:col-span-3">
          <AccountSetting />
        </div>

        <section className="lg:col-span-8 xl:col-span-9 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t("Change Password")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("Keep your account secure with a strong password")}</p>
              </div>
              <Lock className="text-blue-500 w-5 h-5" />
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Current Password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("New Password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={passwords.newPass}
                      onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                  {strength.label && (
                    <div className="space-y-2 mt-2 px-1">
                      <div className="flex justify-between items-center">
                        <span className={cn("text-[11px] font-bold uppercase tracking-wider", strength.textColor)}>
                          {t("Strength")}: {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: strength.width }}
                          className={cn("h-full transition-all duration-300", strength.color)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Confirm New Password")}</label>
                  <div className="relative">
                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl text-blue-600 shadow-sm border border-blue-100">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{t("Two-Factor Authentication")}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t("Add an extra layer of security to your account.")}</p>
                  </div>
                </div>
                <button className="px-5 py-2 bg-white text-blue-600 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  {t("Enable 2FA")}
                </button>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 flex justify-end">
              <button 
                onClick={handleUpdate}
                disabled={!passwords.current || !passwords.newPass || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t("Updating...")}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t("Update Password")}
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
