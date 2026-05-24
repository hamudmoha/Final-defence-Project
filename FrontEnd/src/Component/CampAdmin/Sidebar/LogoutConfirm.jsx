import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertCircle, User, Tent } from "lucide-react";
import { useUser } from "../../../context/UserContext";

export default function LogoutConfirm({ open, onClose }) {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [userData, setUserData] = useState({ name: "Manager", camp: "Active Property" });

  // Load dynamic data when the modal opens
  useEffect(() => {
    if (open && user) {
      setUserData({
        name: user.fullName || "Manager",
        camp: user.businessName || "Your Camp Ground",
        profilePicture: user.profilePicture || null
      });
    }
  }, [open, user]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    sessionStorage.clear();
    setUser(null);

    // Smooth redirect
    navigate("/login", { replace: true });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-[95%] max-w-md rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { type: "spring", damping: 25, stiffness: 300 } 
            }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
          >
            {/* Top Warning Banner */}
            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Confirm Logout</h2>
              <p className="text-sm text-slate-500 mt-1">We'll miss you, stay safe!</p>
            </div>

            {/* Dynamic Content Section */}
            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-teal-100 mr-3 flex-shrink-0 flex items-center justify-center">
                    {userData.profilePicture ? (
                      <img src={userData.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Manager</p>
                    <p className="text-sm font-semibold text-slate-700">{userData.name}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Tent className="w-5 h-5 text-teal-600 mr-3" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Camp Property</p>
                    <p className="text-sm font-semibold text-slate-700">{userData.camp}</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-slate-600 mb-8">
                Are you sure you want to end your session? You will need to log in again to manage your camps.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-red-600 text-white shadow-lg shadow-red-200 flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Now</span>
                </motion.button>

                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel and Stay
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
