import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, Plus, Mail, CheckCircle2, Clock, XCircle, Calendar,
  LayoutTemplate, Settings, Loader, AlertCircle, CheckCheck, Inbox
} from 'lucide-react';
import api from '../../../services/api';
import { useUser } from '../../../context/UserContext';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';
import toast, { Toaster } from 'react-hot-toast';

export const NotificationManagement = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingRead, setMarkingRead] = useState(null);
  
  // Data states
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, failed: 0 });
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState({ provider: 'SendGrid', smtp: '', fromEmail: '', port: 587 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', codeName: '', subject: '', body: '' });

  const tabs = ['All', 'Booking', 'Payment', 'System'];

  const { user } = useUser();
  const isAdmin = user && ['admin', 'system_admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchPromises = [
          api.get('/notifications', { params: { page: 1, limit: 50 } })
        ];

        if (isAdmin) {
          fetchPromises.push(api.get('/notifications/stats'));
          fetchPromises.push(api.get('/notifications/templates'));
          fetchPromises.push(api.get('/notifications/settings'));
        }

        const results = await Promise.all(fetchPromises);
        
        // Notifications are always the first promise
        setNotifications(results[0].data.data || []);

        if (isAdmin) {
          setStats(results[1].data);
          setTemplates(results[2].data.data || []);
          setSettings(results[3].data);
        }
      } catch (err) {
        console.error('Error fetching data', err);
        setError('Failed to load notifications data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const filteredNotifications = notifications.filter(notif => {
    const matchesTab = activeTab === 'All' || notif.category === activeTab;
    const matchesSearch = notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/notifications/templates', newTemplate);
      const res = await api.get('/notifications/templates');
      setTemplates(res.data.data);
      setShowCreateModal(false);
      setNewTemplate({ name: '', codeName: '', subject: '', body: '' });
    } catch (err) {
      console.error('Failed to create template', err);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkRead = async (notifId) => {
    if (markingRead) return;
    setMarkingRead(notifId);
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Fire and forget bulk update
      api.patch('/notifications/mark-all-read').catch(console.error);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await api.put('/notifications/settings', { [key]: value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('Failed to update setting', err);
    }
  };

  if (loading) {
    return <IntelligenceLoader text="Initializing Notifications..." />;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />


      {/* Header (same as before) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notification & Analytics</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white transition-all w-full md:w-64"
            />
          </div>
          <button className="relative p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Sent', value: stats.total, icon: Mail, color: 'text-indigo-500', bg: 'bg-indigo-50', baseColor: 'bg-indigo-500' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', baseColor: 'bg-emerald-500' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', baseColor: 'bg-amber-500' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', baseColor: 'bg-rose-500' },
          ].map((stat, idx) => (
            <motion.div
              key={`${stat.label}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg flex flex-col justify-between group overflow-hidden transition-shadow duration-300"
            >
              {/* L-Shape Color Accent */}
              <div className={`absolute bottom-0 left-0 w-full h-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:h-2`}></div>
              <div className={`absolute bottom-0 left-0 h-full w-1.5 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:w-2`}></div>

              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 ${stat.bg} rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tabs + Search row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2 bg-slate-100/50 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {filteredNotifications.some(n => !n.isRead) && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Notifications</h2>
          <p className="text-sm text-slate-500 mt-0.5">Latest system notifications and alerts</p>
        </div>
        <div className="divide-y divide-slate-100">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="p-16 text-center text-slate-500 flex flex-col items-center justify-center"
              >
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <Inbox className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No notifications</h3>
                <p className="text-sm">You're all caught up! There are no notifications to display here.</p>
              </motion.div>
            ) : (
              filteredNotifications.map((notif, idx) => (
                <motion.div
                  layout
                  key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className={`p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/50 cursor-pointer ${!notif.isRead ? 'bg-teal-50/30 border-l-4 border-l-teal-500' : 'border-l-4 border-l-transparent'}`}
                  onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 rounded-full bg-indigo-50 shrink-0">
                      {notif.icon === 'Calendar' ? <Calendar className="w-5 h-5 text-indigo-500" /> :
                       notif.icon === 'CheckCircle2' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                       notif.icon === 'Clock' ? <Clock className="w-5 h-5 text-amber-500" /> :
                       <XCircle className="w-5 h-5 text-rose-500" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold ${!notif.isRead ? 'text-teal-900' : 'text-slate-800'}`}>{notif.title}</h4>
                      <p className={`text-xs mt-1 ${!notif.isRead ? 'text-teal-700 font-medium' : 'text-slate-500'}`}>{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${notif.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : notif.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    {notif.status}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Templates Section */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-800">Notification Templates</h2>
            </div>
            <p className="text-sm text-slate-500 ml-7">Manage email and SMS templates</p>
          </div>
          <div className="divide-y divide-slate-100">
            {templates.map((template, idx) => (
              <motion.div key={template.id} className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-slate-800">{template.name}</h3>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${template.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{template.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-slate-400">Code:</span>
                  <code className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-mono border border-slate-200">{template.codeName}</code>
                </div>
                <div className="flex items-center justify-between">
                  <button className="text-xs font-medium text-slate-500 hover:text-slate-800">Edit Template</button>
                  <button className="text-xs font-medium text-slate-500 hover:text-slate-800">Preview</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Section */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-800">Notification Settings</h2>
            </div>
            <p className="text-sm text-slate-500 ml-7">Configure delivery options</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-800">Email Service Provider</label>
              <select value={settings.provider} onChange={(e) => updateSetting('provider', e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm mt-1">
                <option>SendGrid</option><option>Mailgun</option><option>Amazon SES</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">SMTP Server</label>
              <input type="text" value={settings.smtp} onChange={(e) => updateSetting('smtp', e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">From Email Address</label>
              <input type="email" value={settings.fromEmail} onChange={(e) => updateSetting('fromEmail', e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Port</label>
              <input type="number" value={settings.port} onChange={(e) => updateSetting('port', parseInt(e.target.value))} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Create Template</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><XCircle className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label><input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Code Name</label><input type="text" value={newTemplate.codeName} onChange={(e) => setNewTemplate({...newTemplate, codeName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Subject</label><input type="text" value={newTemplate.subject} onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Body</label><textarea rows={4} value={newTemplate.body} onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2" required /></div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{creating ? <Loader className="w-4 h-4 animate-spin inline" /> : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


