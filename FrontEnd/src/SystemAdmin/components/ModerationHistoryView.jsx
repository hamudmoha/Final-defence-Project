import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  User as UserIcon, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import api from '../../services/api';

const ModerationHistoryView = ({ userId, isAdmin = true }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const endpoint = isAdmin 
          ? `/admin/users/${userId}/history` 
          : `/manager/users/${userId}/history`;
        const res = await api.get(endpoint);
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId, isAdmin]);

  const getActionStyles = (action) => {
    switch (action) {
      case 'ban': return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
      case 'suspend': return { color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock };
      case 'unban':
      case 'unsuspend': return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
      case 'warn': return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle };
      default: return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Shield };
    }
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );

  if (history.length === 0) return (
    <div className="p-12 text-center text-gray-400">
      <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p className="text-sm font-medium">No moderation events recorded for this user.</p>
    </div>
  );

  return (
    <div className="space-y-4 p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
      {history.map((record, index) => {
        const styles = getActionStyles(record.action);
        const Icon = styles.icon;
        const isExpanded = expandedId === record._id;

        return (
          <motion.div 
            key={record._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all ${isExpanded ? 'ring-2 ring-gray-100' : ''}`}
          >
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : record._id)}
            >
              <div className={`w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${styles.color}`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-widest ${styles.color}`}>
                    {record.action} {record.type === 'local' ? '(LOCAL)' : '(GLOBAL)'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">• {new Date(record.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{record.reason}</h4>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Performed By</p>
                <p className="text-xs font-bold text-gray-700">{record.actorId?.fullName || 'System'}</p>
              </div>

              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 overflow-hidden"
                >
                  <div className="pt-2 border-t border-gray-50 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Full Reason / Message</p>
                      <p className="text-sm text-gray-700 leading-relaxed italic">"{record.reason}"</p>
                    </div>

                    {record.firstAppeal?.message && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <p className="text-[10px] font-black uppercase text-green-600">User's Initial Appeal</p>
                        </div>
                        <p className="text-sm text-green-800 leading-relaxed italic">"{record.firstAppeal.message}"</p>
                        
                        {(record.firstAppeal.attachments?.license || record.firstAppeal.attachments?.govId) && (
                          <div className="mt-3 flex gap-2">
                            {record.firstAppeal.attachments.license && (
                              <a 
                                href={`${api.defaults.baseURL}/${record.firstAppeal.attachments.license}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-white border border-green-100 rounded-lg text-[10px] font-bold text-green-700 flex items-center gap-2 hover:bg-green-100"
                              >
                                <FileText className="w-3 h-3" /> License
                              </a>
                            )}
                            {record.firstAppeal.attachments.govId && (
                              <a 
                                href={`${api.defaults.baseURL}/${record.firstAppeal.attachments.govId}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-white border border-green-100 rounded-lg text-[10px] font-bold text-green-700 flex items-center gap-2 hover:bg-green-100"
                              >
                                <FileText className="w-3 h-3" /> Gov ID
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Recorded: {new Date(record.createdAt).toLocaleString()}
                      </div>
                      {record.campId && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Camp: {record.campId.name}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ModerationHistoryView;
