import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Shield, AlertTriangle, Lock, Ban, Activity, RefreshCw } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import api from "../../services/api";
import SystemAdminLoader from "../components/SystemAdminLoader";

export function SecurityManagement() {
  const { t } = useTranslation();
  // Security policies (can be persisted to backend)
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [minPasswordLength, setMinPasswordLength] = useState(12);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireUppercase, setRequireUppercase] = useState(true);

  // Dynamic data from API
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newBlockedIP, setNewBlockedIP] = useState("");
  const [blockingIP, setBlockingIP] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ipsRes, policyRes] = await Promise.all([
        api.get('/admin/security/blocked-ips').catch(() => ({ data: { data: [] } })),
        api.get('/admin/security/policy').catch(() => ({ data: { data: null } })),
      ]);

      setBlockedIPs(ipsRes.data?.data ?? []);

      // Apply saved policy settings if returned
      const policy = policyRes.data?.data;
      if (policy) {
        if (policy.mfaEnabled !== undefined) setMfaEnabled(policy.mfaEnabled);
        if (policy.minPasswordLength) setMinPasswordLength(policy.minPasswordLength);
        if (policy.requireSpecialChars !== undefined) setRequireSpecialChars(policy.requireSpecialChars);
        if (policy.requireNumbers !== undefined) setRequireNumbers(policy.requireNumbers);
        if (policy.requireUppercase !== undefined) setRequireUppercase(policy.requireUppercase);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSavePasswordPolicy = async () => {
    try {
      await api.patch('/admin/security/policy', {
        mfaEnabled,
        minPasswordLength,
        requireSpecialChars,
        requireNumbers,
        requireUppercase,
      });
      toast.success(t("Password policy updated successfully"));
    } catch {
      toast.error(t("Failed to save password policy"));
    }
  };

  const handleBlockIP = async () => {
    if (!newBlockedIP.trim()) { toast.error(t("Please enter an IP address")); return; }
    setBlockingIP(true);
    try {
      await api.post('/admin/security/blocked-ips', { ip: newBlockedIP });
      toast.success(t("IP address [IP] has been blocked", { IP: newBlockedIP }));
      setNewBlockedIP("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to block IP"));
    } finally {
      setBlockingIP(false);
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      await api.delete(`/admin/security/blocked-ips/${encodeURIComponent(ip)}`);
      toast.success(t("IP address [IP] has been unblocked", { IP: ip }));
      fetchAll();
    } catch {
      toast.error(t("Failed to unblock IP"));
    }
  };

  if (loading) {
    return <SystemAdminLoader text={t('Loading Security Policies...')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('Security')} <span className="text-emerald-500">{t('Management')}</span>
          </h1>
          <p className="text-gray-500 mt-1">{t('Enforce and monitor platform security policies')}</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t('Refresh')}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
        {[
          { label: t("Blocked IPs"), value: blockedIPs.length, accent: "#ef4444", bg: "#fff1f2", icon: Ban },
        ].map(({ label, value, accent, bg, icon: Icon }) => (
          <div key={label}
            className="rounded-2xl border p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
            style={{ background: bg, borderColor: accent + "30" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "white" }}>
              <Icon className="w-6 h-6" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1 rounded-lg">
          <TabsTrigger value="policies" className="cursor-pointer">{t('Security Policies')}</TabsTrigger>
          <TabsTrigger value="ip-blacklist" className="cursor-pointer">
            {t('IP Blacklist')}
            {blockedIPs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{blockedIPs.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Security Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold">{t('Password & Authentication Policies')}</h2>
                <p className="text-sm text-gray-500">{t('Configure password complexity and MFA requirements')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-base font-medium">{t('Multi-Factor Authentication (MFA)')}</Label>
                  <p className="text-sm text-gray-500 mt-1">{t('Require all administrators to use MFA')}</p>
                </div>
                <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
              </div>

              <div className="space-y-3">
                <Label>{t('Minimum Password Length')}</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={minPasswordLength}
                    onChange={(e) => setMinPasswordLength(parseInt(e.target.value))}
                    className="w-32 bg-gray-50"
                    min={8}
                    max={32}
                  />
                  <span className="text-sm text-gray-500">{t('characters')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-base font-medium">{t('Require Special Characters')}</Label>
                  <p className="text-sm text-gray-500 mt-1">{t('Password must include @, #, $, etc.')}</p>
                </div>
                <Switch checked={requireSpecialChars} onCheckedChange={setRequireSpecialChars} />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-base font-medium">{t('Require Numbers')}</Label>
                  <p className="text-sm text-gray-500 mt-1">{t('Password must include at least one number')}</p>
                </div>
                <Switch checked={requireNumbers} onCheckedChange={setRequireNumbers} />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-base font-medium">{t('Require Uppercase Letters')}</Label>
                  <p className="text-sm text-gray-500 mt-1">{t('Password must include uppercase characters')}</p>
                </div>
                <Switch checked={requireUppercase} onCheckedChange={setRequireUppercase} />
              </div>

              <div className="pt-4">
                <Button onClick={handleSavePasswordPolicy} className="cursor-pointer">
                  {t('Save Password Policy')}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* IP Blacklist Tab — fully dynamic */}
        <TabsContent value="ip-blacklist" className="space-y-6">
          {loading && <SystemAdminLoader text={t("Fetching Blocklist...")} />}
          {!loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Ban className="w-6 h-6 text-red-600" />
              <div>
                <h2 className="text-xl font-semibold">{t('IP Address Blacklist')}</h2>
                <p className="text-sm text-gray-500">{t('Block suspicious IP addresses')}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <Input
                placeholder={t('Enter IP address to block (e.g., 192.168.1.1)')}
                value={newBlockedIP}
                onChange={(e) => setNewBlockedIP(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBlockIP()}
                className="bg-gray-50"
              />
              <Button onClick={handleBlockIP} disabled={blockingIP} className="cursor-pointer">
                {blockingIP ? t("Blocking…") : t("Block IP")}
              </Button>
            </div>

            {blockedIPs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Shield className="w-12 h-12 text-green-400 mb-3" />
                <p className="font-semibold text-gray-700">{t('No blocked IPs')}</p>
                <p className="text-sm text-gray-500">{t('The IP blacklist is currently empty.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>{t('IP Address')}</TableHead>
                      <TableHead>{t('Reason')}</TableHead>
                      <TableHead>{t('Blocked At')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead>{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((item, idx) => (
                      <TableRow key={item._id || item.ip || idx}>
                        <TableCell className="font-mono">{item.ip}</TableCell>
                        <TableCell>{t(item.reason || "—")}</TableCell>
                        <TableCell>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : item.blockedAt || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{t('Blocked')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblockIP(item.ip)}
                            className="cursor-pointer"
                          >
                            {t('Unblock')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            </div>
          )}
        </TabsContent>


      </Tabs>
    </div>
  );
}
