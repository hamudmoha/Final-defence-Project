import React from "react";
import { useTranslation } from "react-i18next";
import { HiSearch, HiCreditCard } from "react-icons/hi";
import { HiWallet, HiBell, HiClock, HiShieldCheck  } from "react-icons/hi2";

const features = [
  {
    id: 1,
    title: "Advanced Search",
    description:
      "Find camps with powerful filters including location, price range, amenities, and real-time availability status.",
    icon: (
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
        <HiSearch className="text-3xl text-green-700" />
      </div>
    ),
  },
  {
    id: 2,
    title: "Secure Payments",
    description:
      "Integrated with Chapa and Flutterwave for safe transactions, instant confirmations, and automated receipts.",
    icon: (
      <div className="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center">
        <HiCreditCard className="text-3xl text-green-700" />
      </div>
    ),
  },
  {
    id: 3,
    title: "Digital Wallet",
    description:
      "Built-in wallet system for faster payments, instant refunds, and seamless transaction management.",
    icon: (
      <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
        <HiWallet className="text-3xl text-yellow-600" />
      </div>
    ),
  },
  {
    id: 4,
    title: "Smart Notifications",
    description:
      "Automated email and SMS alerts for bookings, payments, check-ins, and important updates.",
    icon: (
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
        <HiBell className="text-3xl text-green-700" />
      </div>
    ),
  },
  {
    id: 5,
    title: "Real-time Booking",
    description:
      "Instant reservation confirmations with live availability calendar to prevent overbooking.",
    icon: (
      <div className="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center">
        <HiClock className="text-3xl text-green-700" />
      </div>
    ),
  },
  {
    id: 6,
    title: "Trust & Safety",
    description:
      "Comprehensive reporting system and user verification for a secure camping community.",
    icon: (
      <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
        <HiShieldCheck className="text-3xl text-yellow-600" />
      </div>
    ),
  },

];


const WhyChoose = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full py-20 bg-green-50">
      <div className="container mx-auto px-6 lg:px-16">

        {/* Title Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t("Why Choose EthioCampGround?")}
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            {t("Experience seamless booking with advanced features")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((item) => (
            <div
              key={item.id}
              className="bg-white p-8 rounded-3xl shadow-sm  hover:shadow-lg transition"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-6"
                   style={{ backgroundColor: item.bg }}>
                {item.icon}
              </div>

              <h3 className="text-xl font-semibold text-center text-gray-900">
                {t(item.title)}
              </h3>

              <p className="text-gray-600 text-center mt-3">
                {t(item.description)}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChoose;
