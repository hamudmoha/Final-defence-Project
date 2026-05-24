import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Navigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useUser } from "../../context/UserContext";
import { FcGoogle } from "react-icons/fc";

// Image Assets
import camp0 from "../../assets/Camp.png";
import camp1 from "../../assets/camp1.png";
import camp2 from "../../assets/camp2.png";
import Navbar from "../Home/Navbar";

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loadingUser, refreshUser } = useUser();

  useEffect(() => {
    if (location.state?.from) {
      const fromPath = location.state.from.pathname + (location.state.from.search || "");
      localStorage.setItem("pendingRedirect", fromPath);
    }
  }, [location.state]);

  const [currentImg, setCurrentImg] = useState(0);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Restoration State
  const [restorationMode, setRestorationMode] = useState(false);
  const [restoreToken, setRestoreToken] = useState(null);
  const [restoreData, setRestoreData] = useState({
    license: null,
    govId: null,
    profilePicture: null,
    password: ""
  });

  const images = [camp0, camp1, camp2];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const isPlaceholder = !clientId || clientId.includes("REPLACE_THIS_WITH_YOUR_ACTUAL_ID") || clientId.includes("YOUR_GOOGLE_CLIENT_ID");

    if (window.google && !window.google_initialized && !isPlaceholder) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleLogin
      });
      window.google_initialized = true;
    } else if (isPlaceholder) {
      console.warn("Google Client ID is missing or placeholder. Google Sign-In will be disabled.");
    }
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/google-login", {
        credential: response.credential
      });

      const token = res.data?.data?.token || res.data?.token;
      localStorage.setItem("token", token);

      const userPayload = res.data?.data || res.data?.user || {};
      const role = userPayload.role || "camper";

      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(userPayload));

      await refreshUser();
      setSuccess(true);

      const pendingRedirect = localStorage.getItem("pendingRedirect");
      localStorage.removeItem("pendingRedirect");

      // Prevent the router from bouncing new users into the previous user's dashboard layout
      const isDashboardRoute = pendingRedirect && (
        pendingRedirect.includes("dashboard") || 
        pendingRedirect.includes("super-admin") ||
        pendingRedirect === "/"
      );

      if (pendingRedirect && !isDashboardRoute) {
        // Only honor the redirect if it's a deep-link
        navigate(pendingRedirect);
      } else {
        // Otherwise, strictly enforce their designated role dashboard
        navigate(getDashboardPath(role));
      }
    } catch (err) {
      setError(t("Google Login failed."));
      setLoading(false);
    }
  };

  // Helper: get dashboard path from role
  const getDashboardPath = (role) => {
    switch (role) {
      case "camper":
        return "/camper-dashboard";
      case "manager":
      case "camp_manager":
        return "/manager-dashboard/dashboard";
      case "ticket_officer":
        return "/ticket-dashboard";
      case "admin":
      case "system_admin":
      case "super_admin":
        return "/super-admin";
      case "security_officer":
        return "/security_officer";
      default:
        return "/";
    }
  };

  // Safe navigation redirect tracker that prevents rendering conflicts during explicit logins
  useEffect(() => {
    if (user && !success && !loadingUser) {
      const dashboardPath = getDashboardPath(user.role);
      navigate(dashboardPath, { replace: true });
    }
  }, [user, success, loadingUser, navigate]);

  if (loadingUser) {
    return <div className="flex items-center justify-center h-screen">{t("Loading...")}</div>;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        identifier: formData.identifier,
        password: formData.password,
      });

      const token = res.data?.data?.token || res.data?.token || res.data?.accessToken;
      if (!token) throw new Error("Token missing in response");

      localStorage.setItem("token", token);
      if (res.data.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);

      const userPayload = res.data?.data || res.data?.user || {};
      const role = userPayload.role || "";

      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(userPayload));

      // 1. Force state synchronization before setting success flags
      await refreshUser();

      // 2. Clear state updates and route IMMEDIATELY based on response variables 
      setSuccess(true);

      const pendingRedirect = localStorage.getItem("pendingRedirect");
      localStorage.removeItem("pendingRedirect");

      // Prevent the router from bouncing new users into the previous user's dashboard layout
      const isDashboardRoute = pendingRedirect && (
        pendingRedirect.includes("dashboard") || 
        pendingRedirect.includes("super-admin") ||
        pendingRedirect === "/"
      );

      if (pendingRedirect && !isDashboardRoute) {
        // Only honor the redirect if it's a deep-link
        navigate(pendingRedirect);
      } else {
        // Otherwise, strictly enforce their designated role dashboard
        const dashboardPath = getDashboardPath(role);
        navigate(dashboardPath);
      }
    } catch (err) {
      setLoading(false);
      const status = err.response?.status;

      if (status === 403 && err.response?.data?.requires_restoration) {
        setRestorationMode(true);
        setRestoreToken(err.response.data.data.token);
        setError(t("Account deleted. You are within the 15-day grace period. Upload your compliance documents to request restoration."));
        return;
      }

      if (status === 404) {
        setError(t("Account does not exist. Please check your identifier."));
      } else if (status === 401) {
        const msg = err.response?.data?.message || err.response?.data?.error || "";
        if (msg.toLowerCase().includes("verify your email")) {
          setError(t("Email not verified. Redirecting..."));
          localStorage.setItem("pendingTarget", formData.identifier);
          setTimeout(() => navigate("/verify"), 1500);
        } else {
          setError(t("Wrong password. Please try again."));
        }
      } else if (status === 403) {
        setError(err.response?.data?.error || t("Access denied."));
      } else {
        setError(t("Unable to reach server or invalid response."));
        console.error("Login Error:", err);
      }
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = new FormData();
      if (restoreData.license) data.append("license", restoreData.license);
      if (restoreData.govId) data.append("govId", restoreData.govId);
      if (restoreData.profilePicture) data.append("profilePicture", restoreData.profilePicture);
      if (restoreData.password) data.append("password", restoreData.password);
      
      const res = await api.post("/auth/restore-manager", data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${restoreToken}`
        }
      });
      
      setSuccess(true);
      setError("Restoration requested. Please wait for admin approval.");
      setTimeout(() => {
        setRestorationMode(false);
        setSuccess(false);
        setError("");
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit restoration request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="w-full h-screen flex items-center justify-center bg-white p-4 selection:bg-blue-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-5xl h-[650px] bg-white rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,123,167,0.3)] border border-slate-100 overflow-hidden relative"
        >
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center text-center p-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <HiCheckCircle className="text-[#007ba7] text-[120px] mb-6 drop-shadow-xl" />
                </motion.div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t("Warm Welcome!")}</h1>
                <p className="text-slate-500 mt-3 text-lg font-medium">{t("Synchronizing your adventure...")}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LEFT PANEL */}
          <div className="relative hidden md:flex w-1/2 h-full bg-slate-900 overflow-hidden">
            {images.map((img, index) => (
              <motion.img
                key={index}
                src={img}
                initial={{ opacity: 0 }}
                animate={{ opacity: currentImg === index ? 1 : 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover scale-105"
                alt="Camping"
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20" />
            <div className="absolute bottom-20 left-12 right-12 text-white z-10">
              <TypeAnimation
                sequence={[t("Your journey begins here."), 1500, t("The ultimate camping experience awaits."), 1500]}
                wrapper="h2"
                speed={50}
                className="text-3xl font-extrabold tracking-tight leading-tight"
                repeat={Infinity}
              />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-12 lg:px-24 bg-[#007ba7] relative">
            <div className="w-full max-w-sm mx-auto">
              <header className="mb-10">
                <TypeAnimation
                  sequence={[t("Welcome Back"), 2000]}
                  wrapper="h1"
                  className="text-4xl font-black text-white tracking-[-0.05em]"
                  cursor={false}
                />
                <div className="h-1.5 w-14 bg-white/30 mt-4 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-white"
                  />
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-6 p-3 bg-white/10 backdrop-blur-sm border-l-4 border-white rounded-r-lg flex items-center gap-2 text-white text-xs font-bold"
                    >
                      <HiExclamationCircle className="text-lg shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!error && !restorationMode && (
                  <p className="text-blue-50/80 mt-6 font-medium text-lg leading-relaxed">
                  </p>
                )}
              </header>

              {restorationMode ? (
                <form onSubmit={handleRestoreSubmit} className="space-y-4">
                  <p className="text-white text-sm mb-4 bg-white/10 p-3 rounded-lg border border-white/20">
                    Your account is soft-deleted. To restore it, you must re-submit your compliance documents and create a new password.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">New Password</label>
                    <input type="password" required value={restoreData.password} onChange={e => setRestoreData({...restoreData, password: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Business License (PDF/Img)</label>
                    <input type="file" required onChange={e => setRestoreData({...restoreData, license: e.target.files[0]})} className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-2 text-white text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Government ID</label>
                    <input type="file" required onChange={e => setRestoreData({...restoreData, govId: e.target.files[0]})} className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-2 text-white text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Profile Picture</label>
                    <input type="file" required onChange={e => setRestoreData({...restoreData, profilePicture: e.target.files[0]})} className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-2 text-white text-sm" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-[#007ba7] font-black py-4 rounded-2xl mt-4 shadow-xl shadow-black/10 flex items-center justify-center transition-all hover:shadow-white/20"
                  >
                    {loading ? <div className="w-5 h-5 border-[3px] border-[#007ba7] border-t-transparent rounded-full animate-spin" /> : "Submit Restoration Request"}
                  </motion.button>
                  <button type="button" onClick={() => setRestorationMode(false)} className="w-full mt-2 text-white/70 hover:text-white text-sm font-bold">Cancel</button>
                </form>
              ) : (
                <>
                  <div className="mb-6">
                    <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                    const isPlaceholder = !clientId || clientId.includes("REPLACE_THIS_WITH_YOUR_ACTUAL_ID") || clientId.includes("YOUR_GOOGLE_CLIENT_ID");

                    if (isPlaceholder) {
                      setError(t("Google Login is not configured. Please contact support or use email login."));
                      return;
                    }
                    window.google?.accounts.id.prompt();
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FcGoogle className="text-xl" />
                  {t("Continue with Google")}
                </motion.button>
                <div className="relative flex items-center justify-center my-6">
                  <div className="w-full border-t border-white/10" />
                  <span className="absolute bg-[#007ba7] px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t("OR EMAIL")}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
                    {t("Account Identifier")}
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-xl z-10 pointer-events-none" />
                    <input
                      type="text"
                      name="identifier"
                      placeholder={t("Email or Phone")}
                      value={formData.identifier}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
                    {t("Password")}
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-xl z-10 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pb-2">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-white/70 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    {t("Reset Password?")}
                  </Link>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-[#007ba7] font-black py-4 rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center gap-3 transition-all hover:shadow-white/20"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-[3px] border-[#007ba7] border-t-transparent rounded-full"
                    />
                  ) : (
                    t("Login")
                  )}
                </motion.button>
              </form>

              <footer className="mt-10 text-center">
                <p className="text-blue-50/60 text-sm font-medium">
                  {t("New explorer?")}{" "}
                  <Link
                    to="/signUp"
                    className="text-white font-black ml-1 hover:underline underline-offset-4 tracking-tight"
                  >
                    {t("Create an Account")}
                  </Link>
                </p>
              </footer>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};