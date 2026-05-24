import React from "react";
import { useTranslation } from "react-i18next";

export const GrowingCommunity = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-[#1b3808] text-white py-20 px-6 text-center rounded-lg 
                    max-w-4xl mx-auto mb-6 animate-fadeUp">

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold">
        {t("Join Our Growing Community")}
      </h1>

      {/* Description */}
      <p className="text-lg md:text-xl mt-3 text-white/90">
        {t("Whether you're a camp owner or an adventure seeker, there's a place for you at EthioCampGround.")}
      </p>

      {/* Buttons */}
      <div className="mt-6 space-x-4 flex justify-center flex-wrap gap-4">

        <button className="bg-white text-green-800 font-semibold px-6 py-3 rounded-lg 
                           hover:bg-gray-100 transition transform hover:scale-105 
                           shadow-md">
          {t("List Your Camps")}
        </button>

        <button className="bg-[#7dad46] text-white font-semibold px-6 py-3 rounded-lg 
                           hover:bg-[#325708] transition transform hover:scale-105 
                           shadow-md">
          {t("Start Exploring")}
        </button>

      </div>
    </div>
  );
};
