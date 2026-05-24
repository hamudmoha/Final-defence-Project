import React from "react";
import { motion } from "framer-motion";

import { FaLeaf } from "react-icons/fa";
import { FaHandshake } from "react-icons/fa";
import { FaShieldAlt } from "react-icons/fa";

export default function CoreValues() {
  return (
    <div className="w-full bg-white py-24">

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="text-center text-4xl md:text-5xl font-extrabold text-gray-900 mb-16"
      >
        Our Core Values
      </motion.h2>

      {/* Cards */}
      <motion.div
        className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10 px-6"
        
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}

        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.25 },
          },
        }}
      >

        {/* 1 — Sustainability */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg rounded-3xl p-10 border border-gray-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="w-14 h-14 bg-green-800 rounded-xl flex items-center justify-center"
          >
            <FaLeaf className="text-white text-2xl" />
          </motion.div>

          <h3 className="text-2xl font-bold text-gray-900 mt-6">
            Sustainability
          </h3>

          <p className="text-gray-600 text-lg mt-3 leading-relaxed">
            We're committed to eco-friendly practices and protecting Ethiopia's 
            natural heritage for future generations.
          </p>
        </motion.div>

        {/* 2 — Community First */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg rounded-3xl p-10 border border-gray-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="w-14 h-14 bg-[#97C93D] rounded-xl flex items-center justify-center"
          >
            <FaHandshake className="text-white text-2xl" />
          </motion.div>

          <h3 className="text-2xl font-bold text-gray-900 mt-6">
            Community First
          </h3>

          <p className="text-gray-600 text-lg mt-3 leading-relaxed">
            Supporting local communities and ensuring tourism benefits 
            reach those who need it most.
          </p>
        </motion.div>

        {/* 3 — Trust & Safety */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg rounded-3xl p-10 border border-gray-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center"
          >
            <FaShieldAlt className="text-white text-2xl" />
          </motion.div>

          <h3 className="text-2xl font-bold text-gray-900 mt-6">
            Trust & Safety
          </h3>

          <p className="text-gray-600 text-lg mt-3 leading-relaxed">
            Verified camps, secure payments, and 24/7 support ensure your 
            peace of mind every step of the way.
          </p>
        </motion.div>

      </motion.div>

    </div>
  );
}
