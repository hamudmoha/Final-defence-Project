import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CampVeiw from "../../assets/Camp.png";
import { HiLocationMarker, HiCalendar, HiUser, HiSearch } from "react-icons/hi";

// --------------------------
// COUNTER COMPONENT
// --------------------------
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

// --------------------------
// SEARCH BAR COMPONENT
// --------------------------
const SearchBar = () => {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="w-full bg-white shadow-lg rounded-3xl p-6 mt-10 border border-gray-100"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Find Your Perfect Camp
      </h2>

      <div className="grid md:grid-cols-5 gap-4 items-end">

        {/* LOCATION */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Location</label>
          <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3">
            <HiLocationMarker className="text-gray-500 w-5 h-5 mr-2" />
            <input
              type="text"
              placeholder="Where to?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>
        </motion.div>

        {/* CHECK-IN */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Check-in</label>
          <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3">
            <HiCalendar className="text-gray-500 w-5 h-5 mr-2" />
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>
        </motion.div>

        {/* CHECK-OUT */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Check-out</label>
          <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3">
            <HiCalendar className="text-gray-500 w-5 h-5 mr-2" />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>
        </motion.div>

        {/* GUESTS */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Guests</label>
          <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3">
            <HiUser className="text-gray-500 w-5 h-5 mr-2" />
            <select
              className="w-full bg-transparent outline-none text-gray-700"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
              <option value="5">5 Guests</option>
            </select>
          </div>
        </motion.div>

        {/* SEARCH BUTTON */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <button className="w-full bg-green-700 hover:bg-green-800 text-white font-medium text-lg px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition">
            <HiSearch className="w-5 h-5" />
            Search
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --------------------------
// HERO SECTION
// --------------------------
const FeatureHome = () => {
  return (
    <section className="w-full bg-gradient-to-br from-gray-50 to-gray-100 py-20 md:py-28">
      <div className="container mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT TEXT */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Discover Your <br />
            Perfect Camp <br />
            Experience
          </h1>

          <p className="text-gray-600 text-lg md:text-xl">
            Book unique camping spots across Ethiopia. From mountain retreats to
            lakeside havens, find your next adventure with ease.
          </p>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-3 rounded-xl shadow-md"
            >
              Explore Camps
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              className="border border-green-700 text-green-700 font-medium px-6 py-3 rounded-xl hover:bg-green-50"
            >
              Learn More
            </motion.button>
          </div>

          {/* 🔥 STATS WITH ANIMATED COUNTER */}
          <div className="flex gap-10 pt-8">
            {/* Active Camps */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-3xl font-bold text-green-700">
                <Counter end={500} />
                +
              </p>
              <p className="text-gray-500 text-sm">Active Camps</p>
            </motion.div>

            {/* Happy Campers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-3xl font-bold text-green-700">
                <Counter end={10} />
                k+
              </p>
              <p className="text-gray-500 text-sm">Happy Campers</p>
            </motion.div>

            {/* Rating */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <p className="text-3xl font-bold text-green-700">
                <Counter end={4.8} decimals={1} />★
              </p>
              <p className="text-gray-500 text-sm">Average Rating</p>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl overflow-hidden shadow-xl"
        >
          <motion.img
            src={CampVeiw}
            alt="Camp View"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      </div>

      {/* SEARCH BAR BELOW HERO
      <div className="container mx-auto px-6 lg:px-12">
        <SearchBar />
      </div> */}
    </section>
  );
};

export default FeatureHome;
