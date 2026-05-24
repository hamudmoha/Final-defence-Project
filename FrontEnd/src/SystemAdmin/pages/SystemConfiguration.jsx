import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Settings, Key, Globe, Activity, AlertCircle } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useUser } from "../../context/UserContext";
import SystemAdminLoader from "../components/SystemAdminLoader";
import React from "react";



export function SystemConfiguration() {
  const { t, i18n } = useTranslation();
  const [timezone, setTimezone] = useState("Africa/Addis_Ababa");
  const [currency, setCurrency] = useState("ETB");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [language, setLanguage] = useState("en");
  const [cancellationWindow, setCancellationWindow] = useState("24");

  const handleLanguageChange = (val) => {
    setLanguage(val);
    i18n.changeLanguage(val);
  };
  const [smsKey, setSmsKey] = useState("");
  const [emailKey, setEmailKey] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingAPI, setIsSavingAPI] = useState(false);
  const [profileImg, setProfileImg] = useState(null);
  const fileInputRef = React.useRef(null);
  const { user, refreshUser } = useUser();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.name || user.fullName || "");
    }
  }, [user]);
  
  const [healthData, setHealthData] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [confRes, healthRes] = await Promise.all([
        api.get('/admin/config').catch(() => ({ data: { data: [] } })),
        api.get('/admin/dashboard').catch(() => ({ data: { data: null } }))
      ]);
      
      const configMap = (confRes.data?.data || []).reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
      
      if (configMap.timezone) setTimezone(configMap.timezone);
      if (configMap.currency) setCurrency(configMap.currency);
      if (configMap.dateFormat) setDateFormat(configMap.dateFormat);
      if (configMap.language) setLanguage(configMap.language);
      if (configMap.cancellationWindow) setCancellationWindow(configMap.cancellationWindow);
      if (configMap.cloudinaryKey) setCloudinaryKey(configMap.cloudinaryKey);
      if (configMap.smsKey) setSmsKey(configMap.smsKey);
      if (configMap.emailKey) setEmailKey(configMap.emailKey);
      
      setHealthData(healthRes.data?.data?.systemHealthData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setProfileImg(file);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      await api.patch('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (refreshUser) await refreshUser();
      toast.success(t("Profile photo updated"));
    } catch {
      toast.error(t("Failed to update profile photo"));
    }
  };

  const handleNameSave = async () => {
    if (fullName && fullName !== (user?.name || user?.fullName)) {
      try {
        await api.patch('/users/me', { fullName });
        if (refreshUser) await refreshUser();
        toast.success(t("Name updated successfully"));
      } catch {
        toast.error(t("Failed to update name"));
      }
    }
  };

  const updateSystemConfig = async (key, value) => {
    try {
      await api.patch(`/admin/config/${key}`, { value });
      toast.success(t(`${key} updated successfully`));
    } catch {
      toast.error(t(`Failed to update ${key}`));
    }
  };

  const handleTimezoneChange = (val) => {
    setTimezone(val);
    updateSystemConfig('timezone', val);
  };

  const handleCurrencyChange = (val) => {
    setCurrency(val);
    updateSystemConfig('currency', val);
  };

  const handleDateFormatChange = (val) => {
    setDateFormat(val);
    updateSystemConfig('dateFormat', val);
  };

  const handleLanguageUpdate = (val) => {
    setLanguage(val);
    i18n.changeLanguage(val);
    updateSystemConfig('language', val);
  };

  if (loading) {
    return <SystemAdminLoader text={t('Loading Configuration...')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('System Configuration')}</h1>
        <p className="text-gray-500 mt-1">{t('Global application settings and integrations')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1 rounded-lg">
          <TabsTrigger value="general" className="cursor-pointer">{t('General Settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">{t('Regional Settings')}</h2>
                <p className="text-sm text-gray-500">{t('Configure timezone, currency, and date formats')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Admin Profile Photo Section */}
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center gap-6 mb-8">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-200 flex items-center justify-center">
                      {profileImg ? (
                        <img src={URL.createObjectURL(profileImg)} alt="Preview" className="w-full h-full object-cover" />
                      ) : user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Settings className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-[10px] font-bold">
                      {t('CHANGE')}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e.target.files[0])}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{t('Admin Identity Photo')}</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      {t('This photo represents your official system identity. It will be shown in logs and system-wide audits.')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">{t('Admin Name')}</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="bg-gray-50"
                    placeholder={t("Enter your full name")}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('Update your display name across the system. Changes are saved automatically when you click outside or press Enter.')}</p>
                </div>
                <div>
                  <Label htmlFor="timezone">{t('Timezone')}</Label>
                  <Select value={timezone} onValueChange={handleTimezoneChange}>
                    <SelectTrigger id="timezone" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Africa/Addis_Ababa">Africa/Addis Ababa (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">{t('Default Currency')}</Label>
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="ETB">{t('Ethiopian Birr (ETB)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">{t('Date Format')}</Label>
                  <Select value={dateFormat} onValueChange={handleDateFormatChange}>
                    <SelectTrigger id="dateFormat" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">{t('Default Language')}</Label>
                  <Select value={language} onValueChange={handleLanguageUpdate}>
                    <SelectTrigger id="language" className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="en">{t('English')}</SelectItem>
                      <SelectItem value="am">{t('Amharic')}</SelectItem>
                      <SelectItem value="om">{t('Oromo')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">{t('Business Settings')}</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="cancellation">{t('Cancellation Window (hours)')}</Label>
                <Input
                  id="cancellation"
                  type="number"
                  value={cancellationWindow}
                  onChange={(e) => setCancellationWindow(e.target.value)}
                  className="max-w-xs bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">{t('Hours before check-in for free cancellation')}</p>
              </div>
            </div>
          </div>
        </TabsContent>



      </Tabs>
    </div>
  );
}
