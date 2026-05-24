import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { HiUser } from "react-icons/hi";
import { useNavigate, Link } from "react-router-dom";   // <-- ADD THIS
import Logo from "../../assets/login-image.png";

export const RequestPasswordReset = () => {
  const { t } = useTranslation();
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();   // <-- ADD THIS

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/request-password-reset", { target: target.trim() });
      setMessage(res.data.message);

      // AUTO-REDIRECT AFTER SUCCESS
      setTimeout(() => {
        navigate("/reset-password", { state: { target: target.trim(), devOtp: res.data.devOtp } });
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || t("Failed to send reset code"));
    }
  };

  return (
    <div className="w-full h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* LEFT SIDE */}
      <div className="bg-blue-800 flex items-center justify-center overflow-hidden">
        <img src={Logo} alt="reset password" className="w-full h-full object-cover" />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">

          <h1 className="text-3xl font-semibold text-center">{t("Reset Password")}</h1>
          <p className="text-center text-gray-500 mt-1">
            {t("Enter your email or phone to receive a reset code")}
          </p>

          {error && (
            <p className="bg-red-100 text-red-700 p-2 rounded-xl text-center mt-4">
              {error}
            </p>
          )}

          {message && (
            <p className="bg-green-100 text-green-700 p-2 rounded-xl text-center mt-4">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            
            <label className="text-sm font-medium">{t("Email or Phone")}</label>
            <div className="relative">
              <HiUser className="absolute left-3 top-3.5 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder={t("Enter email or phone number")}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl mt-2 hover:bg-blue-700 transition"
            >
              {t("Send Reset Code")}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            {t("Remember your password?")}{" "}
            <Link to="/login">
              <span className="text-blue-600 cursor-pointer hover:underline">
                {t("Sign in")}
              </span>
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};
