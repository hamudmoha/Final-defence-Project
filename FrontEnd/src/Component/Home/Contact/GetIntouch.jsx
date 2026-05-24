import { FaPhoneAlt } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function GetInTouch() {
  return (
    <div className="w-full py-20 bg-white">

      {/* Title */}
      <h2 className="text-center text-4xl md:text-5xl font-extrabold text-gray-900">
        Get In Touch
      </h2>
      <p className="text-center text-gray-600 text-lg md:text-xl mt-4 px-4">
        Have questions? We'd love to hear from you. Send us a message and we'll
        respond as soon as possible.
      </p>

      {/* Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 px-6">

        {/* Phone Card */}
        <div className="bg-gradient-to-br from-[#182b01] to-green-700 text-white p-10 rounded-3xl shadow-lg flex flex-col items-center 
                        animate-[fadeInUp_0.8s_ease]">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <FaPhoneAlt className="text-white text-3xl" />
          </div>

          <h3 className="text-2xl font-bold mb-2">Phone</h3>
          <p className="text-white/90">Mon–Fri 8am–6pm EAT</p>
          <p className="text-xl font-semibold mt-4">+251 11 123 4567</p>
        </div>

        {/* Email Card */}
        <div className="bg-gradient-to-br from-[#9bd356] to-[#7bc63c] text-white p-10 rounded-3xl shadow-lg flex flex-col items-center 
                        animate-[fadeInUp_1s_ease]">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <FaEnvelope className="text-white text-3xl" />
          </div>

          <h3 className="text-2xl font-bold mb-2">Email</h3>
          <p className="text-white/90">We’ll respond within 24hrs</p>
          <p className="text-xl font-semibold mt-4">info@ethiopcamp.com</p>
        </div>

        {/* Office Card */}
        <div className="bg-gradient-to-br from-[#f1bb09e0] to-orange-500 text-white p-10 rounded-3xl shadow-lg flex flex-col items-center 
                        animate-[fadeInUp_1.2s_ease]">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <FaMapMarkerAlt className="text-white text-3xl" />
          </div>

          <h3 className="text-2xl font-bold mb-2">Office</h3>
          <p className="text-white/90">Visit us at our HQ</p>
          <p className="text-xl font-semibold mt-4">
            Bole, Addis Ababa
          </p>
        </div>

      </div>
    </div>
  );
}
