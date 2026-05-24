import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import { ShieldX, AlertTriangle, Send, LogOut, CheckCircle, MessageSquare, Paperclip, User as UserIcon } from "lucide-react";
import { useUser } from "../../context/UserContext";
import api from "../../services/api";

export const BannedPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const [appeal, setAppeal] = useState("");
  const [licenseFile, setLicenseFile] = useState(null);
  const [govIdFile, setGovIdFile] = useState(null);
  const [submitted, setSubmitted] = useState(user?.hasAppeal || false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Chat state
  const [modData, setModData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/moderation/my-status");
      if (res.data.success) {
        setModData(res.data.data);
        if (res.data.data?.chat?.isEscalated) {
          setSubmitted(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch moderation status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [modData?.chat?.messages]);

  if (!user) return <Navigate to="/login" replace />;

  const isManager = user?.role === "camp_manager";
  const isSuspended = user?.status === "suspended";
  const accentColor = isSuspended ? "#f97316" : "#ef4444";
  const bgColor     = isSuspended ? "#fff7ed" : "#fff1f2";
  const borderColor = isSuspended ? "#fed7aa" : "#fecaca";

  const handleAppeal = async () => {
    if (!appeal.trim()) { setError(t("Please type a message.")); return; }
    
    // Initial validation only for managers on first submission
    if (!submitted && isManager) {
      if (!licenseFile && !user.appealAttachments?.license) {
        setError(t("Managers must upload Business License.")); return;
      }
      if (!govIdFile && !user.appealAttachments?.govId) {
        setError(t("Managers must upload Government ID.")); return;
      }
    }
    
    setError("");
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append("message", appeal);
    if (licenseFile) formData.append("license", licenseFile);
    if (govIdFile) formData.append("govId", govIdFile);

    try {
      await api.post("/moderation/appeal", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAppeal("");
      setLicenseFile(null);
      setGovIdFile(null);
      setSubmitted(true);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || t("Failed to send. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const isEscalated = modData?.chat?.isEscalated;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-lg shadow-green-200">
            <span className="text-white font-black text-sm">G</span>
          </div>
          <span className="font-bold text-gray-800 text-lg tracking-tight">GondorCamp</span>
        </div>
      </motion.div>

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full ${isEscalated ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-500`}
        style={{ height: isEscalated ? '700px' : 'auto' }}
      >
        {/* Header */}
        <div style={{ background: accentColor }} className="px-8 py-6 text-center shrink-0 relative">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <ShieldX className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {t("Account")} {isSuspended ? t("Suspended") : t("Banned")}
          </h1>
          <p className="text-white/80 mt-1 text-xs font-medium">
            {isSuspended ? t("Temporary Access Restriction") : t("Permanent Account Ban")}
          </p>
          
          {isEscalated && (
            <div className="absolute top-6 right-8 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t("Chat Active")}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!isEscalated ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8 space-y-5 overflow-y-auto"
              >
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: accentColor }}>
                    {user?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full border shrink-0"
                    style={{ background: bgColor, color: accentColor, borderColor }}>
                    {user?.status?.toUpperCase()}
                  </span>
                </div>

                {/* Reason */}
                {modData?.moderation?.reason && (
                  <div className="p-5 rounded-2xl border bg-gray-50/50 border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: accentColor }} />
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: accentColor }} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("Decision Context")}</p>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed italic">"{modData.moderation.reason}"</p>
                  </div>
                )}

                {/* Appeal Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-sm">{t("Official Appeal")}</h3>
                    {submitted && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">{t("Review in Progress")}</span>}
                  </div>
                  
                  {!submitted ? (
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {isManager 
                          ? t("As a manager, please upload your Business License and Government ID. This will be reviewed by the System Administration team.")
                          : t("Provide a detailed explanation of why you believe this decision should be reconsidered.")}
                      </p>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: t("License"), file: licenseFile, setter: setLicenseFile, uploadLabel: t("Upload License") },
                            { label: t("Gov ID"), file: govIdFile, setter: setGovIdFile, uploadLabel: t("Upload Gov ID") }
                          ].map((item, idx) => (
                            <div key={idx} className="relative group">
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*,.pdf" onChange={e => item.setter(e.target.files[0])} />
                              <div className={`p-3 rounded-2xl border-2 border-dashed flex flex-col items-center gap-1 transition-all ${item.file ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                <Paperclip className={`w-4 h-4 ${item.file ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className="text-[10px] font-bold truncate max-w-full text-gray-500">{item.file ? item.file.name : item.uploadLabel}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                      <div className="relative">
                        <textarea
                          value={appeal}
                          onChange={e => { setAppeal(e.target.value); setError(""); }}
                          placeholder={t("Your message to the moderation team...")}
                          className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm focus:ring-2 focus:ring-gray-200 focus:outline-none min-h-[120px] resize-none placeholder:text-gray-400"
                        />
                      </div>
                      
                      {error && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}

                      <button
                        onClick={handleAppeal}
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-xl shadow-red-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: accentColor, boxShadow: `0 10px 25px -5px ${accentColor}44` }}
                      >
                        {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" />{t("Submit Review Request")}</>}
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl text-center space-y-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-bold text-blue-900">{t("Initial Message Delivered")}</p>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        {t("An administrator has been notified of your appeal. If they require more information, a chat window will open here automatically.")}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                  {modData.chat.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] flex flex-col ${msg.senderId._id === user._id ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl text-sm ${
                          msg.senderId._id === user._id 
                            ? 'bg-gray-900 text-white rounded-tr-none' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.content}
                          {msg.attachments?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                              {msg.attachments.map((at, i) => (
                                <a key={i} href={`${api.defaults.baseURL}/${at}`} target="_blank" rel="noreferrer" className="text-[10px] underline flex items-center gap-1 opacity-80 hover:opacity-100">
                                  <Paperclip className="w-3 h-3" /> View Attachment {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                      <textarea
                        value={appeal}
                        onChange={e => setAppeal(e.target.value)}
                        placeholder={t("Type your message...")}
                        className="w-full p-4 pr-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-gray-200 focus:outline-none min-h-[50px] max-h-[150px] resize-none"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAppeal(); } }}
                      />
                      <button 
                        onClick={handleAppeal}
                        disabled={!appeal.trim() || submitting}
                        className="absolute right-2 bottom-2 p-2 rounded-xl bg-gray-900 text-white disabled:opacity-30 transition-all hover:scale-105"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-50 shrink-0 flex items-center justify-between bg-gray-50/30">
          <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-[11px] font-bold uppercase tracking-wider">
            <LogOut className="w-4 h-4" /> {t("Sign Out")}
          </button>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <UserIcon className="w-3 h-3" /> {t("Secure Moderation Portal")}
          </div>
        </div>
      </motion.div>

      <p className="mt-8 text-[11px] text-gray-400 font-medium">
        {t("Reference ID:")} <span className="text-gray-500">{modData?.moderation?._id?.slice(-8).toUpperCase() || '—'}</span>
      </p>
    </div>
  );
}
