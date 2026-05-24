import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../SystemAdmin/ui/utils';

export const RatingModal = ({ isOpen, onClose, bookingId, targetId, targetType, targetName, onSuccess }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("Please select a rating"));
      return;
    }

    setLoading(true);
    try {
      const endpoint = targetType === 'Camp' ? '/reviews/camp' : '/reviews/camper';
      const payload = {
        bookingId,
        rating,
        comment,
        [targetType === 'Camp' ? 'campId' : 'camperId']: targetId
      };

      await api.post(endpoint, payload);
      toast.success(t("Thank you for your rating!"));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to submit rating"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {targetType === 'Camp' ? t("Rate your stay") : t("Rate the camper")}
                </h2>
                <p className="text-slate-500 mt-1">{t("How was your experience with")} <span className="font-bold text-slate-700">{targetName}</span>?</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Stars */}
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className="relative group transition-transform active:scale-90"
                  >
                    <Star
                      size={48}
                      className={cn(
                        "transition-all duration-300",
                        (hover || rating) >= star 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "fill-transparent text-slate-200"
                      )}
                    />
                    {hover === star && (
                      <motion.div 
                        layoutId="star-pop"
                        className="absolute -top-1 -left-1 w-[52px] h-[52px] rounded-full bg-yellow-400/10 -z-10"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t("Your feedback (Optional)")}</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("Share more about your experience...")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all resize-none h-32 text-sm"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg",
                  rating === 0 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                )}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {t("Submit Rating")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
