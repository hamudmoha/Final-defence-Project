import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Phone, 
  Clock, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  Info, 
  CircleAlert,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "../../../SystemAdmin/ui/utils";
import { format } from "date-fns";

export const ContactSupport = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", priority: "medium" });
  const [loading, setLoading] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("new"); // "new" or "history"

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.fullName || "",
        email: user.email || "",
      }));
      fetchMyTickets();
    }
  }, [user]);

  const fetchMyTickets = async () => {
    try {
      const res = await api.get("/support/my-tickets");
      setMyTickets(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/support", form);
      toast.success(t("Support request sent! Our team will get back to you shortly."));
      setForm({ 
        name: user?.fullName || "", 
        email: user?.email || "", 
        subject: "", 
        message: "", 
        priority: "medium" 
      });
      fetchMyTickets();
      setActiveTab("history");
    } catch (err) {
      toast.error(t("Failed to send message. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Contact Support')}</h1>
          <p className="text-gray-500 mt-1">{t('Need help? Our team is available to assist you with your inquiries')}</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
          <button 
            onClick={() => setActiveTab("new")}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === "new" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <MessageSquare size={16} /> {t("New Request")}
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <History size={16} /> {t("My Tickets")}
            {myTickets.filter(t => t.status === 'open').length > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full">
                {myTickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "new" ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <MessageSquare className="text-blue-600" />
                  {t("Send us a Message")}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t("Your Name")}</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t("Full Name")}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t("Email Address")}</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder={t("Email Address")}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t("Subject")}</label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder={t("Inquiry Category")}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t("Priority")}</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all"
                    >
                      <option value="low">{t("Low")}</option>
                      <option value="medium">{t("Medium")}</option>
                      <option value="high">{t("High")}</option>
                      <option value="urgent">{t("Urgent")}</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Message")}</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t("How can we help you today?")}
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm font-medium text-gray-900 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t("Sending...")}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t("Submit Message")}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <SupportCard 
                  icon={<Mail />} 
                  label={t("Email Us")} 
                  val="support@ethiocamp.com" 
                  accent="#3b82f6"
                  bg="#eff6ff"
                  href="mailto:support@ethiocamp.com"
                />
                <SupportCard 
                  icon={<Phone />} 
                  label={t("Call Us")} 
                  val="+251 956 665 176" 
                  accent="#10b981"
                  bg="#f0fdf4"
                  href="tel:+251956665176"
                />
              </div>

              <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <Zap className="text-amber-400 w-8 h-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("Immediate Assistance")}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  {t("Have an urgent issue at a campsite? Our emergency response team is available 24/7 for on-site support.")}
                </p>
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  {t("Emergency Support")} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {myTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myTickets.map((ticket) => (
                  <div key={ticket._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          ticket.status === 'resolved' ? "bg-green-500" : "bg-blue-500"
                        )} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ticket.status}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="p-6 flex-1 space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{ticket.message}</p>
                      </div>

                      {ticket.adminResponse && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 relative group">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-2">
                            <ShieldCheck size={14} /> {t("Response from Admin")}
                          </div>
                          <p className="text-sm text-blue-900 italic">"{ticket.adminResponse}"</p>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          ticket.priority === 'urgent' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                      {ticket.status === 'resolved' && (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                          <CheckCircle2 size={14} /> {t("Resolved")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
                <History className="mx-auto w-16 h-16 text-gray-200 mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t("No Support History")}</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  {t("You haven't submitted any support requests yet. If you have questions or concerns, we're here to help!")}
                </p>
                <button 
                  onClick={() => setActiveTab("new")}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  {t("Create First Ticket")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupportCard({ icon, label, val, accent, bg, href }) {
  const Content = (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex items-center gap-6">
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm border border-white transition-transform group-hover:scale-105 shrink-0"
        style={{ background: bg, color: accent }}
      >
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div className="text-left">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{val}</h3>
      </div>
    </div>
  );

  if (href) return <a href={href} className="block">{Content}</a>;
  return Content;
}
