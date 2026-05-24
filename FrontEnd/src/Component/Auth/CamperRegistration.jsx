import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { 
  HiMail, 
  HiLockClosed, 
  HiEye, 
  HiEyeOff, 
  HiPhone, 
  HiUser,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowLeft
} from "react-icons/hi";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useEffect } from "react";

export const CamperRegistration = ({ onBack }) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validations = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
    match: confirmPassword.length > 0 && password === confirmPassword
  };

  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const isPlaceholder = !clientId || clientId.includes("REPLACE_THIS_WITH_YOUR_ACTUAL_ID") || clientId.includes("YOUR_GOOGLE_CLIENT_ID");

    if (window.google && !window.google_initialized && !isPlaceholder) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse
      });
      window.google_initialized = true;
    } else if (isPlaceholder) {
      console.warn("Google Client ID is missing or placeholder in Registration. Google Sign-In disabled.");
    }
  }, []);

  const handleGoogleResponse = (response) => {
    const userObject = JSON.parse(atob(response.credential.split('.')[1]));
    setEmail(userObject.email);
    setFirstName(userObject.given_name || "");
    setLastName(userObject.family_name || "");
    // User still needs to fill phone and password as per requirements
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError(t("Please agree to the terms and policy."));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("Passwords do not match."));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        password,
        role: "camper",
      });

      // Save email for OTP verification page
      localStorage.setItem("pendingTarget", email);
      window.location.href = "/verify";
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || t("Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-white/60 hover:text-white mb-8 text-xs font-black tracking-[0.2em] transition-all group"
      >
        <HiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> {t("BACK TO SELECTION")}
      </button>

      <header className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">{t("Camper Signup")}</h2>
        <div className="h-1 w-12 bg-sky-400 mt-2 rounded-full" />
      </header>

      <div className="mb-6">
        <motion.button 
          whileHover={{ scale: 1.01 }} 
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={() => {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            const isPlaceholder = !clientId || clientId.includes("REPLACE_THIS_WITH_YOUR_ACTUAL_ID") || clientId.includes("YOUR_GOOGLE_CLIENT_ID");
            
            if (isPlaceholder) {
              setError(t("Google Registration is currently unavailable. Please use the form below."));
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

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-400 text-white text-xs font-bold flex gap-3 items-center rounded-r-xl"
        >
          <HiExclamationCircle className="text-xl shrink-0 text-red-400" />
          {error}
        </motion.div>
      )}
      
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-lg z-10 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder={t("First Name")} 
              className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all text-sm font-medium" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              required 
            />
          </div>
          <div className="relative group">
            <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-lg z-10 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder={t("Last Name")} 
              className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all text-sm font-medium" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-lg z-10 group-focus-within:text-white transition-colors" />
            <input 
              type="email" 
              placeholder={t("Email")} 
              className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all text-sm font-medium" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="relative group">
            <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-lg z-10 group-focus-within:text-white transition-colors" />
            <input 
              type="tel" 
              placeholder={t("Phone")} 
              className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all text-sm font-medium" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-lg z-10 group-focus-within:text-white transition-colors" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder={t("Password")} 
              className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-10 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all text-sm font-medium" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
            </button>
          </div>
          <div className="relative group">
            <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 text-lg z-10 group-focus-within:text-white transition-colors" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder={t("Confirm")} 
              className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:bg-white/10 focus:border-sky-400 transition-all text-sm font-medium" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-y-2 gap-x-1 p-4 bg-black/10 rounded-[20px] border border-white/5 backdrop-blur-sm">
          <ValidationItem label={t("8+ Chars")} isValid={validations.length} />
          <ValidationItem label={t("Uppercase")} isValid={validations.upper} />
          <ValidationItem label={t("Lowercase")} isValid={validations.lower} />
          <ValidationItem label={t("Number")} isValid={validations.number} />
          <ValidationItem label={t("Symbol")} isValid={validations.special} />
          <ValidationItem label={t("Match")} isValid={validations.match} />
        </div>

        <div className="flex items-center gap-3 px-1 py-2">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              id="agree"
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)} 
              className="w-5 h-5 rounded-lg border-white/20 bg-white/5 accent-sky-400 cursor-pointer" 
            />
          </div>
          <label htmlFor="agree" className="text-[11px] text-white/60 font-medium cursor-pointer leading-tight">
            {t("I agree to the")} <span className="text-white font-black underline underline-offset-2">{t("Terms of Service")}</span> {t("and")} <span className="text-white font-black underline underline-offset-2">{t("Privacy Policy")}</span>.
          </label>
        </div>

        <motion.button 
          whileHover={{ scale: 1.01, y: -2 }} 
          whileTap={{ scale: 0.99 }} 
          type="submit" 
          disabled={loading} 
          className="w-full bg-white text-[#007ba7] font-black py-4 rounded-2xl shadow-xl shadow-black/20 hover:bg-sky-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-[#007ba7]/30 border-t-[#007ba7] rounded-full animate-spin" />
              {t("Processing...")}
            </>
          ) : t("Create Account")}
        </motion.button>
      </form>
    </div>
  );
};

const ValidationItem = ({ label, isValid }) => (
  <div className={`flex items-center gap-1.5 transition-colors duration-300 ${isValid ? "text-sky-300" : "text-white/20"}`}>
    <HiCheckCircle className={`text-sm ${isValid ? "scale-110" : "scale-100"} transition-transform`} />
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </div>
);
