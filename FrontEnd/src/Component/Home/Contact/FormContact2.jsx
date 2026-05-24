import React, { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiSend, FiUser, FiMail, FiPhone, FiInfo } from "react-icons/fi";
import contactImage from "../../../assets/Contact-image.png";

export default function ContactFormSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Securely transmitting message...");

    try {
      const res = await api.post("/contact", formData);
      if (res?.data?.success) {
        toast.success("Message received. Our team will contact you shortly.", { id: loadingToast });
        setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "General Inquiry", message: "" });
      } else {
        toast.error("Transmission failed. Please check your connection.", { id: loadingToast });
      }
    } catch (error) {
      toast.error("System error. Please try again later.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-emerald-600 font-bold text-xs uppercase tracking-[0.3em] mb-4 block">Direct Channel</span>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">Partner with the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Architects.</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            Whether you're a manager looking to join the ecosystem or an adventurer with a story to tell, we're here to listen.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50" />
              <img src={contactImage} alt="Contact Us" className="rounded-[60px] shadow-2xl w-full object-cover relative z-10" />
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-xl"
          >
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <FiUser /> First Name
                  </label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Abebe" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-900" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <FiUser /> Last Name
                  </label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Kebede" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-900" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <FiMail /> Business Email
                  </label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@company.com" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-900" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <FiPhone /> Contact Number
                  </label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251 9--" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-900" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <FiInfo /> Nature of Inquiry
                </label>
                <select name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer">
                  <option>General Inquiry</option>
                  <option>Booking Escalation</option>
                  <option>Camp Partnership</option>
                  <option>System Infrastructure</option>
                  <option>Feedback & Suggestions</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  Message Details
                </label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Describe your mission..." className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-900" required />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Encrypting..." : "Initialize Transmission"} <FiSend className="w-6 h-6" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
