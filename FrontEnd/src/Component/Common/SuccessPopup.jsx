import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { CheckCircle, X, PartyPopper, ArrowRight } from 'lucide-react';

export const SuccessPopup = ({ isOpen, onClose, title, message, buttonText = "Go to Dashboard" }) => {
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.1}
            colors={['#059669', '#10b981', '#34d399', '#6ee7b7', '#ffffff']}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header Gradient */}
            <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 12 }}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </motion.div>
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PartyPopper className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-2xl font-black text-slate-900">{title}</h2>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  {message}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={onClose}
                className="mt-8 w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 group active:scale-95"
              >
                {buttonText}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <p className="mt-4 text-xs text-slate-400 font-medium">
                EthioCampGround Management Team
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


