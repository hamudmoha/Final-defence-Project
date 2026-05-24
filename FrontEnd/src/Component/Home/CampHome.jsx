import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import api from "../../services/api";
import CampVeiw from "../../assets/Camp.png";
import { HiLocationMarker, HiCalendar, HiUser, HiSearch } from "react-icons/hi";

// Counter Component
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

// Search Bar Component
const SearchBar = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState(1);

  const handleSearch = () => {
    // ✅ Redirect to the public BrowseALLCamps page
    // Ensure your App.js has a route path="/browse" pointing to BrowseALLCamps
    navigate(`/browse?search=${encodeURIComponent(location)}`);
  };

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
      <div className="grid md:grid-cols-4 gap-4 items-end">
        <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col md:col-span-2">
          <label className="text-sm text-gray-600 mb-1">Location or Name</label>
          <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3">
            <HiLocationMarker className="text-gray-500 w-5 h-5 mr-2" />
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>
        </motion.div>

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
              <option value="4">4+ Guests</option>
            </select>
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <button
            onClick={handleSearch}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium text-lg px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <HiSearch className="w-5 h-5" />
            Search
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Main Component
const CampHome = () => {
  const [totalCamps, setTotalCamps] = useState(0);

  // ✅ Fetch Real Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/camps");
        if (res.data.success) {
          setTotalCamps(res.data.total || res.data.data.length);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setTotalCamps(15); 
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="w-full bg-gradient-to-br from-gray-50 to-gray-100 py-20 md:py-28">
      <div className="container mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-10 items-center">
        {/* Left Text */}
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
          <div className="flex gap-4 pt-4">
            <a href="/browse"> {/* Ensure this matches your App.js route */}
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-3 rounded-xl shadow-md"
              >
                Explore Camps
              </motion.button>
            </a>
          </div>

          <div className="flex gap-10 pt-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-3xl font-bold text-green-700">
                <Counter end={totalCamps} />+
              </p>
              <p className="text-gray-500 text-sm">Active Camps</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <p className="text-3xl font-bold text-green-700">
                <Counter end={100} />+
              </p>
              <p className="text-gray-500 text-sm">Happy Campers</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
              <p className="text-3xl font-bold text-green-700">
                <Counter end={4.8} decimals={1} />★
              </p>
              <p className="text-gray-500 text-sm">Average Rating</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Image */}
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

      <div className="container mx-auto px-6 lg:px-12">
        <SearchBar />
      </div>
    </section>
  );
};

export default CampHome;
