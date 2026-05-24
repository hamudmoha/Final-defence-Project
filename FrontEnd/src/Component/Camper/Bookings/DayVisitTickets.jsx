import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../../services/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Ticket,
  Globe,
  Flag,
  Plus,
  Clock,
  Calendar,
  MapPin,
  Star,
  Heart,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info,
  CircleAlert,
  QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "../../../SystemAdmin/ui/utils";

export const DayVisitTickets = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState("Domestic Visitor");
  const [ticketPrices, setTicketPrices] = useState({});
  const [camps, setCamps] = useState([]);
  const [campsLoading, setCampsLoading] = useState(true);

  // States for viewing purchased tickets
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await api.get("/camps");
        if (response.data && response.data.success) {
          setCamps(response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load camps", err);
        toast.error(t("Failed to load camps. Please try again."));
      } finally {
        setCampsLoading(false);
      }
    };
    fetchCamps();
  }, [t]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const txRef = urlParams.get('verify_ticket');
    if (txRef && txRef.trim()) {
      const verifyPayment = async () => {
        const loadingToast = toast.loading(t("Verifying ticket payment..."));
        try {
          const response = await api.get(`/tickets/verify/${encodeURIComponent(txRef.trim())}`);
          if (response.data && response.data.success) {
            toast.success(t("Payment verified successfully! Your ticket is now active."), {
              id: loadingToast,
            });
            handleOpenTicketsModal();
          } else {
            toast.error(response.data?.message || t("Payment verification failed. Please contact support."), {
              id: loadingToast,
            });
          }
        } catch (error) {
          toast.error(error.response?.data?.message || t("Could not verify payment with gateway."), {
            id: loadingToast,
          });
        } finally {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      };
      verifyPayment();
    }
  }, [location.search, t]);

  const handleOpenModal = (type) => {
    setSelectedTicketType(type);
    if (type === "Domestic Visitor") {
      setTicketPrices({ "Adult (18+)": 250, "Child (3–17)": 150, "Infant (0–2)": 0 });
    } else {
      setTicketPrices({ "Adult (18+)": 25, "Child (3–17)": 15, "Infant (0–2)": 0 });
    }
    setOpen(true);
  };

  const handlePurchase = async (ticketData) => {
    try {
      if (!ticketData.campId) return toast.error(t("Select a camp destination"));
      if (!ticketData.visitDate) return toast.error(t("Select visit date"));
      if (!ticketData.quantity || ticketData.quantity < 1) return toast.error(t("Enter valid quantity"));

      const payload = {
        campId: ticketData.campId,
        visitDate: ticketData.visitDate,
        ticketType: ticketData.ticketType,
        quantity: ticketData.quantity,
        totalPrice: ticketData.totalPrice,
        visitorType: ticketData.visitorType,
        currency: ticketData.currency,
        adultCount: ticketData.adultCount,
        childCount: ticketData.childCount,
        infantCount: ticketData.infantCount
      };

      const response = await api.post("/tickets", payload);
      if (response.data) {
        if (response.data.checkout_url) {
          toast.success(t("Redirecting to Chapa payment gateway..."));
          setTimeout(() => {
            window.location.href = response.data.checkout_url;
          }, 1000);
        } else {
          toast.success(t("Ticket reserved successfully! Please settle payment at the gate."));
          setOpen(false);
          handleOpenTicketsModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t("Failed to reserve ticket"));
    }
  };

  const handleOpenTicketsModal = async () => {
    setShowTicketsModal(true);
    setMyTicketsLoading(true);
    try {
      const response = await api.get("/tickets");
      if (response.data && response.data.success) {
        setMyTickets(response.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load your tickets"));
    } finally {
      setMyTicketsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Day Visit Tickets')}</h1>
          <p className="text-gray-500 mt-1">{t('Book short-term passes for park visits and day tours')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenTicketsModal}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Clock size={16} /> {t("My Tickets")}
          </button>
          <button
            onClick={() => handleOpenModal("Domestic Visitor")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> {t("Buy Ticket")}
          </button>
        </div>
      </div>

      {/* Ticket Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TicketTier 
          title={t("Domestic Visitor")}
          subtitle={t("For Ethiopian residents")}
          badge={t("Local Rate")}
          icon={<Flag />}
          accent="#10b981"
          bg="#f0fdf4"
          onBuy={() => handleOpenModal("Domestic Visitor")}
          prices={[
            { label: t("Adult (18+)"), price: 250 },
            { label: t("Child (3–17)"), price: 150 },
            { label: t("Infant (0–2)"), price: 0, free: true },
          ]}
        />
        <TicketTier 
          title={t("International Visitor")}
          subtitle={t("For global travelers")}
          badge={t("Standard Rate")}
          icon={<Globe />}
          accent="#3b82f6"
          bg="#eff6ff"
          onBuy={() => handleOpenModal("International Visitor")}
          prices={[
            { label: t("Adult (18+)"), price: 25, currency: "USD" },
            { label: t("Child (3–17)"), price: 15, currency: "USD" },
            { label: t("Infant (0–2)"), price: 0, free: true },
          ]}
        />
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Info className="text-blue-500" /> {t("Pricing Details")}
          </h3>
          <div className="space-y-3">
            <InventoryItem title={t("Adult Pass")} price="250 ETB / $25" status={t("Available")} />
            <InventoryItem title={t("Child Pass")} price="150 ETB / $15" status={t("Available")} />
            <InventoryItem title={t("Infant Pass")} price={t("Free")} status={t("No Charge")} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-amber-500" /> {t("Visit Logistics")}
          </h3>
          <div className="space-y-4">
            <LogisticsRow icon={<Calendar size={18} />} label={t("Valid for")} val={t("1 Day Only")} />
            <LogisticsRow icon={<Clock size={18} />} label={t("Visiting Hours")} val={t("08:00 AM - 06:00 PM")} />
            <LogisticsRow icon={<MapPin size={18} />} label={t("Primary Location")} val={t("Entoto Park Central")} />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureBox 
          icon={<Zap />} 
          title={t("Fast-Track")} 
          desc={t("Quick entry with QR code scanning at the gate.")} 
          accent="#10b981"
          bg="#f0fdf4"
        />
        <FeatureBox 
          icon={<Heart />} 
          title={t("Conservation")} 
          desc={t("A portion of each ticket goes to park maintenance.")} 
          accent="#ef4444"
          bg="#fef2f2"
        />
        <FeatureBox 
          icon={<Star />} 
          title={t("Full Access")} 
          desc={t("Access all public areas and panoramic viewing points.")} 
          accent="#f59e0b"
          bg="#fffbeb"
        />
      </div>

      {/* Booking Purchase Modal */}
      <AnimatePresence>
        {open && (
          <PurchaseModal 
            ticketType={selectedTicketType} 
            prices={ticketPrices} 
            camps={camps}
            campsLoading={campsLoading}
            onClose={() => setOpen(false)} 
            onConfirm={handlePurchase} 
          />
        )}
      </AnimatePresence>

      {/* My Tickets View Modal */}
      <AnimatePresence>
        {showTicketsModal && (
          <TicketsListModal 
            tickets={myTickets}
            loading={myTicketsLoading}
            onClose={() => setShowTicketsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketTier({ title, subtitle, badge, icon, prices, accent, bg, onBuy }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105"
            style={{ background: bg, color: accent }}
          >
            {React.cloneElement(icon, { size: 24 })}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider border border-gray-100">{badge}</span>
      </div>

      <div className="space-y-3 flex-1">
        {prices.map((p, i) => (
          <div key={i} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 group-hover:bg-white transition-all">
            <div>
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{p.free ? t("Complimentary") : t("Standard Admission")}</p>
            </div>
            <p className={cn(
              "text-lg font-bold tracking-tight",
              p.free ? "text-green-600" : "text-gray-900"
            )}>
              {p.price} <span className="text-xs uppercase text-gray-400">{p.currency || "ETB"}</span>
            </p>
          </div>
        ))}
      </div>

      <button 
        onClick={onBuy}
        className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
      >
        <Ticket size={18} /> {t("Select Ticket")}
      </button>
    </div>
  );
}

function PurchaseModal({ ticketType, prices, camps, campsLoading, onClose, onConfirm }) {
  const { t } = useTranslation();
  
  // Set default selected camp
  const [selectedCamp, setSelectedCamp] = useState("");
  const [adultQty, setAdultQty] = useState(1);
  const [childQty, setChildQty] = useState(0);
  const [infantQty, setInfantQty] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00 AM – 10:00 AM");

  useEffect(() => {
    if (camps && camps.length > 0) {
      setSelectedCamp(camps[0]._id);
    }
  }, [camps]);

  const isDomestic = ticketType === "Domestic Visitor";
  const currency = isDomestic ? "ETB" : "USD";
  const subtotal = 
    (prices["Adult (18+)"] || 0) * adultQty +
    (prices["Child (3–17)"] || 0) * childQty +
    (prices["Infant (0–2)"] || 0) * infantQty;

  const totalQuantity = adultQty + childQty + infantQty;
  const serviceFee = subtotal > 0 ? (isDomestic ? 10 : 1) : 0;
  const total = subtotal + serviceFee;

  const handleConfirmClick = () => {
    if (totalQuantity < 1) {
      toast.error(t("Please select at least one ticket"));
      return;
    }

    let finalTicketType = "Adult";
    if (adultQty > 0 && (childQty > 0 || infantQty > 0)) {
      finalTicketType = "Group";
    } else if (childQty > 0 && adultQty === 0) {
      finalTicketType = "Child";
    }
    
    onConfirm({
      campId: selectedCamp,
      ticketType: finalTicketType,
      visitDate: date,
      quantity: totalQuantity,
      totalPrice: total,
      visitorType: isDomestic ? "Domestic" : "International",
      currency: currency,
      adultCount: adultQty,
      childCount: childQty,
      infantCount: infantQty
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10 border border-gray-100">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-all"><X size={24} /></button>
        
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900">{t("Book")} {ticketType}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("Complete your reservation details")}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Camp selector dropdown */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Camp Destination")}</label>
              {campsLoading ? (
                <div className="h-11 w-full bg-gray-50 border border-gray-200 rounded-lg flex items-center px-3 text-xs text-gray-400 font-semibold animate-pulse">
                  {t("Loading active campsites in Ethiopia...")}
                </div>
              ) : (
                <select 
                  className="w-full h-11 rounded-lg bg-gray-50 border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all px-3" 
                  value={selectedCamp} 
                  onChange={(e) => setSelectedCamp(e.target.value)}
                >
                  {camps.length === 0 ? (
                    <option value="">{t("No active camps found")}</option>
                  ) : (
                    camps.map((camp) => (
                      <option key={camp._id} value={camp._id}>
                        {camp.name} ({camp.location?.address || t("Ethiopia")})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Visit Date")}</label>
              <input type="date" className="w-full h-11 rounded-lg bg-gray-50 border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all px-3" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Time Slot")}</label>
              <select className="w-full h-11 rounded-lg bg-gray-50 border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all px-3" value={time} onChange={(e) => setTime(e.target.value)}>
                <option>{t("08:00 AM – 10:00 AM")}</option>
                <option>{t("10:00 AM – 12:00 PM")}</option>
                <option>{t("12:00 PM – 02:00 PM")}</option>
                <option>{t("02:00 PM – 04:00 PM")}</option>
              </select>
            </div>

            {/* Age-wise Counter Section */}
            <div className="space-y-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100 col-span-1 md:col-span-2">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("Select Tickets by Age")}</h4>
              
              {/* Adult Counter */}
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-150 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-900">{t("Adult")}</p>
                  <p className="text-[10px] text-gray-400 font-medium">18+ years — {prices["Adult (18+)"] || 0} {currency}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdultQty(Math.max(0, adultQty - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-gray-800 w-4 text-center">{adultQty}</span>
                  <button
                    type="button"
                    onClick={() => setAdultQty(adultQty + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Child Counter */}
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-150 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-900">{t("Child")}</p>
                  <p className="text-[10px] text-gray-400 font-medium">3–17 years — {prices["Child (3–17)"] || 0} {currency}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildQty(Math.max(0, childQty - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-gray-800 w-4 text-center">{childQty}</span>
                  <button
                    type="button"
                    onClick={() => setChildQty(childQty + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Infant Counter */}
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-150 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-900">{t("Infant")}</p>
                  <p className="text-[10px] text-gray-400 font-medium">0–2 years — {prices["Infant (0–2)"] || 0} {currency}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInfantQty(Math.max(0, infantQty - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-gray-800 w-4 text-center">{infantQty}</span>
                  <button
                    type="button"
                    onClick={() => setInfantQty(infantQty + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 grid grid-cols-3 text-center gap-2">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t("Subtotal")}</p>
              <p className="text-lg font-bold text-gray-900">{subtotal} <span className="text-[10px]">{currency}</span></p>
            </div>
            <div className="border-x border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t("Fee")}</p>
              <p className="text-lg font-bold text-gray-900">{serviceFee} <span className="text-[10px]">{currency}</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{t("Total")}</p>
              <p className="text-xl font-bold text-blue-600">{total} <span className="text-[10px]">{currency}</span></p>
            </div>
          </div>

          <button
            onClick={handleConfirmClick}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} /> {t("Confirm Reservation")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TicketsListModal({ tickets, loading, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 border border-gray-100 flex flex-col max-h-[85vh]">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-all"><X size={24} /></button>
        
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="text-blue-600" /> {t("My Day Visit Tickets")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("Manage your purchased active day visit passes")}</p>
        </div>

        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-sm font-medium text-gray-500">{t("Fetching your active passes...")}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-inner">
              <QrCode className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("No active day visit tickets found.")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("Buy tickets above to display them here.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-8 -translate-y-8 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider w-max",
                          ticket.status === "Active" ? "bg-green-50 text-green-700 border-green-150" :
                          ticket.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-150" :
                          ticket.status === "Used" ? "bg-gray-50 text-gray-500 border-gray-150" :
                          "bg-red-50 text-red-700 border-red-150"
                        )}>
                          {t(ticket.status || "Active")}
                        </span>
                        {ticket.paymentStatus && (
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest w-max",
                            ticket.paymentStatus === "Paid" ? "bg-blue-50 text-blue-700 border-blue-150" :
                            ticket.paymentStatus === "PayAtGate" ? "bg-purple-50 text-purple-700 border-purple-150" :
                            "bg-amber-50 text-amber-700 border-amber-150"
                          )}>
                            {t(ticket.paymentStatus)}
                          </span>
                        )}
                      </div>
                      
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <QrCode size={18} />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors uppercase leading-snug">{ticket.campId?.name || t("Entoto Park Central")}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-1">
                        <MapPin size={12} className="text-blue-500" />
                        <span>{ticket.campId?.location?.address || t("Addis Ababa, Ethiopia")}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs font-bold text-gray-500">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{t("Visit Date")}</p>
                        <p className="text-gray-900 flex items-center gap-1"><Calendar size={12} className="text-gray-400" /> {new Date(ticket.visitDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{t("Ticket Category")}</p>
                        <p className="text-gray-900">{t(ticket.ticketType || "Adult")} ({ticket.quantity || 1})</p>
                        {(ticket.adultCount > 0 || ticket.childCount > 0 || ticket.infantCount > 0) && (
                          <p className="text-[9px] text-gray-400 mt-0.5 font-medium leading-tight">
                            {[
                              ticket.adultCount > 0 ? `${ticket.adultCount} ${t("Adult")}${ticket.adultCount > 1 ? "s" : ""}` : "",
                              ticket.childCount > 0 ? `${ticket.childCount} ${t("Child")}${ticket.childCount > 1 ? "ren" : ""}` : "",
                              ticket.infantCount > 0 ? `${ticket.infantCount} ${t("Infant")}${ticket.infantCount > 1 ? "s" : ""}` : ""
                            ].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{t("Gate Token")}</p>
                      <code className="text-xs font-bold text-blue-600 uppercase tracking-widest">{ticket.qrCode || "QR-MOCK"}</code>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{t("Price")}</p>
                      <span className="text-sm font-black text-gray-900">{ticket.totalPrice || 0} {ticket.currency || 'ETB'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold shadow hover:bg-gray-800 transition-colors"
          >
            {t("Close Window")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function InventoryItem({ title, price, status }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{price}</p>
      </div>
      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-wider">{status}</span>
    </div>
  );
}

function LogisticsRow({ icon, label, val }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 text-gray-400">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-sm font-bold text-gray-900">{val}</p>
    </div>
  );
}

function FeatureBox({ icon, title, desc, accent, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 hover:shadow-md transition-all group">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-white"
        style={{ background: bg, color: accent }}
      >
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

