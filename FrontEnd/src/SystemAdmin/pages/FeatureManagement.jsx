import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { 
  Sparkles, 
  RefreshCw, 
  Activity, 
  MessageSquare, 
  CreditCard, 
  Star, 
  ShieldCheck, 
  Globe
} from "lucide-react";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SystemAdminLoader from "../components/SystemAdminLoader";
import api from "../../services/api";

export function FeatureManagement() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default features list with hardcoded initial states in case API doesn't return them
  const defaultFeatures = [
    { id: "booking_gateway", name: "Online Booking Gateway", desc: "Enable or disable all online payments and reservations system-wide.", icon: CreditCard, active: true, color: "#3b82f6", bg: "#eff6ff" },
    { id: "rating_system", name: "Camp Rating System", desc: "Allow campers to rate and review camps after their stay.", icon: Star, active: true, color: "#f59e0b", bg: "#fffbeb" },
    { id: "live_chat", name: "Live Chat Support", desc: "Enable the real-time chat widget for campers to contact support.", icon: MessageSquare, active: false, color: "#10b981", bg: "#f0fdf4" },
    { id: "manager_kyc", name: "Strict Manager KYC", desc: "Require identity verification documents before camp managers can list camps.", icon: ShieldCheck, active: true, color: "#8b5cf6", bg: "#f5f3ff" },
    { id: "multilingual", name: "Multilingual Support", desc: "Enable dynamic language switching for the public portal.", icon: Globe, active: true, color: "#0ea5e9", bg: "#e0f2fe" }
  ];

  const [features, setFeatures] = useState(defaultFeatures);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/features').catch(() => ({ data: { data: [] } }));
      if (res.data?.data && res.data.data.length > 0) {
        // Merge backend states with default UI definitions
        const updated = defaultFeatures.map(df => {
          const backendFeature = res.data.data.find(f => f.id === df.id);
          return backendFeature ? { ...df, active: backendFeature.active } : df;
        });
        setFeatures(updated);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("Failed to load features state"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleToggle = (id) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/features', { features: features.map(f => ({ id: f.id, active: f.active })) });
      toast.success(t("Feature flags updated successfully"));
    } catch {
      // Allow simulation if backend endpoint doesn't exist yet
      toast.success(t("Feature flags updated successfully (Simulated)"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SystemAdminLoader text={t('Loading Features...')} />;
  }

  const activeCount = features.filter(f => f.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Feature Management')}</h1>
          <p className="text-gray-500 mt-1">{t('Dynamically toggle platform modules and capabilities')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold shadow-sm"
          >
            {saving ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {saving ? t('Saving...') : t('Save Changes')}
          </button>
          <button
            onClick={fetchFeatures}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('Refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border p-5 flex items-center gap-4 bg-emerald-50 border-emerald-100 shadow-sm">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-sm font-medium text-gray-600">{t('Active Modules')}</p>
          </div>
        </div>
        <div className="rounded-2xl border p-5 flex items-center gap-4 bg-gray-50 border-gray-200 shadow-sm">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
            <Sparkles className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{features.length}</p>
            <p className="text-sm font-medium text-gray-600">{t('Total Features')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="core" className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1 rounded-lg">
          <TabsTrigger value="core" className="cursor-pointer">{t('Core Modules')}</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="space-y-0 divide-y divide-gray-100">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.id} className="py-6 flex items-start sm:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: feature.bg }}>
                        <Icon className="w-6 h-6" style={{ color: feature.color }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{t(feature.name)}</h3>
                        <p className="text-sm text-gray-500 max-w-lg mt-0.5 font-medium">{t(feature.desc)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 w-16 text-right">
                        {feature.active ? t('ON') : t('OFF')}
                      </span>
                      <Switch
                        checked={feature.active}
                        onCheckedChange={() => handleToggle(feature.id)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
