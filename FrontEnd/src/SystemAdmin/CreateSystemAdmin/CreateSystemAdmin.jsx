import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserShield, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { createSystemAdmin } from "../services/admin.service";

export default function CreateSystemAdmin() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const closeModal = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (!form.email.trim() && !form.password.trim()) {
      setError("Either email or password is required");
      return;
    }

    try {
      setLoading(true);
      const res = await createSystemAdmin({
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        password: form.password.trim() || undefined,
      });

      setSuccess(res.data);
      setForm({ fullName: "", email: "", password: "" });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create system admin"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ AUTO REDIRECT AFTER SUCCESS
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/super-admin/users");
      }, 1500); // 1.5 seconds delay

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="absolute top-4 right-4 rounded-md p-1 text-gray-400
                         hover:text-gray-600 hover:bg-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaTimes size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FaUserShield className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Create System Admin
                </h2>
                <p className="text-sm text-gray-500">
                  Full name and either email or password are required
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <p className="font-semibold">✅ System Admin Created</p>
                <p className="text-xs mt-1 text-green-600">
                  Redirecting to users dashboard...
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email (optional)
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Password (optional)
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <button
                disabled={loading}
                className={`w-full rounded-lg py-2.5 font-semibold text-white
                  ${loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                  }`}
              >
                {loading ? "Creating..." : "Create System Admin"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
