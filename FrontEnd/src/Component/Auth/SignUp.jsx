import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CamperRegistration } from "./CamperRegistration";
import ManagerSignUpForm from "./managerSignUpForm";
import { HomeIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

// Image Assets (Matching the Login for brand consistency)
import camp0 from "../../assets/Camp.png";
import camp1 from "../../assets/camp1.png";
import camp2 from "../../assets/camp2.png";
import Navbar from "../Home/Navbar";

const SignUp = () => {
  const { t } = useTranslation();
  const images = [camp0, camp1, camp2];
  const [currentImg, setCurrentImg] = useState(0);
  const [openSignUp, setOpenSignUp] = useState(false);
  const [openSignUpManager, setOpenSignUpManager] = useState(false);

  // Slideshow Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleOpenUser = () => { setOpenSignUp(true); setOpenSignUpManager(false); };
  const handleOpenManager = () => { setOpenSignUpManager(true); setOpenSignUp(false); };

  return (
    <>
    <Navbar />
    <div className="w-full h-screen flex items-center justify-center bg-white p-4 selection:bg-blue-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-6xl h-[750px] bg-white rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,123,167,0.3)] border border-slate-100 overflow-hidden relative"
      >
        
        {/* LEFT SIDE - DYNAMIC SLIDESHOW (Matching Login) */}
        <div className="relative hidden md:flex w-1/2 h-full bg-slate-900 overflow-hidden">
          {images.map((img, index) => (
            <motion.img
              key={index}
              src={img}
              initial={{ opacity: 0 }}
              animate={{ opacity: currentImg === index ? 1 : 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover scale-105"
              alt="Camping Background"
            />
          ))}
          {/* Professional Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
          
          <div className="absolute bottom-20 left-12 right-12 text-white z-10">
            <TypeAnimation
              sequence={[
                t("Start your adventure today."), 2000,
                t("Join a community of explorers."), 2000,
                t("Manage your camps with ease."), 2000
              ]}
              wrapper="h2"
              speed={50}
              className="text-4xl font-black tracking-tight leading-tight"
              repeat={Infinity}
            />
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: "80px" }} 
              className="h-1.5 bg-sky-400 mt-6 rounded-full"
            />
          </div>
        </div>

        {/* RIGHT SIDE - CERULEAN THEME CONTENT */}
        <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-12 lg:px-20 bg-[#007ba7] relative overflow-y-auto">
          <AnimatePresence mode="wait">
            {!openSignUp && !openSignUpManager ? (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md mx-auto"
              >
                <header className="mb-10">
                  <h1 className="text-4xl font-black text-white tracking-tight uppercase">{t("Get Started")}</h1>
                  <p className="text-blue-50/70 mt-4 text-lg font-medium">
                    {t("Select your path to continue.")}
                  </p>
                </header>

                <div className="space-y-4">
                  <SelectionButton 
                    icon={<HomeIcon className="w-7 h-7" />} 
                    title={t("Camper Account")} 
                    desc={t("Join to explore and book campsites.")} 
                    onClick={handleOpenUser} 
                  />
                  <SelectionButton 
                    icon={<BuildingOfficeIcon className="w-7 h-7" />} 
                    title={t("Camp Manager")} 
                    desc={t("List and manage your properties.")} 
                    onClick={handleOpenManager} 
                  />
                </div>

                <footer className="mt-12 text-center">
                  <p className="text-white/50 text-sm font-medium">
                    {t("Already part of the journey?")} 
                    <a href="/login" className="text-white font-black ml-2 hover:underline underline-offset-4 tracking-tight">{t("Login")}</a>
                  </p>
                </footer>
              </motion.div>
            ) : openSignUp ? (
              <motion.div 
                key="camper-form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="w-full"
              >
                <CamperRegistration onBack={() => setOpenSignUp(false)} />
              </motion.div>
            ) : (
              <motion.div 
                key="manager-form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="w-full"
              >
                <ManagerSignUpForm onBack={() => setOpenSignUpManager(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  </>
  );
};

// --- Selection Card Component with Hover Smoothness ---
const SelectionButton = ({ icon, title, desc, onClick }) => (
  <motion.button 
    whileHover={{ scale: 1.02, x: 5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick} 
    className="w-full group p-6 rounded-[28px] bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/30 transition-all flex items-center gap-6"
  >
    <div className="p-4 bg-white/10 text-sky-300 rounded-2xl group-hover:bg-sky-400 group-hover:text-white transition-colors duration-300">
      {icon}
    </div>
    <div>
      <h3 className="text-white font-bold text-xl tracking-tight">{title}</h3>
      <p className="text-white/40 text-sm font-medium group-hover:text-white/70 transition-colors">{desc}</p>
    </div>
  </motion.button>
);

export default SignUp;
