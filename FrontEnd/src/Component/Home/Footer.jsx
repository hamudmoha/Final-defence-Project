import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Logo from "../../assets/EthioCampGround footer.png"

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-slate-950 text-slate-300 py-24 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">

          {/* BRAND */}
          <div className="space-y-8">
            <Link to="/" className="inline-block">
              <img src={Logo} alt="EthioCampGround" className="h-20 w-auto object-contain brightness-0 invert" />
            </Link>

            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              {t("EthioCamp is the premier digital gateway to Ethiopia's majestic outdoors. We connect adventurers with the heart of nature.")}
            </p>

            <div className="flex gap-4">
              {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  whileHover={{ y: -5, color: '#10b981' }}
                  href="#"
                  className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-xl transition-colors border border-slate-800"
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-8">{t("Adventure")}</h3>
            <ul className="space-y-4">
              {['Home', 'Explore Camps', 'About Our Mission', 'Safety Guidelines', 'Community'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                    {t(item)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-8">{t("Resources")}</h3>
            <ul className="space-y-4">
              {['Help Center', 'Terms of Service', 'Privacy Policy', 'Manager Portal', 'Partner with Us'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                    {t(item)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-8">{t("Get In Touch")}</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-500 border border-slate-800 shrink-0">
                  <HiOutlineMail className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-1">{t("Email Support")}</p>
                  <p className="text-white font-bold">hello@ethiocamp.com</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-500 border border-slate-800 shrink-0">
                  <HiOutlinePhone className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-1">{t("Phone Line")}</p>
                  <p className="text-white font-bold">+251 911 123 456</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-500 border border-slate-800 shrink-0">
                  <HiOutlineLocationMarker className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-1">{t("HQ Address")}</p>
                  <p className="text-white font-bold">Bole, Addis Ababa, ET</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 font-bold text-sm">
            © {new Date().getFullYear()} {t("EthioCampGround. Engineered by System Owners.")}
          </p>
          <div className="flex gap-8 text-sm font-black uppercase tracking-tighter text-slate-500">
            <Link to="/" className="hover:text-white transition-colors">{t("Privacy")}</Link>
            <Link to="/" className="hover:text-white transition-colors">{t("Terms")}</Link>
            <Link to="/" className="hover:text-white transition-colors">{t("Cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
