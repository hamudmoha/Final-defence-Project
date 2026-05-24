import React, { useState, useEffect } from "react";
import { FaQrcode, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/api";
import Sidebar from "../Sidebar/Sidebar";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const RainbowCard = ({ children, className = "", onClick }) => (
  <motion.div
    whileHover={{ y: -8 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    onClick={onClick}
    className={`group relative overflow-hidden rounded-[2rem] bg-white border border-gray-100/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 ${className}`}
  >
    {/* Unsaturated pastel rainbow background */}
    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/60 via-violet-50/60 via-indigo-50/60 via-blue-50/60 to-emerald-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
    <div className="absolute -inset-24 bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>

    <div className="relative p-8 h-full flex flex-col z-10">
      {children}
    </div>
  </motion.div>
);

export default function UserDashboard() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get("/bookings/my-bookings");
        if (res.data.success) {
          setTickets(res.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <RainbowCard>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{t("Entry Tokens")}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">{t("Authorization for wilderness zones")}</p>
                </div>
                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:text-emerald-700 transition-all">{t("Archives")}</button>
              </div>

              {loading ? (
                <div className="space-y-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-36 bg-gray-50/50 animate-pulse rounded-[2rem] border border-gray-100"></div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-100 shadow-inner">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">{t("No active tokens found.")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {tickets.map((ticket) => (
                    <TicketCard
                      key={ticket._id}
                      status={ticket.status}
                      title={ticket.tentId?.name || t("Wilderness Pass")}
                      park={ticket.campId?.name || t("Verified Sector")}
                      date={new Date(ticket.checkIn).toLocaleDateString()}
                      price={`${ticket.totalPrice} ETB`}
                    />
                  ))}
                </div>
              )}
            </RainbowCard>
          </div>

          <div className="lg:col-span-1 space-y-10">
            <RainbowCard>
              <div className="flex flex-col h-full justify-between gap-10">
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3 uppercase">{t("Verification Protocol")}</h3>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed">{t("Display your digital token QR at sector arrival points for biometric synchronization and entry authorization.")}</p>
                </div>
                <div className="w-28 h-28 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-gray-800 self-start group-hover:scale-110 transition-transform duration-700">
                  <FaQrcode className="text-5xl text-white" />
                </div>
              </div>
            </RainbowCard>
            
            <RainbowCard>
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                 <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
                 {t("Security Directives")}
               </h3>
               <ul className="space-y-5">
                 {[t("Encrypted QR: Keep Private"), t("Pre-Arrival Protocol: Ready ID"), t("Biometric ID: Mandatory")].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200"></span>
                     {item}
                   </li>
                 ))}
               </ul>
            </RainbowCard>
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketCard({ status, title, park, date, price }) {
  const { t } = useTranslation();
  return (
    <div className="group border border-gray-100/50 rounded-[1.5rem] p-6 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 bg-white/40 backdrop-blur-sm hover:bg-white cursor-default">
      <div className="flex justify-between items-start mb-6">
        <span className={`text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] border shadow-2xl ${
          status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-300 border-gray-100'
        }`}>
          {t(status)}
        </span>
        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-gray-900 group-hover:text-white transition-all duration-500 shadow-inner border border-gray-100">
          <FaQrcode className="text-lg" />
        </div>
      </div>

      <h3 className="text-lg font-black text-gray-900 tracking-tight line-clamp-1 group-hover:text-emerald-700 transition-colors uppercase mb-1">{title}</h3>
      <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
        <FaMapMarkerAlt className="text-emerald-500" />
        <span className="line-clamp-1">{park}</span>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100/50">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <FaCalendarAlt className="text-gray-300" /> {date}
        </span>
        <div className="text-right">
          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{t("Value")}</p>
          <span className="text-sm font-black text-gray-900">{price}</span>
        </div>
      </div>
    </div>
  );
}
