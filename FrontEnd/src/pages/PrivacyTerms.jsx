import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import AuthNavbar from "../Component/Auth/AuthNavbar";
import AuthFooter from "../Component/Auth/AuthFooter";
const PrivacyTerms = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {" "}
      <AuthNavbar />{" "}
      <main className="flex-1 container mx-auto px-6 py-24 max-w-4xl">
        {" "}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 lg:p-20 border border-slate-100"
        >
          {" "}
          <div className="mb-12 flex justify-start">
            {" "}
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-all font-bold text-xs uppercase tracking-[0.2em]"
            >
              {" "}
              <HiArrowLeft className="w-4 h-4" /> {t("Back")}{" "}
            </motion.button>{" "}
          </div>{" "}
          <header className="mb-16 text-center">
            {" "}
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4 uppercase">
              {t("Privacy & Terms")}
            </h1>{" "}
            <div className="h-2 w-20 bg-emerald-500 mx-auto rounded-full" />{" "}
            <p className="text-slate-500 mt-6 font-medium text-lg italic">
              {t("Last Updated")}: May 2026
            </p>{" "}
          </header>{" "}
          <div className="space-y-12 text-slate-600 leading-relaxed">
            {" "}
            <section>
              {" "}
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-6 flex items-center gap-3">
                {" "}
                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold">
                  01
                </span>{" "}
                Privacy Policy{" "}
              </h2>{" "}
              <p className="mb-4">
                {" "}
                At EthioCampGround, we prioritize your privacy. This policy
                outlines how we collect, use, and protect your personal
                information when you use our platform to book or list
                campsites.{" "}
              </p>{" "}
              <ul className="list-disc pl-6 space-y-3 font-medium">
                {" "}
                <li>
                  Personal Information: We collect your name, email, phone
                  number, and identification documents for verification.
                </li>{" "}
                <li>
                  Usage Data: We track how you interact with our services to
                  improve your experience.
                </li>{" "}
                <li>
                  Data Security: We implement industry-standard encryption and
                  security measures to protect your data.
                </li>{" "}
              </ul>{" "}
            </section>{" "}
            <section>
              {" "}
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-6 flex items-center gap-3">
                {" "}
                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold">
                  02
                </span>{" "}
                Terms of Service{" "}
              </h2>{" "}
              <p className="mb-4">
                {" "}
                By accessing or using EthioCampGround, you agree to comply with
                and be bound by the following terms and conditions.{" "}
              </p>{" "}
              <ul className="list-disc pl-6 space-y-3 font-medium">
                {" "}
                <li>
                  Account Responsibility: You are responsible for maintaining
                  the confidentiality of your account credentials.
                </li>{" "}
                <li>
                  Booking & Payments: All bookings are subject to availability
                  and the payment terms specified at the time of reservation.
                </li>{" "}
                <li>
                  User Conduct: Users must act respectfully and follow local
                  laws when visiting campsites listed on our platform.
                </li>{" "}
              </ul>{" "}
            </section>{" "}
            <section>
              {" "}
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-6 flex items-center gap-3">
                {" "}
                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold">
                  03
                </span>{" "}
                Contact Us{" "}
              </h2>{" "}
              <p>
                {" "}
                If you have any questions about these Privacy & Terms, please
                contact our legal team at{" "}
                <a
                  href="mailto:legal@ethiocampground.com"
                  className="text-emerald-600 font-bold ml-1 hover:underline"
                >
                  legal@ethiocampground.com
                </a>
                .{" "}
              </p>{" "}
            </section>{" "}
          </div>{" "}
        </motion.div>{" "}
      </main>{" "}
      <AuthFooter />{" "}
    </div>
  );
};
export default PrivacyTerms;
