import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Tent,
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../ui/utils";
import api from "../../services/api";
import SystemAdminLoader from "../components/SystemAdminLoader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, accent, bg, label, value, sub, subColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 flex items-center gap-3 transition-shadow",
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      )}
      style={{ background: bg || "#f9fafb", borderColor: accent ? accent + "30" : "#e5e7eb" }}
    >
      <Icon className="w-6 h-6 flex-shrink-0" style={{ color: accent }} />
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && (
          <p className={cn("text-xs mt-1", subColor || "text-gray-500")}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMetric, setChartMetric] = useState("users");
  const [chartRange, setChartRange] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch dashboard metrics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams({ metric: chartMetric, dateRange: chartRange });
      if (chartRange === 'custom') {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }
      const res = await api.get(`/admin/dashboard/chart?${params.toString()}`);
      setChartData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    } finally {
      setChartLoading(false);
    }
  }, [chartMetric, chartRange, startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (chartRange === 'custom' && (!startDate || !endDate)) return;
    fetchChartData();
  }, [fetchChartData, chartRange, startDate, endDate]);

  if (loading) {
    return <SystemAdminLoader text={t("Aggregating System Metrics...")} />;
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-500">{t('Failed to load dashboard data.')}</p>
        <button
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          {t('Retry')}
        </button>
      </div>
    );
  }

  const { metrics, systemHealthData } = data;

  const pendingCamps = metrics.pendingCamps ?? 0;
  const pendingKyc = metrics.pendingKyc ?? 0;
  const systemUptime = metrics.systemUptime ?? "N/A";
  const errorRate = metrics.errorRate ?? "N/A";
  const warningCount = metrics.warningCount ?? "N/A";
  const criticalErrors = metrics.criticalErrors ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('System Dashboard')}</h1>
          <p className="text-gray-500 mt-1">{t('Real-time platform metrics and system health')}</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {t('Refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          accent="#3b82f6"
          bg="#eff6ff"
          label={t("Active Users")}
          value={metrics.totalUsers ?? 0}
          sub={t("Real-time DB count")}
          subColor="text-blue-600"
          onClick={() => navigate('/super-admin/users?tab=campers')}
        />
        <StatCard
          icon={Tent}
          accent="#a855f7"
          bg="#faf5ff"
          label={t("Camp Managers")}
          value={metrics.totalManagers ?? 0}
          sub={t("Real-time DB count")}
          subColor="text-purple-600"
          onClick={() => navigate('/super-admin/users?tab=managers')}
        />
        <StatCard
          icon={Activity}
          accent="#ea580c"
          bg="#fff7ed"
          label={t("Banned / Suspended")}
          value={(metrics.suspendedUsers ?? 0) + (metrics.bannedUsers ?? 0)}
          sub={t("Requires attention")}
          subColor="text-orange-600"
          onClick={() => navigate('/super-admin/users?tab=campers')}
        />
      </div>

      {(metrics.pendingAppeals > 0 || pendingCamps > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.pendingAppeals > 0 && (
            <Card 
              className="p-6 border-l-4 border-l-orange-500 bg-orange-50/30 cursor-pointer hover:bg-orange-50 transition-colors shadow-sm"
              onClick={() => navigate('/super-admin/users?tab=appeals')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-orange-100">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('Pending User Appeals')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('There are {{count}} users waiting for a restriction review.', { count: metrics.pendingAppeals })}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 shadow-sm">{t('Review Now')}</Button>
              </div>
            </Card>
          )}
          {pendingCamps > 0 && (
            <Card 
              className="p-6 border-l-4 border-l-blue-500 bg-blue-50/30 cursor-pointer hover:bg-blue-50 transition-colors shadow-sm"
              onClick={() => navigate('/super-admin/camps')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                    <Tent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('Camp Approvals')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('There are {{count}} camps waiting for verification.', { count: pendingCamps })}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm">{t('Review Now')}</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          className="rounded-xl border p-5 cursor-pointer hover:shadow-sm transition-shadow flex items-center justify-between"
          style={{ background: "#fffbeb", borderColor: "#f59e0b30" }}
          onClick={() => navigate('/super-admin/camps')}
        >
          <div>
            <p className="text-sm font-medium text-gray-600">{t('Pending Camp Approvals')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCamps}</p>
          </div>
          <Clock className="w-8 h-8 flex-shrink-0" style={{ color: "#f59e0b" }} />
        </div>

        <div 
          className="rounded-xl border p-5 cursor-pointer hover:shadow-sm transition-shadow flex items-center justify-between"
          style={{ background: "#fffbeb", borderColor: "#f59e0b30" }}
          onClick={() => navigate('/super-admin/camps')}
        >
          <div>
            <p className="text-sm font-medium text-gray-600">{t('Pending KYC Documents')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingKyc}</p>
          </div>
          <AlertCircle className="w-8 h-8 flex-shrink-0" style={{ color: "#f59e0b" }} />
        </div>

        <div className="rounded-xl border p-5 flex items-center justify-between"
             style={{ background: "#f0fdf4", borderColor: "#10b98130" }}>
          <div>
            <p className="text-sm font-medium text-gray-600">{t('System Uptime')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{systemUptime}</p>
          </div>
          <CheckCircle className="w-8 h-8 flex-shrink-0" style={{ color: "#10b981" }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h3 className="font-semibold text-lg">{t('Dynamic Analytics')}</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={chartMetric} onValueChange={setChartMetric}>
              <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                <SelectValue placeholder={t('Select Metric')} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="users">{t('Total Users')}</SelectItem>
                <SelectItem value="camps">{t('Total Camps')}</SelectItem>
                <SelectItem value="bookings">{t('Total Bookings')}</SelectItem>
                <SelectItem value="total_money">{t('Total Money')}</SelectItem>
                <SelectItem value="total_commission">{t('Total Commission')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartRange} onValueChange={setChartRange}>
              <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                <SelectValue placeholder={t('Select Range')} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="today">{t('Today')}</SelectItem>
                <SelectItem value="this_week">{t('This Week')}</SelectItem>
                <SelectItem value="this_month">{t('This Month')}</SelectItem>
                <SelectItem value="last_month">{t('Last Month')}</SelectItem>
                <SelectItem value="all_time">{t('All Time')}</SelectItem>
                <SelectItem value="custom">{t('Custom Range')}</SelectItem>
              </SelectContent>
            </Select>

            {chartRange === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="w-auto bg-gray-50 border-gray-200 text-sm h-10" 
                />
                <span className="text-gray-400 text-sm font-medium">{t('to')}</span>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="w-auto bg-gray-50 border-gray-200 text-sm h-10" 
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="relative min-h-[300px]">
          {chartLoading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-gray-600">{t('Loading chart data...')}</p>
            </div>
          )}
          
          {chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              {chartMetric === 'total_money' || chartMetric === 'total_commission' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, t(chartMetric.replace('_', ' '))]} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [value, t(chartMetric.replace('_', ' '))]} 
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('No data available for the selected range')}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
          <h3 className="font-semibold text-lg mb-4">{t('Server Resource Usage')}</h3>
          {systemHealthData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={systemHealthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${t(name)}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {systemHealthData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('No health data available')}</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
          <h3 className="font-semibold text-lg mb-4">{t('Container Health')}</h3>
          <div className="space-y-3">
            {[
              { label: t("Web Server"), status: t("Healthy") },
              { label: t("Database"), status: t("Healthy") },
              { label: t("Redis Cache"), status: metrics.cacheHitRatio ? `${t("Hit Ratio:")} ${metrics.cacheHitRatio}` : t("Healthy") },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="font-semibold mt-1 text-green-700">{s.status}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        <h3 className="font-semibold text-lg mb-4">{t('Recent Error Summary')}</h3>
        <div className="space-y-3">
          {[
            { label: t("Error Rate"), sub: t("Last hour"), value: errorRate, color: "bg-green-500" },
            { label: t("Warning Count"), sub: t("Last hour"), value: warningCount, color: "bg-yellow-500" },
            { label: t("Critical Errors"), sub: t("Last hour"), value: criticalErrors, color: "bg-red-500" },
          ].map((e, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", e.color)} />
                <div>
                  <p className="font-medium text-gray-800">{e.label}</p>
                  <p className="text-sm text-gray-500">{e.sub}</p>
                </div>
              </div>
              <p className="font-bold text-gray-900">{e.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
