import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Ban, CheckCircle, XCircle, Bell, Shield,
  Wifi, User, Tent, Search, RefreshCw, X, Clock, ChevronDown, Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import api from "../../services/api";
import { format } from "date-fns";
import SystemAdminLoader from "../components/SystemAdminLoader";

const getEventConfig = (t) => ({
  warn_user:     { label: t("Warning Sent"),     icon: AlertTriangle, accent: "#f59e0b", bg: "#fffbeb", pill: "bg-yellow-100 text-yellow-800"  },
  warn_camp:     { label: t("Camp Warned"),      icon: Tent,          accent: "#f59e0b", bg: "#fffbeb", pill: "bg-yellow-100 text-yellow-800"  },
  ban_user:      { label: t("User Banned"),      icon: Ban,           accent: "#ef4444", bg: "#fff1f2", pill: "bg-red-100 text-red-800"        },
  suspend_user:  { label: t("User Suspended"),   icon: Ban,           accent: "#f97316", bg: "#fff7ed", pill: "bg-orange-100 text-orange-800"  },
  appeal_submitted: { label: t("User Appealed"),   icon: AlertTriangle, accent: "#f97316", bg: "#fff7ed", pill: "bg-orange-100 text-orange-800"  },
  activate_user: { label: t("User Activated"),   icon: CheckCircle,   accent: "#10b981", bg: "#f0fdf4", pill: "bg-green-100 text-green-800"   },
  approve_camp:  { label: t("Camp Approved"),    icon: CheckCircle,   accent: "#10b981", bg: "#f0fdf4", pill: "bg-green-100 text-green-800"   },
  reject_camp:   { label: t("Camp Rejected"),    icon: XCircle,       accent: "#ef4444", bg: "#fff1f2", pill: "bg-red-100 text-red-800"        },
  send_alert:    { label: t("Alert Broadcast"),  icon: Bell,          accent: "#3b82f6", bg: "#eff6ff", pill: "bg-blue-100 text-blue-800"     },
  block_ip:      { label: t("IP Blocked"),       icon: Shield,        accent: "#ef4444", bg: "#fff1f2", pill: "bg-red-100 text-red-800"        },
  unblock_ip:     { label: t("IP Unblocked"),     icon: Wifi,          accent: "#10b981", bg: "#f0fdf4", pill: "bg-green-100 text-green-800"   },
  edit_user:      { label: t("User Edited"),      icon: User,          accent: "#8b5cf6", bg: "#f5f3ff", pill: "bg-purple-100 text-purple-800" },
  edit_camp:      { label: t("Camp Edited"),      icon: Tent,          accent: "#8b5cf6", bg: "#f5f3ff", pill: "bg-purple-100 text-purple-800" },
});

const getRoleLabels = (t) => ({
  admin: t("System Admin"), super_admin: t("Super Admin"),
  camp_manager: t("Camp Manager"), manager: t("Camp Manager"), camper: t("Camper"),
});

function cfg(action, t) {
  const configs = getEventConfig(t);
  return configs[action] || { label: t("System Event"), icon: Info, accent: "#6b7280", bg: "#f9fafb", pill: "bg-gray-100 text-gray-700" };
}

function useTimeAgo() {
  const { t } = useTranslation();
  return useCallback((ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (s < 60)   return `${s}${t("s ago")}`;
    if (s < 3600) return `${Math.floor(s/60)}${t("m ago")}`;
    if (s < 86400)return `${Math.floor(s/3600)}${t("h ago")}`;
    return `${Math.floor(s/86400)}${t("d ago")}`;
  }, [t]);
}

function fullDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
}

