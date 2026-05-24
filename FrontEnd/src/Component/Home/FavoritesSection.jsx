import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { motion } from 'framer-motion';
import { Heart, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useUser } from '../../context/UserContext';

const FavoritesSection = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.data.favorites) {
        setFavorites(res.data.data.favorites);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user?.favorites?.length]);

  if (loading || favorites.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50 overflow-hidden border-y border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-3">
              <Heart className="w-4 h-4 fill-current" />
              {t("Your Collections")}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              {t("Favorite")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">{t("Destinations")}</span>
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((camp, index) => (
            <motion.div
              key={camp._id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-gray-100 border-l-8 border-l-emerald-600 border-b-8 border-b-emerald-600/30 flex flex-col"
            >
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <img 
                  src={camp.images?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={camp.name} 
                />
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2">
                  <MapPin className="w-3 h-3" />
                  {camp.location?.address?.split(',')[0] || 'Ethiopia'}
                </div>
                <h3 className="text-lg font-black text-gray-900 line-clamp-1 mb-4 group-hover:text-emerald-700 transition-colors">{camp.name}</h3>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <Link 
                    to={`/camper-dashboard/book/${camp._id}`}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-emerald-600 transition-colors"
                  >
                    {t("Book Again")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FavoritesSection;
