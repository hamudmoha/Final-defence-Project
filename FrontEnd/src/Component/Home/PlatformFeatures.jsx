import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { HiSearch, HiCreditCard } from "react-icons/hi";
import { HiWallet, HiBell } from "react-icons/hi2";

const features = [
  {
    id: 1,
    title: "Advanced Search & Filters",
    description:
      "Powerful search engine with dynamic filters for location, dates, price range, amenities, and real-time availability. Find your perfect camp in seconds.",
    details: [
      "Location-based search with map integration",
      "Real-time availability calendar",
      "Custom filters for amenities and facilities",
    ],
    icon: <HiSearch className="text-3xl text-green-700" />,
    bg: "bg-green-100",
    color: "text-green-700",
  },
  {
    id: 2,
    title: "Secure Payment Gateway",
    description:
      "Integrated with Chapa and Flutterwave for safe, fast transactions with instant confirmations and automated receipt generation.",
    details: [
      "Multiple payment methods supported",
      "Instant payment confirmations",
      "Automated invoicing and receipts",
    ],
    icon: <HiCreditCard className="text-3xl text-green-700" />,
    bg: "bg-green-200",
    color: "text-green-700",
  },
  {
    id: 3,
    title: "Digital Wallet System",
    description:
      "Built-in wallet for faster payments, instant refunds, and seamless transaction management. Top up and use funds anytime.",
    details: [
      "Quick wallet top-up via payment gateways",
      "Instant refund processing",
      "Complete transaction history",
    ],
    icon: <HiWallet className="text-3xl text-yellow-600" />,
    bg: "bg-yellow-100",
    color: "text-yellow-600",
  },
  {
    id: 4,
    title: "Smart Notifications",
    description:
      "Automated email and SMS alerts keep you informed about bookings, payments, check-ins, and important updates throughout your journey.",
    details: [
      "Booking confirmation alerts",
      "Check-in reminders",
      "Payment and refund notifications",
    ],
    icon: <HiBell className="text-3xl text-green-700" />,
    bg: "bg-green-100",
    color: "text-green-700",
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

const PlatformFeatures = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full py-20 bg-green-50">
      <div className="container mx-auto px-6 lg:px-16">

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t("Platform Features")}
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            {t("Discover the powerful tools and capabilities that make EthioCampGround the leading camping reservation platform in Ethiopia")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-10">
          {features.map((item, index) => (
            <motion.div
              key={item.id}
              custom={index}
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg transition"
            >
              {/* ICON */}
              <motion.div
                whileHover={{ scale: 1.15 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${item.bg}`}
              >
                {item.icon}
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-center text-gray-900">
                {t(item.title)}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mt-4 leading-relaxed text-[15px] text-left">
                {t(item.description)}
              </p>

              {/* DETAILS LIST */}
              <ul className="mt-6 space-y-3">
                {item.details.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-[15px]">
                    <span className={`text-xl leading-none ${item.color}`}>
                      ✓
                    </span>
                    <span className="text-gray-700">{t(point)}</span>
                  </li>
                ))}
              </ul>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PlatformFeatures;
