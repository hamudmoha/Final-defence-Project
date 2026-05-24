import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreHorizontal, 
  Send,
  User,
  Shield,
  ArrowRight,
  Mail,
  X
} from "lucide-react";
import api from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "../ui/utils";
import { format } from "date-fns";
import SystemAdminLoader from "../components/SystemAdminLoader";

export const SupportManagement = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/support/admin/all");
      setTickets(res.data.data);
    } catch (err) {
      toast.error(t("Failed to fetch tickets"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!response.trim()) return;

    try {
      await api.put(`/support/admin/respond/${selectedTicket._id}`, {
        adminResponse: response,
        status: "resolved"
      });
      toast.success(t("Response sent successfully"));
      setResponse("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      toast.error(t("Failed to send response"));
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === "all" || ticket.status === filter;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.name.toLowerCase().includes(search.toLowerCase()) ||
      ticket.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <SystemAdminLoader text={t("Loading Support Tickets...")} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Support Management")}</h1>
          <p className="text-gray-500">{t("Review and respond to camper and manager complaints")}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder={t("Search tickets...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-64"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">{t("All Status")}</option>
            <option value="open">{t("Open")}</option>
            <option value="pending">{t("Pending")}</option>
            <option value="resolved">{t("Resolved")}</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("User")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Subject")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Priority")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Status")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Date")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t("Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          {ticket.userId?.profilePicture ? (
                            <img src={ticket.userId.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{ticket.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            {ticket.role === 'manager' || ticket.role === 'camp_manager' ? (
                              <Shield size={10} className="text-purple-500" />
                            ) : (
                              <User size={10} className="text-blue-500" />
                            )}
                            {ticket.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{ticket.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        ticket.priority === 'urgent' ? "bg-red-100 text-red-700" :
                        ticket.priority === 'high' ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", getStatusColor(ticket.status))}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 justify-end ml-auto"
                      >
                        {t("View")} <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t("No support tickets found")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{t("Ticket Details")}</h3>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <User className="text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{selectedTicket.name}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail size={14} /> {selectedTicket.email}
                    </p>
                  </div>
                </div>
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border", getStatusColor(selectedTicket.status))}>
                  {selectedTicket.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Subject")}</p>
                <p className="text-gray-900 font-bold">{selectedTicket.subject}</p>
                <div className="h-px bg-gray-200 w-full"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Message")}</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.adminResponse && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 space-y-2">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} /> {t("Admin Response")}
                  </p>
                  <p className="text-sm text-blue-900">{selectedTicket.adminResponse}</p>
                  <p className="text-[10px] text-blue-400 italic">
                    {format(new Date(selectedTicket.respondedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}

              {selectedTicket.status !== 'resolved' && (
                <form onSubmit={handleRespond} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t("Your Response")}</label>
                    <textarea 
                      rows={4}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder={t("Type your response here...")}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Send size={18} />
                    {t("Send Response & Mark as Resolved")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
