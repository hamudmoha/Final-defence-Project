import React from "react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-green-50">
      {/* Title */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900">{t("How It Works")}</h2>
        <p className="text-gray-600 mt-3 text-lg">
          {t("Book your perfect camping experience in three simple steps")}
        </p>
      </div>

      {/* Steps Container */}
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-16 text-center">

        {/* Step 1 */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green-800 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            1
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">
            {t("Search & Discover")}
          </h3>
          <p className="text-gray-600 mt-4 max-w-xs">
            {t("Use our advanced filters to find camps that match your preferences, budget, and desired location.")}
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            2
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">
            {t("Book & Pay")}
          </h3>
          <p className="text-gray-600 mt-4 max-w-xs">
            {t("Select your dates, complete secure payment through our integrated gateways, and receive instant confirmation.")}
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-orange-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            3
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">
            {t("Enjoy Your Stay")}
          </h3>
          <p className="text-gray-600 mt-4 max-w-xs">
            {t("Arrive at your camp, check in seamlessly, and enjoy your adventure with peace of mind.")}
          </p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
