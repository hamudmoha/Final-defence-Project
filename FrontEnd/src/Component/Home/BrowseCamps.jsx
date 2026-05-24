import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaStar, FaChevronLeft, FaChevronRight, FaThLarge, FaList, FaHeart } from "react-icons/fa";
import { FiMapPin, FiFilter, FiSearch, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useNavigate, useLocation } from "react-router-dom"; 
import toast from "react-hot-toast";
import { HiLocationMarker, HiSearch, HiCurrencyDollar, HiAdjustments } from "react-icons/hi";
import { useUser } from "../../context/UserContext";

const ITEMS_PER_PAGE = 6;

export default function BrowseALLCamps() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const locationHook = useLocation();
  const [camps, setCamps] = useState([]); 
  const [filteredCamps, setFilteredCamps] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [favorites, setFavorites] = useState([]);

  const [filters, setFilters] = useState({
    location: "", 
    amenity: "",
  });

  const [searchParams, setSearchParams] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1
  });

  const normalize = (raw) => {
    return {
      ...raw,
      id: raw._id,
      location: raw.location?.address || raw.location || "Ethiopia",
      rating: 4.8, 
      reviews: 120,
      amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
      image: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
      badge: t("Verified"),
    };
  };

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const token = localStorage.getItem("token");
        const [campsRes, userRes] = await Promise.all([
          api.get("/camps"),
          token ? api.get("/auth/me").catch(() => null) : Promise.resolve(null)
        ]);
        
        if (campsRes.data.success) {
          const normalizedData = campsRes.data.data.map(normalize);
          setCamps(normalizedData);
          
          // Parse URL Search Params
          const params = new URLSearchParams(locationHook.search);
          const locParam = params.get('location');
          const guestsParam = params.get('guests');
          const checkInParam = params.get('checkIn');
          const checkOutParam = params.get('checkOut');

          setSearchParams({
            checkIn: checkInParam || "",
            checkOut: checkOutParam || "",
            guests: guestsParam || 1
          });

          let result = normalizedData;

          // Apply Home Search Filters
          if (locParam) {
            result = result.filter(c => 
              c.location.toLowerCase().includes(locParam.toLowerCase()) || 
              c.name.toLowerCase().includes(locParam.toLowerCase()) ||
              (c.description && c.description.toLowerCase().includes(locParam.toLowerCase()))
            );
            setFilters(prev => ({ ...prev, location: locParam }));
          }
          


          setFilteredCamps(result);
        }
        if (userRes?.data?.success) {
          setFavorites(userRes.data.data.favorites || []);
        }
      } catch (err) {
        console.error("Failed to fetch camps:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCamps();
  }, [locationHook.search]);

  const handleSearch = () => {
    let result = camps.slice();
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter(c => 
        c.location.toLowerCase().includes(loc) || 
        c.name.toLowerCase().includes(loc) ||
        (c.description && c.description.toLowerCase().includes(loc))
      );
    }
    if (filters.amenity) {
      result = result.filter(c => c.amenities.some(a => a.toLowerCase().includes(filters.amenity.toLowerCase())));
    }
    setFilteredCamps(result);
    setPage(1);
  };

  const toggleFavorite = async (e, campId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/users/favorites/${campId}`);
      if (res.data.success) {
        setFavorites(res.data.data);
        if (user) {
          setUser({ ...user, favorites: res.data.data });
        }
        toast.success(favorites.includes(campId) ? t("Removed from favorites") : t("Added to favorites"));
      }
    } catch (err) {
      toast.error(t("Please login to manage favorites"));
    }
  };

  const navigateToBooking = (id) => {
    // Navigate to booking page with search context
    navigate(`/camper-dashboard/book/${id}`, {
      state: {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests
      }
    });
  };

  const totalPages = Math.max(1, Math.ceil(filteredCamps.length / ITEMS_PER_PAGE));
  const paginated = filteredCamps.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4 block">{t("Adventure awaits")}</span>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-none mb-6">
                {t("Explore")} <span className="text-emerald-600">{t("All Camps")}</span>
              </h1>
              <p className="text-slate-500 max-w-xl text-lg font-medium">
                {t("From the peaks of Simien to the waters of Langano, find your perfect escape in the heart of Ethiopia.")}
              </p>
            </motion.div>
          </div>
          
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FaThLarge className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FaList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full bg-white shadow-lg rounded-3xl p-8 mt-10 border border-gray-100"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            {t("Where do you want to camp?")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* LOCATION */}
            <motion.div whileHover={{ scale: 1.01 }} className="flex flex-col">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t("Location")}</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <HiLocationMarker className="text-emerald-500 w-5 h-5 mr-3" />
                <input
                  type="text"
                  placeholder={t("Where to?")}
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full outline-none text-gray-700 bg-transparent font-medium"
                />
              </div>
            </motion.div>

            {/* Features (previously after price range) */}

            {/* CATEGORY / AMENITY */}
            <motion.div whileHover={{ scale: 1.01 }} className="flex flex-col">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t("Features")}</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <HiAdjustments className="text-emerald-500 w-5 h-5 mr-3" />
                <select
                  value={filters.amenity}
                  onChange={(e) => setFilters({ ...filters, amenity: e.target.value })}
                  className="w-full outline-none text-gray-700 bg-transparent font-medium appearance-none cursor-pointer"
                >
                  <option value="">{t("All Features")}</option>
                  <option value="WiFi">{t("WiFi")}</option>
                  <option value="Hiking">{t("Hiking")}</option>
                  <option value="Lake">{t("Lakeside")}</option>
                  <option value="Pool">{t("Pool")}</option>
                </select>
              </div>
            </motion.div>

            {/* SEARCH BUTTON */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={handleSearch}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-emerald-600/20"
              >
                <HiSearch className="w-5 h-5" />
                {t("Search")}
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          ) : paginated.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <h3 className="text-2xl font-bold text-slate-400">{t("No camps found matching your criteria.")}</h3>
              <button onClick={() => setFilters({location: "", amenity: ""})} className="mt-4 text-emerald-500 font-bold hover:underline">{t("Reset All Filters")}</button>
            </motion.div>
          ) : (
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" : "space-y-8"}
            >
              {paginated.map((camp, i) => (
                <div 
                  key={camp.id} 
                  className={`bg-white rounded-[40px] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500 flex ${viewMode === "list" ? "flex-col md:flex-row h-auto md:h-[300px]" : "flex-col h-full"}`}
                >
                  <div className={`relative overflow-hidden group ${viewMode === "list" ? "w-full md:w-2/5 shrink-0" : "h-72"}`}>
                    <img 
                      src={camp.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={camp.name} 
                    />
                    <button 
                      onClick={(e) => toggleFavorite(e, camp.id)}
                      className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${favorites.includes(camp.id) ? "bg-rose-500 text-white" : "bg-white/30 text-white hover:bg-white/50"}`}
                    >
                      <FaHeart className={`w-5 h-5 ${favorites.includes(camp.id) ? "fill-current" : ""}`} />
                    </button>
                    <div className="absolute bottom-6 left-6">
                      <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-900 uppercase tracking-widest shadow-xl">
                        {camp.badge}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-tighter">
                          <FiMapPin className="w-3.5 h-3.5" />
                          {camp.location.split(',')[0]}
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-amber-500 text-sm">
                          <FaStar className="w-4 h-4" />
                          {camp.rating}
                        </div>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-4 hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => navigateToBooking(camp.id)}>
                        {camp.name}
                      </h2>
                      <p className="text-slate-500 text-base font-medium line-clamp-2 leading-relaxed mb-6">
                        {camp.description || "Experience the natural beauty of Ethiopia in this unique verified campsite."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">{t("Status")}</span>
                        <span className="text-2xl font-bold text-slate-900">{t("Verified Spot")}</span>
                      </div>
                      <button 
                        onClick={() => navigateToBooking(camp.id)}
                        className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95"
                      >
                        {t("Book Adventure")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Modern */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-20 gap-3">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all disabled:opacity-30 disabled:hover:border-slate-200"
            >
              <FaChevronLeft />
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-12 h-12 rounded-2xl font-bold transition-all ${
                    page === i + 1 ? "bg-slate-900 text-white shadow-xl" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-900"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all disabled:opacity-30 disabled:hover:border-slate-200"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
