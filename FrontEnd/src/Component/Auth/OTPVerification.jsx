import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const OTPVerification = () => {
  const { t } = useTranslation();
  const { refreshUser } = useUser();
  const [target, setTarget] = useState(localStorage.getItem("pendingTarget") || "");
  const [code, setCode] = useState("");
  const [type, setType] = useState("verification");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/auth/verify-otp", {
        target,
        code,
        type,
      });

      if (res.data.success) {
        setMessage(t("Verification successful! Redirecting..."));

        // --- CRITICAL UPDATE: SESSION PERSISTENCE ---
        // 1. Save the tokens and user object (Sent from your MongoDB/Backend)
        const userPayload = res.data.data || res.data.user || {};
        const token = res.data.accessToken || res.data.token || userPayload.token;
        if (token) {
          localStorage.setItem("token", token);
        }
        
        if (userPayload && userPayload.role) {
          localStorage.setItem("user", JSON.stringify(userPayload));
          localStorage.setItem("role", userPayload.role);
        }

        // 2. Trigger a storage event for cross-tab sync
        window.dispatchEvent(new Event("storage"));
        
        // 3. Refresh user context
        await refreshUser();

        // 4. Clean up the pending target
        localStorage.removeItem("pendingTarget");
        // 4. Conditional Redirection based on Role
        const userRole = userPayload.role || res.data?.role || "";

        const getDashboardPath = (role) => {
          switch (role) {
            case "camper":
              return "/camper-dashboard";
            case "manager":
            case "camp_manager":
              return "/manager-dashboard";
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

        setTimeout(() => {
          const pendingRedirect = localStorage.getItem("pendingRedirect");
          localStorage.removeItem("pendingRedirect");
          if (pendingRedirect) {
            navigate(pendingRedirect);
          } else {
            navigate(getDashboardPath(userRole));
          }
        }, 1500);

      }

    } catch (err) {
      console.error("Verification Error:", err);
      setMessage(err.response?.data?.error || t("Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-200 p-4">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-gray-100"
      >
        <h2 className="text-3xl font-black text-center mb-2 text-[#007ba7]">
          {t("Verify OTP")}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {t("Secure your account to start your adventure.")}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              {t("Target (Phone or Email)")}
            </label>
            <input
              type="text"
              placeholder={t("Not found, please enter manually")}
              className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#007ba7] focus:border-transparent transition-all font-medium"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              {t("6-Digit OTP Code")}
            </label>
            <input
              type="text"
              placeholder="0 0 0 0 0 0"
              maxLength="6"
              className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#007ba7] focus:border-transparent transition-all text-center text-2xl font-black tracking-[0.5em] text-[#007ba7]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              {t("Verification Type")}
            </label>
            <select
              className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-[#007ba7] font-medium transition-all"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="verification">{t("Account Verification")}</option>
              <option value="reset">{t("Password Reset")}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#007ba7] text-white py-4 rounded-2xl hover:bg-[#005f82] transition-all disabled:bg-gray-300 font-black mt-8 shadow-lg shadow-blue-200 uppercase tracking-widest text-sm"
        >
          {loading ? t("Processing...") : t("Verify & Continue")}
        </button>

        {message && (
          <div
            className={`mt-6 text-center text-xs font-bold p-4 rounded-2xl border ${
              message.toLowerCase().includes("successful") 
                ? "text-green-700 bg-green-50 border-green-100" 
                : "text-red-600 bg-red-50 border-red-100"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default OTPVerification;