function DetailModal({ event, onClose }) {
  const { t } = useTranslation();
  const c = cfg(event.action, t);
  const Icon = c.icon;
  const actorName = event.actorName || event.actorId?.fullName || "System";
  const actorRole = event.actorRole || event.actorId?.role;
  const roleLabels = getRoleLabels(t);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div style={{ background: c.accent }} className="px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white/80 text-xs font-medium uppercase tracking-widest">{t(event.service)} {t('event')}</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{c.label}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock className="w-4 h-4" />
            {event.timestamp ? fullDate(event.timestamp) : "—"}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('Performed By')}</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ background: c.accent }}>
                {actorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{actorName}</p>
                {actorRole && (
                  <p className="text-xs text-gray-500">{roleLabels[actorRole] || actorRole}</p>
                )}
              </div>
            </div>
          </div>

          {event.targetName && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('Target')}</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  {event.targetType === "camp" ? <Tent className="w-4 h-4 text-gray-600" /> : <User className="w-4 h-4 text-gray-600" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{event.targetName}</p>
                  <p className="text-xs text-gray-500 capitalize">{t(event.targetType || "user")}</p>
                </div>
              </div>
            </div>
          )}

          {event.reason && (
            <div className="rounded-xl p-4 border" style={{ background: c.bg, borderColor: c.accent + "33" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: c.accent }}>
                {event.action === "send_alert" ? t("Alert Message") : t("Reason / Message")}
              </p>
              <p className="text-gray-800 text-sm leading-relaxed">{event.reason}</p>
            </div>
          )}

          <p className="text-gray-500 text-sm italic border-t border-gray-100 pt-3">
            {event.message}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function EventRow({ event, onClick }) {
  const { t } = useTranslation();
  const formatTimeAgo = useTimeAgo();
  const c = cfg(event.action, t);
  const Icon = c.icon;
  const actorName = event.actorName || event.actorId?.fullName || "System";
  const actorRole = event.actorRole || event.actorId?.role;
  const roleLabels = getRoleLabels(t);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-50 last:border-none"
      onClick={() => onClick(event)}
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: c.bg }}>
          <Icon className="w-4 h-4" style={{ color: c.accent }} />
        </div>
        <div className="w-px flex-1 bg-gray-100 min-h-[8px]" />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.pill}`}>{c.label}</span>
          <span className="text-xs text-gray-400 font-medium">{formatTimeAgo(event.timestamp)}</span>
        </div>

        <p className="text-sm text-gray-800 font-medium leading-snug">
          <span className="text-gray-900 font-bold">{actorName}</span>
          {actorRole && (
            <span className="text-gray-400 text-xs ml-1 font-medium">({roleLabels[actorRole] || actorRole})</span>
          )}
          {" "}
          <span style={{ color: c.accent }} className="font-bold lowercase">{c.label.toLowerCase()}</span>
          {event.targetName && (
            <> →{" "}<span className="font-bold text-gray-900">{event.targetName}</span></>
          )}
        </p>

        {event.reason && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium">
            <span className="font-bold">{t('Reason')}: </span>{event.reason}
          </p>
        )}
      </div>

      <button
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all px-4 py-1.5 text-xs font-bold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 shadow-sm"
      >
        {t('Details')}
      </button>
    </motion.div>
  );
}

export function LogsMonitoring() {
  const { t } = useTranslation();
  const [events, setEvents]       = useState([]);
  const [stats, setStats]         = useState({ total: 0, alerts: 0, bans: 0, approvals: 0, security: 0 });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [search, setSearch]       = useState("");
  const [actionFilter, setAction] = useState("all");
  const [range, setRange]         = useState("7d");

  const fetchEvents = useCallback(async (opts = {}) => {
    setRefreshing(true);
    try {
      const p = new URLSearchParams();
      if (opts.q)      p.append("q",      opts.q);
      if (opts.action && opts.action !== "all") p.append("action", opts.action);
      if (opts.range)  p.append("range",  opts.range);

      const res  = await api.get(`/admin/logs?${p.toString()}`);
      const data = res.data?.data;
      if (data) {
        setEvents(data.entries ?? []);
        setStats(data.stats ?? { total: 0, alerts: 0, bans: 0, approvals: 0, security: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents({ action: actionFilter, range });
  }, [fetchEvents, actionFilter, range]);

  const alertPatterns = [
    { name: t("Repeated Login Failures"), desc: t("Alert when 5+ failed login attempts from same IP"), active: true  },
    { name: t("High Error Rate"),          desc: t("Alert when error rate exceeds 1% of total requests"),   active: true  },
  ];

  const loggingStack = [
    { name: "Elasticsearch", color: "#1d4ed8", bg: "#eff6ff", desc: t("Log storage and indexing")    },
    { name: "Logstash",       color: "#15803d", bg: "#f0fdf4", desc: t("Log processing pipeline")     },
    { name: "Kibana",         color: "#7e22ce", bg: "#faf5ff", desc: t("Visualization and analysis")  },
  ];

  if (loading) {
    return <SystemAdminLoader text={t('Loading event log…')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Event Log')}</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            {t('Audit trail of every significant action — bans, warnings, approvals, alerts, and more.')}
          </p>
        </div>
        <button
          onClick={() => fetchEvents({ q: search, action: actionFilter, range })}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {t('Refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: t("All Events"),  value: stats.total,     accent: "#6366f1", bg: "#eef2ff", icon: Clock     },
          { label: t("Alerts Sent"), value: stats.alerts,    accent: "#f59e0b", bg: "#fffbeb", icon: Bell      },
          { label: t("Bans"),        value: stats.bans,      accent: "#ef4444", bg: "#fff1f2", icon: Ban       },
          { label: t("Approvals"),   value: stats.approvals, accent: "#10b981", bg: "#f0fdf4", icon: CheckCircle},
          { label: t("Security"),    value: stats.security,  accent: "#0ea5e9", bg: "#f0f9ff", icon: Shield    },
        ].map(({ label, value, accent, bg, icon: Icon }) => (
          <div key={label}
            className="rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all group"
            style={{ background: bg, borderColor: accent + "30" }}
          >
            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9 bg-gray-50 border-gray-200"
            placeholder={t('Search by name, camp, IP…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchEvents({ q: search, action: actionFilter, range })}
          />
        </div>

        <Select value={actionFilter} onValueChange={v => { setAction(v); fetchEvents({ q: search, action: v, range }); }}>
          <SelectTrigger className="w-56 bg-gray-50 border-gray-200 font-medium">
            <SelectValue placeholder={t('Filter by event')} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">{t('All Events')}</SelectItem>
            <SelectItem value="warn_user">{t('Warnings to Users')}</SelectItem>
            <SelectItem value="warn_camp">{t('Warnings to Camps')}</SelectItem>
            <SelectItem value="ban_user">{t('User Bans')}</SelectItem>
            <SelectItem value="suspend_user">{t('User Suspensions')}</SelectItem>
            <SelectItem value="appeal_submitted">{t('User Appeals')}</SelectItem>
            <SelectItem value="activate_user">{t('User Activations')}</SelectItem>
            <SelectItem value="approve_camp">{t('Camp Approvals')}</SelectItem>
            <SelectItem value="reject_camp">{t('Camp Rejections')}</SelectItem>
            <SelectItem value="send_alert">{t('Broadcast Alerts')}</SelectItem>
            <SelectItem value="block_ip">{t('IP Blocks')}</SelectItem>
            <SelectItem value="unblock_ip">{t('IP Unblocks')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={v => { setRange(v); fetchEvents({ q: search, action: actionFilter, range: v }); }}>
          <SelectTrigger className="w-44 bg-gray-50 border-gray-200 font-medium">
            <SelectValue placeholder={t('Time range')} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="24h">{t('Last 24h')}</SelectItem>
            <SelectItem value="7d">{t('Last 7 days')}</SelectItem>
            <SelectItem value="30d">{t('Last 30 days')}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => fetchEvents({ q: search, action: actionFilter, range })}
          className="px-6 rounded-xl font-bold shadow-sm"
        >
          {t('Search')}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{t('Activity Timeline')}</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold">
              {events.length} {t('events')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('Live')}</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">{t('No events found')}</p>
            <p className="text-sm text-gray-500 font-medium max-w-xs">{t('Events appear here when admins or managers take significant actions.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map((e, i) => (
              <EventRow key={e._id || i} event={e} onClick={setSelectedEvent} />
            ))}
          </div>
        )}
      </div>



      <AnimatePresence>
        {selectedEvent && (
          <DetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
