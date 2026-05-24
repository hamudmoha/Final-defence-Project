import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from './Hero';
import PlatformFeatures from './PlatformFeatures';
import Experience from './Experience';
import WhyChoose from './WhyChoose';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import CTASection from './CTASection';
import RecommendedCamps from './RecommendedCamps';
import FavoritesSection from './FavoritesSection';

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      <Hero />
      
      {/* Personalized Favorites (shown only if exists) */}
      <FavoritesSection />
      
      {/* Dynamic Recommendation Section */}
      <RecommendedCamps />

      {/* Moved from Features Page */}
      <div className="py-10">
        <PlatformFeatures />
      </div>
      
      <Experience />
      
      <div className="bg-slate-50 rounded-[64px] mx-4 md:mx-10 my-20 py-20">
        <WhyChoose />
      </div>

      <HowItWorks />
      
      <div className="bg-emerald-600 rounded-[64px] mx-4 md:mx-10 my-20 text-white">
        <CTASection />
      </div>

      <Testimonials />
    </motion.div>
  );
};

export default Home;
