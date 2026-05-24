import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight, 
  Info, 
  History,
  CheckCircle2,
  Clock,
  LifeBuoy
} from "lucide-react";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import { IntelligenceLoader } from "../../Common/IntelligenceLoader.jsx";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "../../../SystemAdmin/ui/utils";
import { format } from "date-fns";

export const ManagerSupport = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [form, setForm] = useState({ subject: "", message: "", priority: "medium" });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [myTickets, setMyTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("new");

  const fetchMyTickets = async () => {
    try {
      const res = await api.get("/support/my-tickets");
      setMyTickets(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/support", {
        ...form,
        name: user?.fullName,
        email: user?.email
      });
      toast.success(t("Support ticket submitted! We will review it shortly."));
      setForm({ subject: "", message: "", priority: "medium" });
      fetchMyTickets();
      setActiveTab("history");
    } catch (err) {
      toast.error(t("Failed to submit ticket."));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <IntelligenceLoader text={t("Initializing Support...")} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans space-y-8">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <LifeBuoy className="text-teal-600" />
            {t("Manager Support Center")}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{t("Need assistance with your camp management or have a technical issue?")}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("new")}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === "new" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <MessageSquare size={18} /> {t("New Ticket")}
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <History size={18} /> {t("History")}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "new" ? (
          <motion.div 
            key="new"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                <h2 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{t("Submit Support Ticket")}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">{t("Subject")}</label>
                    <input 
                      type="text" 
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      placeholder={t("What is the issue?")}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:outline-none font-medium text-slate-900 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">{t("Priority Level")}</label>
                    <select 
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:outline-none font-medium text-slate-900 shadow-inner appearance-none"
                    >
                      <option value="low">{t("Low - General Inquiry")}</option>
                      <option value="medium">{t("Medium - Assistance Needed")}</option>
                      <option value="high">{t("High - Critical Bug")}</option>
                      <option value="urgent">{t("Urgent - Urgent Assistance")}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">{t("Detailed Description")}</label>
                  <textarea 
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder={t("Please provide as much detail as possible...")}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:outline-none resize-none font-medium text-slate-900 shadow-inner"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                  {t("Submit Ticket to System Admin")}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <ShieldCheck className="text-blue-400 w-10 h-10 mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("Manager Priority")}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t("As a camp manager, your tickets are prioritized by our system administrators to ensure your business operations remain smooth.")}
                </p>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("Average Response Time")}</p>
                    <p className="text-sm font-bold">{t("< 4 Hours")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Info size={18} className="text-blue-500" />
                  {t("Quick Help")}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    {t("How to update tent prices")}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    {t("Managing booking cancellations")}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    {t("Payout verification process")}
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            {myTickets.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {myTickets.map((ticket) => (
                  <div key={ticket._id} className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        ticket.status === 'resolved' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {ticket.status === 'resolved' ? <CheckCircle2 size={24} /> : <MessageSquare size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            ticket.priority === 'urgent' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">{ticket.message}</p>
                        {ticket.adminResponse && (
                          <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
                            <p className="text-xs font-bold text-blue-600 mb-1 tracking-wider uppercase">{t("Admin Response")}</p>
                            <p className="text-sm text-blue-900 italic font-medium">"{ticket.adminResponse}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full",
                        ticket.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {ticket.status.toUpperCase()}
                      </div>
                      <p className="text-xs text-gray-400">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
                <History size={64} className="mx-auto text-gray-200 mb-6" />
                <h3 className="text-xl font-bold text-gray-900">{t("No Support History")}</h3>
                <p className="text-gray-500 mt-2">{t("Your support requests and their status will appear here.")}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
