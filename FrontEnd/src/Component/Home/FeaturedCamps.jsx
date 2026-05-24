import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HiStar } from "react-icons/hi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // ✅ Use navigation
import api from "../../services/api";

const FeaturedCamps = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [featuredCamps, setFeaturedCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Real Data
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/camps");
        if (res.data.success) {
          // Take the first 3 camps as "Featured"
          // (Later you can filter by rating or a 'featured' flag in DB)
            const data = res.data.data.slice(0, 3).map(camp => ({
              id: camp._id,
              title: camp.name,
              rating: camp.rating || 0,
              image: camp.images?.[0] || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
              description: camp.description || "Experience breathtaking views and nature."
            }));
          setFeaturedCamps(data);
        }
      } catch (err) {
        console.error("Error fetching featured camps:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleBookClick = (id) => {
    navigate(`/camper-dashboard/book/${id}`);
  };

  return (
    <section className="w-full py-20 bg-white">
      <div className="container mx-auto px-6 lg:px-16">
        
        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t("Featured Camps")}
          </h2>
          <p className="text-gray-600 text-lg mt-3">
            {t("Explore our most popular camping destinations")}
          </p>
        </motion.div>

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center text-gray-500">{t("Loading top spots...")}</div>
        )}

        {/* FEATURED CARDS */}
        {!loading && (
          <div className="grid md:grid-cols-3 gap-10">
            {featuredCamps.map((camp, index) => (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white shadow-xl rounded-3xl overflow-hidden cursor-pointer border border-gray-100"
              >
                <div className="h-64 overflow-hidden">
                    <motion.img
                    src={camp.image}
                    alt={camp.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    />
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                      {camp.title}
                    </h3>

                    <div className="flex items-center text-yellow-500 font-semibold shrink-0">
                      <HiStar className="mr-1" />
                      {camp.rating}
                    </div>
                  </div>

                  <p className="text-gray-600 mt-3 line-clamp-2 text-sm">{camp.description}</p>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50">
                    <p className="text-green-700 font-bold text-xl">
                      {t("Verified Spot")}
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBookClick(camp.id)}
                      className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-xl shadow-md transition-colors"
                    >
                      {t("Book Now")}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* VIEW ALL CAMPS BUTTON */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/camper-dashboard/campsite-directory")} // ✅ Links to full directory
            className="px-8 py-3 border-2 border-green-700 text-green-700 rounded-xl text-lg font-bold hover:bg-green-50 transition-all"
          >
            {t("View All Camps")}
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
};

export default FeaturedCamps;
