import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../../services/api"; 
import { 
  MapPin, 
  CircleCheck,
  Home,
  Layout,
  CircleX,
  ArrowLeft,
  Tent,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronRight,
  Info,
  Clock,
  CreditCard,
  CircleAlert
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useUser } from "../../../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "../../../SystemAdmin/ui/utils";

export const Booking = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  const locationHook = useLocation();
  const { id: campId } = useParams();

  const [campData, setCampData] = useState(null);
  const [tents, setTents] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checkIn, setCheckIn] = useState(locationHook.state?.checkIn || "");
  const [checkOut, setCheckOut] = useState(locationHook.state?.checkOut || "");
  const [adults, setAdults] = useState(Number(locationHook.state?.guests) || 2);
  const [creating, setCreating] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  const getTodayString = () => new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        let campData = null;
        try {
          const campRes = await api.get(`/camps/${campId}`);
          if (campRes.data.success) campData = campRes.data.data;
        } catch (err) {
          if (err.response?.status === 404) {
            setError(t("Camp not found"));
            setLoading(false);
            return;
          }
          throw err;
        }
        if (!campData) {
          setError(t("Camp not found"));
          setLoading(false);
          return;
        }
        setCampData(campData);
        
        const tentsRes = await api.get(`/tents/camp/${campId}`);
        if (tentsRes.data.success) {
          setTents(tentsRes.data.data || []);
        }
      } catch (err) {
        console.error("Fetch data error:", err);
        setError(t("Failed to load details"));
      } finally {
        setLoading(false);
      }
    };
    if (campId) fetchData();
  }, [campId, t]);

  useEffect(() => {
    let interval;
    const checkAvailability = async () => {
      if (!checkIn || !checkOut || !campId) return;
      
      try {
        const res = await api.get(`/tents/availability/${campId}`, {
          params: { checkIn, checkOut }
        });
        if (res.data.success) {
          setTents(res.data.data || []);
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      }
    };

    checkAvailability();
    if (checkIn && checkOut) {
      interval = setInterval(checkAvailability, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkIn, checkOut, campId]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedUnit]);

  const nights = checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0;
  const pricePerNight = selectedUnit ? selectedUnit.pricePerNight : 0;
  const totalCost = pricePerNight * (nights || 0);

  const handleBookNow = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error(t("Please login to book"));
      navigate("/login");
      return;
    }
    if (!selectedUnit) {
      toast.error(t("Please select a tent"));
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error(t("Please select dates"));
      return;
    }
    setCreating(true);
    try {
      const response = await api.post(
        "/bookings",
        {
          campId: campData._id,
          tentId: selectedUnit._id,
          checkIn,
          checkOut,
          guests: adults,
          amount: totalCost,
          guestName: user.fullName,
          guestEmail: user.email,
          guestPhone: user.phone || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(t("Booking created! Proceeding to payment..."));
        const booking = response.data.data;
        const isEligibleForFlex = user?.completed_bookings >= 1 && campData?.allow_flex_pay && !campData?.require_full_payment && (user?.trust_score === undefined || user?.trust_score >= 3.5);
        
        if (isEligibleForFlex) {
          setPendingBookingId(booking._id);
          setShowPaymentModal(true);
        } else {
          initPayment(booking._id, "full", token);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t("Booking failed"));
    } finally {
      setCreating(false);
    }
  };

  const initPayment = async (bookingId, preference, tokenParam) => {
    const token = tokenParam || localStorage.getItem("token");
    try {
      const payRes = await api.post('/payments/initialize', { bookingId, paymentPreference: preference }, { headers: { Authorization: `Bearer ${token}` } });
      if (payRes.data.success) {
         window.location.href = payRes.data.data.checkout_url;
      }
    } catch (payErr) {
       toast.error(payErr.response?.data?.message || t("Payment failed. Please try later."));
       navigate("/camper-dashboard/payments");
    }
  };

  const localRestriction = user?.blacklistedFrom?.find(b => b.managerId === campData.managerId || b.managerId?._id === campData.managerId);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      <p className="text-sm font-medium text-gray-500">{t("Loading camp details...")}</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <CircleAlert className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">{t("Error Occurred")}</h2>
      <p className="text-gray-500 max-w-sm">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">{t("Go Back")}</button>
    </div>
  );

  if (localRestriction) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{t("Access Restricted")}</h1>
        <p className="text-gray-500 mb-8">{t("You are not allowed to book at this campsite by the manager.")}</p>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 w-full text-left shadow-sm">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">{t("Reason")}</p>
          <div className="bg-gray-50 p-4 rounded-lg italic text-gray-700 border border-gray-100">{localRestriction.reason}</div>
          
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{t("Appeal this decision")}</h3>
            <textarea
              id="localAppealMessage"
              placeholder={t("Write your message here...")}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none min-h-[120px]"
            />
            <button 
              onClick={async () => {
                const msg = document.getElementById('localAppealMessage').value;
                if (!msg) return toast.error(t("Please write a message"));
                try {
                  const res = await api.post('/moderation/appeal', { message: msg, type: 'local', managerId: campData.managerId });
                  if (res.data.success) { toast.success(t("Appeal submitted")); document.getElementById('localAppealMessage').value = ''; }
                } catch (err) { toast.error(t("Failed to submit appeal")); }
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all shadow-sm"
            >
              {t("Submit Appeal")}
            </button>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="mt-8 text-gray-400 hover:text-gray-600 font-bold text-sm transition-all">{t("Cancel")}</button>
      </div>
    );
  }

  const galleryImages = selectedUnit?.images?.length > 0 
    ? selectedUnit.images 
    : (campData?.images?.length > 0 ? campData.images : ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80"]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <Toaster position="top-right" />
      
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all font-bold text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("Back to Directory")}
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Live Availability")}</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:w-2/3 relative h-64 lg:h-[450px] bg-gray-100">
          <img 
            src={galleryImages[activeImageIndex]} 
            className="w-full h-full object-cover" 
            alt="Camp" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 flex gap-2">
            {galleryImages.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImageIndex(idx)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  activeImageIndex === idx ? "bg-white w-8 shadow-sm" : "bg-white/40 w-2 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </div>

        <div className="lg:w-1/3 p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedUnit ? selectedUnit.name : campData.name}</h1>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <MapPin className="w-4 h-4 text-blue-500" /> 
                <span className="truncate">{campData.location?.address}</span>
              </div>
            </div>
            
            <div className="space-y-2">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Description")}</h4>
               <p className="text-gray-600 text-sm leading-relaxed">
                 {selectedUnit ? selectedUnit.description : campData.description}
               </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {galleryImages.slice(0, 4).map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    activeImageIndex === idx ? "border-blue-500 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap pt-2">
              {(selectedUnit?.amenities || campData.amenities)?.slice(0, 5).map((am, i) => (
                <span key={i} className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-md border border-gray-100 uppercase">{am}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unit Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Tent className="w-4 h-4 text-blue-500" />
              {t("Select Accommodation")}
            </h2>
          </div>

          <div className="space-y-4">
            {tents.map((unit) => {
              const isAvailable = unit.isAvailable !== false;
              const isSelected = selectedUnit?._id === unit._id;
              
              return (
                <div 
                  key={unit._id}
                  onClick={() => isAvailable && setSelectedUnit(unit)} 
                  className={cn(
                    "flex flex-col sm:flex-row bg-white rounded-xl border transition-all overflow-hidden relative",
                    !isAvailable ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer",
                    isSelected ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="w-full sm:w-56 h-40 sm:h-auto overflow-hidden bg-gray-100">
                    <img src={unit.images?.[0] || campData.images?.[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{unit.name}</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{t("Campsite Unit")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">{unit.pricePerNight} <span className="text-[10px] uppercase text-gray-400">ETB</span></p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Per Night")}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-sm line-clamp-2">{unit.description}</p>
                      
                      <div className="flex gap-2 pt-1">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-600 uppercase">{t("Capacity")}: {unit.capacity}</span>
                        </div>
                        {unit.amenities?.slice(0, 2).map((a, i) => (
                          <div key={i} className="flex items-center px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      {!isAvailable ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100">
                          <CircleX size={14} /> {t("Unavailable")}
                        </div>
                      ) : isSelected ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                          <CircleCheck size={14} /> {t("Selected")}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider group-hover:underline">
                          {t("Click to Select")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
           <div className="bg-gray-900 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                {t("Booking Summary")}
              </h3>

              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t("Unit")}</p>
                  <p className="text-white font-bold text-sm">{selectedUnit ? selectedUnit.name : t("Please select a tent")}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t("Check-In")}</label>
                    <input 
                      type="date" 
                      value={checkIn} 
                      min={getTodayString()} 
                      onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }} 
                      className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t("Check-Out")}</label>
                    <input 
                      type="date" 
                      value={checkOut} 
                      min={checkIn || getTodayString()} 
                      disabled={!checkIn} 
                      onChange={(e) => setCheckOut(e.target.value)} 
                      className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-30" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t("Number of Guests")}</label>
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2.5 px-4">
                    <span className="text-white text-xs font-bold">{adults} {t("Persons")}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-md hover:bg-white/20 text-white transition-colors">-</button>
                      <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-md hover:bg-white/20 text-white transition-colors">+</button>
                    </div>
                  </div>
                </div>

                {selectedUnit && nights > 0 && (
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>{pricePerNight} ETB x {nights} {t("Nights")}</span>
                      <span>{(pricePerNight * nights).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t("Total Price")}</span>
                      <span className="text-2xl font-bold text-white tracking-tight">{totalCost.toLocaleString()} <span className="text-xs text-gray-500 ml-1">ETB</span></span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleBookNow} 
                  disabled={!selectedUnit || !checkIn || !checkOut || creating} 
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2",
                    (!selectedUnit || !checkIn || !checkOut || creating) 
                      ? "bg-white/5 text-gray-500 border border-white/5" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t("Processing...")}
                    </>
                  ) : (
                    <>
                      <CircleCheck size={18} />
                      {t("Book Now")}
                    </>
                  )}
                </button>
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t("Safe Booking")}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{t("Chapa Verified")}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{t("Your payment is securely processed and your booking is guaranteed.")}</p>
           </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setShowPaymentModal(false); navigate("/camper-dashboard/payments"); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-2xl p-10 shadow-2xl relative z-10 border border-gray-100">
              <button 
                onClick={() => { setShowPaymentModal(false); navigate("/camper-dashboard/payments"); }} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <CircleX className="w-6 h-6" />
              </button>
              
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("Payment Options")}</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">{t("Choose your preferred payment method. Since you are a verified member, you can pay a deposit now.")}</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => initPayment(pendingBookingId, "deposit")}
                  className="w-full flex items-center justify-between p-6 border-2 border-blue-600 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-all text-left group"
                >
                  <div>
                    <span className="block font-bold text-blue-900 text-lg">{t("Pay Deposit (15%)")}</span>
                    <span className="block text-blue-600 text-xs font-bold uppercase tracking-wider mt-0.5">{(totalCost * 0.15).toLocaleString()} {t("ETB Now")}</span>
                  </div>
                  <ChevronRight size={24} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                </button>
   
                <button 
                  onClick={() => initPayment(pendingBookingId, "full")}
                  className="w-full flex items-center justify-between p-6 border-2 border-gray-100 hover:border-blue-200 rounded-xl transition-all text-left group bg-gray-50/50"
                >
                  <div>
                    <span className="block font-bold text-gray-900 text-lg">{t("Full Payment (100%)")}</span>
                    <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider mt-0.5">{totalCost.toLocaleString()} {t("ETB Now")}</span>
                  </div>
                  <ChevronRight size={24} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="mt-10 flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-gray-300" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {t("Secured by Chapa Payment Gateway")}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
