import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Bell, FileText, Mail, MessageSquare, Users, RefreshCw } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import SystemAdminLoader from "../components/SystemAdminLoader";

export function ReportsAlerts() {
  const { t } = useTranslation();
  
  const ALERT_TEMPLATES = [
    { id: "maintenance", name: t("Scheduled Maintenance"), body: t("We will be performing scheduled maintenance on [DATE] at [TIME]. Expected downtime: [DURATION].") },
    { id: "feature", name: t("New Feature Announcement"), body: t("We're excited to announce [FEATURE_NAME]! This new feature allows you to [DESCRIPTION].") },
    { id: "policy", name: t("Policy Update"), body: t("We've updated our [POLICY_NAME]. The changes will take effect on [DATE]. Please review the updated policy.") },
    { id: "disruption", name: t("Service Disruption"), body: t("We're experiencing technical difficulties with [SERVICE]. Our team is working to resolve this. We apologize for the inconvenience.") },
  ];

  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertRecipients, setAlertRecipients] = useState("all");

  const [alertHistory, setAlertHistory] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [uptimeData, setUptimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, metricsRes] = await Promise.all([
        api.get('/admin/alerts/history').catch(() => ({ data: { data: [] } })),
        api.get('/admin/system-metrics').catch(() => ({ data: { data: null } })),
      ]);
      setAlertHistory(historyRes.data?.data ?? []);
      const metrics = metricsRes.data?.data;
      setSystemMetrics(metrics);
      if (metrics?.uptimeTrend) setUptimeData(metrics.uptimeTrend);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSendAlert = async () => {
    if (!alertTitle.trim() || !alertMessage.trim()) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    setSendingAlert(true);
    try {
      await api.post('/admin/alerts/send', {
        title: alertTitle,
        message: alertMessage,
        recipients: alertRecipients,
      });
      toast.success(`${t("Alert sent to")} ${alertRecipients === "all" ? t("all users") : t(alertRecipients)}`);
      setAlertTitle("");
      setAlertMessage("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to send alert"));
    } finally {
      setSendingAlert(false);
    }
  };

  const handleUseTemplate = (template) => {
    setAlertTitle(template.name);
    setAlertMessage(template.body);
    setActiveTab("alerts");
    toast.info(t("Template loaded — customize and send"));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Reports & Alerts')}</h1>
          <p className="text-gray-500 mt-1">{t('Generate technical reports and send notifications')}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t('Refresh')}
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger value="alerts" className="cursor-pointer">{t('Send Alerts')}</TabsTrigger>
          <TabsTrigger value="templates" className="cursor-pointer">{t('Alert Templates')}</TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">{t('Alert History')}</TabsTrigger>
        </TabsList>



        <TabsContent value="alerts" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t('Send System Alert')}</h2>
                <p className="text-sm text-gray-500 font-medium">{t('Notify users about maintenance, features, or policy changes')}</p>
              </div>
            </div>

            <div className="space-y-6 max-w-2xl">
              <div>
                <Label htmlFor="alert-title" className="font-bold text-gray-700 mb-2 block">{t('Alert Title *')}</Label>
                <Input
                  id="alert-title"
                  placeholder={t('Enter alert title...')}
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="alert-message" className="font-bold text-gray-700 mb-2 block">{t('Message *')}</Label>
                <Textarea
                  id="alert-message"
                  placeholder={t('Enter your message...')}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={5}
                  className="bg-gray-50 border-gray-200 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="recipients" className="font-bold text-gray-700 mb-2 block">{t('Recipients')}</Label>
                <Select value={alertRecipients} onValueChange={setAlertRecipients}>
                  <SelectTrigger id="recipients" className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">{t('All Users')}</SelectItem>
                    <SelectItem value="campers">{t('Campers Only')}</SelectItem>
                    <SelectItem value="managers">{t('Camp Managers Only')}</SelectItem>
                    <SelectItem value="active">{t('Active Users Only')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-bold text-gray-700 mb-3 block">{t('Delivery Methods')}</Label>
                <div className="flex flex-wrap gap-6 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer" />
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                      <Mail className="w-4 h-4" />
                      <span>{t('Email')}</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer" />
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                      <Bell className="w-4 h-4" />
                      <span>{t('In-App')}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={handleSendAlert} size="lg" className="cursor-pointer shadow-lg px-8 font-bold" disabled={sendingAlert}>
                  {sendingAlert ? t("Sending…") : t("Send Alert")}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800">{t('Pre-Approved Alert Templates')}</h2>
              <p className="text-sm text-gray-500 font-medium">{t('Quick-send common notifications')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALERT_TEMPLATES.map((template) => (
                <div key={template.id} className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">{template.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed italic">&ldquo;{template.body}&rdquo;</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="cursor-pointer mt-6 shadow-sm font-bold group-hover:bg-green-50 group-hover:text-green-600 group-hover:border-green-200"
                  >
                    {t('Use Template')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {loading && <SystemAdminLoader text={t("Retrieving Alert History...")} />}
          {!loading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{t('Alert History')}</h2>

            {alertHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 bg-gray-50 rounded-full mb-6">
                  <Bell className="w-12 h-12 text-gray-300" />
                </div>
                <p className="font-bold text-gray-900 text-lg mb-1">{t('No alerts sent yet')}</p>
                <p className="text-sm text-gray-500 font-medium">{t('Alerts you send will appear here.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold">{t('Type / Title')}</TableHead>
                      <TableHead className="font-bold">{t('Message')}</TableHead>
                      <TableHead className="font-bold">{t('Recipients')}</TableHead>
                      <TableHead className="font-bold">{t('Sent At')}</TableHead>
                      <TableHead className="font-bold">{t('Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertHistory.map((alert, idx) => (
                      <TableRow key={alert._id || alert.id || idx} className="hover:bg-gray-50/30 transition-colors">
                        <TableCell>
                          <Badge variant="outline" className="font-bold border-gray-200">{t(alert.type || alert.title)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md text-sm text-gray-600 leading-relaxed font-medium">{alert.message}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-bold text-gray-700">
                            <Users className="w-4 h-4 text-gray-400" />
                            {t(alert.recipients)} {alert.recipientsCount ? `(${alert.deliveredCount || alert.recipientsCount}/${alert.recipientsCount})` : ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-500">
                          {alert.createdAt
                            ? new Date(alert.createdAt).toLocaleString()
                            : alert.sentAt || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={alert.status === "sent" ? "default" : "secondary"} className={alert.status === "sent" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                            {t(alert.status)}
                          </Badge>
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
