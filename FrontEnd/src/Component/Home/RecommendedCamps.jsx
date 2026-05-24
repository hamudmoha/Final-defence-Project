import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useUser } from '../../context/UserContext';

const RecommendedCamps = () => {
  const { t } = useTranslation();
  const { user, setUser } = useUser();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFavorites, setUserFavorites] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [recRes, userRes] = await Promise.all([
          api.get('/users/recommendations'),
          api.get('/auth/me').catch(() => null)
        ]);
        
        if (recRes.data.success) {
          setCamps(recRes.data.data);
        }
        if (userRes?.data?.success) {
          setUserFavorites(userRes.data.data.favorites || []);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = async (campId) => {
    try {
      const res = await api.post(`/users/favorites/${campId}`);
      if (res.data.success) {
        setUserFavorites(res.data.data);
        if (user) {
          setUser({ ...user, favorites: res.data.data });
        }
        toast.success(userFavorites.includes(campId) ? t('Removed from favorites') : t('Added to favorites'));
      }
    } catch (err) {
      toast.error(t('Failed to update favorites'));
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (camps.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-3">
              <Flame className="w-4 h-4" />
              {t("Tailored For You")}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              {t("Recommended")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{t("Destinations")}</span>
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl text-lg font-medium">
              {t("Based on your recent adventures and searches, we think you'll love these spots.")}
            </p>
          </motion.div>
          
          <Link to="/camps" className="flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors group">
            {t("Explore All Camps")} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {camps.map((camp, index) => (
            <motion.div
              key={camp._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500"
            >
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={camp.images?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={camp.name} 
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleFavorite(camp._id); }}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${userFavorites.includes(camp._id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                  >
                    <Heart className={`w-5 h-5 ${userFavorites.includes(camp._id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    4.8 {t("(120+ Reviews)")}
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-tighter mb-2">
                  <MapPin className="w-3 h-3" />
                  {camp.location?.address?.split(',')[0] || 'Ethiopia'}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  {camp.name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                  {camp.description}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t("Adventure")}</span>
                    <span className="text-xl font-black text-slate-900">{t("Explore Now")}</span>
                  </div>
                  <Link 
                    to={`/camper-dashboard/book/${camp._id}`}
                    className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                    <ArrowRight className="w-6 h-6" />
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

export default RecommendedCamps;
