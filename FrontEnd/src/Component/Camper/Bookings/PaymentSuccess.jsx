import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tx_ref = searchParams.get("tx_ref") || searchParams.get("trx_ref");
  
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'failed'

  useEffect(() => {
    if (!tx_ref) {
      setStatus("failed");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await api.get(`/payments/verify/${tx_ref}`);
        if (res.data.success) {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [tx_ref]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100"
      >
        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Verifying Payment...</h2>
            <p className="text-slate-500">Please wait while we confirm your transaction with Chapa.</p>
          </div>
        )}

        {status === "success" && (
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Payment Successful!</h2>
            <p className="text-slate-500 mb-8">
              Your payment has been verified. Your booking is now secure. Thank you for using EthioCampGround!
            </p>
            <button 
              onClick={() => navigate("/camper-dashboard/payments")}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              View My Virtual Ledger
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-slate-500 mb-8">
              We couldn't verify your payment. If you were charged, please contact support with your transaction reference.
            </p>
            <button 
              onClick={() => navigate("/camper-dashboard/payments")}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all"
            >
              Return to Payments
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
