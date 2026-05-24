import React, { useState, useEffect } from "react";
import { FaCampground, FaUsers, FaStar, FaAward, FaGlobeAfrica, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import AboutImage from "../../assets/team-image.png";

const Counter = ({ end, duration = 2, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);
  return decimals === 0 ? Math.floor(count) : count.toFixed(decimals);
};

export default function AboutSection() {
  const { t } = useTranslation();
  return (
    <div className="w-full bg-white overflow-hidden pb-32">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-slate-50 -z-10 rounded-b-[100px]" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-[0.3em] mb-6"
          >
            <FaGlobeAfrica className="w-5 h-5" />
            {t("Our Global Mission")}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-8"
          >
            {t("Pioneering the Digital")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{t("Wilderness.")}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-xl font-medium leading-relaxed"
          >
            {t("As the architects of Ethiopia's premier camping ecosystem, we are dedicated to bridging the gap between modern technology and the raw beauty of our natural heritage.")}
          </motion.p>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 mt-20 px-6 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50" />
          <img
            src={AboutImage}
            alt="Team"
            className="w-full rounded-[60px] shadow-2xl object-cover relative z-10"
          />
          <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white p-10 rounded-[40px] z-20 shadow-2xl hidden md:block">
            <p className="text-3xl font-bold mb-1 text-emerald-400">{t("Founded")}</p>
            <p className="text-xl font-bold opacity-70">{t("Spring 2025")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">{t("Our Visionary")} <span className="text-emerald-600">{t("Blueprint")}</span></h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-6 mb-8">
              "{t("We didn't just build a website; we built a community for those who seek to lose themselves in the whispers of the Simien winds.")}"
            </p>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              {t("EthioCamp was born from a singular realization: Ethiopia's breathtaking landscapes remained largely invisible to the digital world. As system owners, we set out to create a robust, secure, and intuitive infrastructure that empowers both camp managers and adventurers.")}
            </p>
            <p className="text-slate-600 text-lg leading-relaxed">
              {t("Our platform leverages state-of-the-art booking algorithms and real-time management tools, ensuring that every expedition is backed by professional-grade technology and world-class security.")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <FaShieldAlt className="text-emerald-600 text-3xl mb-4" />
              <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">{t("Trust & Safety")}</h4>
              <p className="text-slate-500 text-sm font-medium">{t("Verified camps and secure encrypted payments.")}</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <FaUsers className="text-emerald-600 text-3xl mb-4" />
              <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">{t("Community")}</h4>
              <p className="text-slate-500 text-sm font-medium">{t("Supporting local tourism and eco-preservation.")}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto mt-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: FaCampground, end: 500, label: t("Partner Camps"), color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: FaUsers, end: 50, suffix: "K+", label: t("Happy Campers"), color: "text-blue-600", bg: "bg-blue-50" },
            { icon: FaStar, end: 4.8, decimals: 1, suffix: "/5", label: t("Average Rating"), color: "text-amber-500", bg: "bg-amber-50" },
            { icon: FaAward, end: 15, label: t("Awards Won"), color: "text-purple-600", bg: "bg-purple-50" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-10 rounded-[48px] bg-white border border-slate-100 hover:border-emerald-200 transition-all shadow-lg hover:shadow-2xl text-center"
            >
              <div className={`w-20 h-20 ${stat.bg} ${stat.color} rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform`}>
                <stat.icon />
              </div>
              <h2 className={`text-5xl font-bold text-slate-900 mb-2`}>
                <Counter end={stat.end} decimals={stat.decimals || 0} />{stat.suffix || "+"}
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
