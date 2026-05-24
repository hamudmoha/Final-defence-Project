import React from "react";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";
import dawit from "../../assets/Dawit.png"

const Testimonials = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-white">
      {/* Section Title */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900">{t("What Campers Say")}</h2>
        <p className="text-gray-500 mt-3 text-lg">
          {t("Real experiences from our community")}
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-6">

        {/* Card 1 */}
        <div className="bg-gray-50 p-8 rounded-2xl shadow-sm">
          <div className="flex gap-1 text-yellow-400 text-xl mb-4">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} />
            ))}
          </div>

          <p className="text-gray-700 italic leading-relaxed mb-8">
            "{t("The booking process was incredibly smooth. The wallet system made payments so convenient, and the camp exceeded all expectations!")}"
          </p>

          <div className="flex items-center gap-4">
            <img
              src="https://i.pravatar.cc/80?img=32"
              alt="Sarah Mitchell"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{t("Sarah Mitchell")}</h4>
              <p className="text-gray-500 text-sm">{t("Adventure Enthusiast")}</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-gray-50 p-8 rounded-2xl shadow-sm">
          <div className="flex gap-1 text-yellow-400 text-xl mb-4">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} />
            ))}
          </div>

          <p className="text-gray-700 italic leading-relaxed mb-8">
            "{t("Best camping platform in Ethiopia! The search filters helped me find exactly what I needed, and customer support was excellent.")}"
          </p>

          <div className="flex items-center gap-4">
            <img
              src={dawit}
              alt="Dawit Kebede"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{t("Dawit Kebede")}</h4>
              <p className="text-gray-500 text-sm">{t("Nature Photographer")}</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-gray-50 p-8 rounded-2xl shadow-sm">
          <div className="flex gap-1 text-yellow-400 text-xl mb-4">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} />
            ))}
          </div>

          <p className="text-gray-700 italic leading-relaxed mb-8">
            "{t("The notification system kept me updated throughout my trip. Instant payment confirmations gave me confidence in the platform.")}"
          </p>

          <div className="flex items-center gap-4">
            <img
              src="https://i.pravatar.cc/80?img=47"
              alt="Emily Chen"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{t("Emily Chen")}</h4>
              <p className="text-gray-500 text-sm">{t("Travel Blogger")}</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
