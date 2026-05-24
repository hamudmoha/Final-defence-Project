import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../services/api"; 
import { 
  Search, 
  Settings2, 
  MapPin, 
  X,
  LayoutGrid,
  Map as MapIcon,
  List,
  Users,
  Star,
  ChevronRight,
  Filter,
  Compass,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "../../../SystemAdmin/ui/utils";

export const CampsiteDirectory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showMapMobile, setShowMapMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const fetchCamps = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (priceFilter === "low") params.maxPrice = 4000;
        if (priceFilter === "mid") { params.minPrice = 4000; params.maxPrice = 8000; }
        if (priceFilter === "high") params.minPrice = 8000;
        if (ratingFilter) params.minRating = ratingFilter;

        let response = await api.get("/camps", { params });
        setCamps(response.data.success ? response.data.data : []);
      } catch (err) {
        console.error(err);
        setError(t("Failed to load campsites. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCamps, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, priceFilter, ratingFilter, t]);

  const handleBookNow = (campId) => {
    navigate(`/camper-dashboard/book/${campId}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">{t("Campsite Directory")}</h1>
            <p className="text-gray-500 text-sm">{t("Discover and book the best camping locations across the region.")}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-1 lg:max-w-2xl">
            <div className="flex-1 relative group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder={t("Search for campsites, locations...")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border shadow-sm",
                  showFilters ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                <Filter size={16} />
                {t("Filters")}
              </button>
              
              <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Price Range")}</label>
                  <select 
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="">{t("Any Price")}</option>
                    <option value="low">{t("Under 4,000 ETB")}</option>
                    <option value="mid">{t("4,000 – 8,000 ETB")}</option>
                    <option value="high">{t("Over 8,000 ETB")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Minimum Rating")}</label>
                  <select 
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="">{t("Any Rating")}</option>
                    <option value="4.5">{t("4.5+ Stars")}</option>
                    <option value="4.0">{t("4.0+ Stars")}</option>
                    <option value="3.5">{t("3.5+ Stars")}</option>
                    <option value="3.0">{t("3.0+ Stars")}</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <button 
                    onClick={() => { setPriceFilter(""); setSearchTerm(""); setRatingFilter(""); }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {t("Clear All Filters")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        {/* Results */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" />
              {camps.length} {t("Results Found")}
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-gray-500">{t("Searching for campsites...")}</p>
              </div>
            ) : camps.length > 0 ? (
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"
                )}
              >
                {camps.map((camp) => (
                  <CampCard key={camp._id} camp={camp} viewMode={viewMode} onClick={() => handleBookNow(camp._id)} />
                ))}
              </motion.div>
            ) : (
              <div className="bg-gray-50/50 rounded-2xl p-24 text-center border border-dashed border-gray-200">
                <MapIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-400">{t("No campsites found matching your search")}</p>
                <button 
                  onClick={() => { setSearchTerm(""); setPriceFilter(""); }}
                  className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                >
                  {t("Reset Search")}
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Map Placeholder/Preview */}
        <div className="hidden lg:block w-96 xl:w-[400px] relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
          <iframe 
            title={t("Location Map")} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0 }} 
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d252233.19760777732!2d38.763611!3d9.005401!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set" 
            allowFullScreen 
            loading="lazy" 
            className="w-full h-full grayscale-[0.2] contrast-[1.1]"
          />
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-xl">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{t("Explore Map")}</h4>
            <p className="text-sm font-bold text-gray-900">{t("Find campsites based on your preferred location.")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampCard({ camp, viewMode, onClick }) {
  const { t } = useTranslation();
  
  if (viewMode === "grid") {
    return (
      <div
        onClick={onClick}
        className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col"
      >
        <div className="h-48 relative overflow-hidden bg-gray-100">
          <img 
            src={camp.images?.[0] || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            alt={camp.name} 
          />
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[11px] font-bold text-gray-900">{camp.rating || "NEW"}</span>
          </div>
        </div>
        
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{camp.name}</h3>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">{camp.location?.address}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {camp.amenities?.slice(0, 3).map((item, idx) => (
              <span key={idx} className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-500 rounded-md border border-gray-100 uppercase tracking-tight">{item}</span>
            ))}
          </div>

          <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-end">
            <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-sm border border-gray-100 group-hover:border-blue-600">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-6 items-center"
    >
      <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
        <img 
          src={camp.images?.[0] || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80"} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={camp.name} 
        />
      </div>

      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{camp.name}</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
            <Star className="w-2.5 h-2.5 fill-amber-500" />
            {camp.rating || "NEW"}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span className="truncate">{camp.location?.address}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {camp.amenities?.slice(0, 4).map((item, idx) => (
            <span key={idx} className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-500 rounded-md border border-gray-100 uppercase tracking-tight">{item}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
          {t("View Details")}
        </button>
      </div>
    </div>
  );
}
