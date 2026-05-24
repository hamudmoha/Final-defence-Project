import React, { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import contactImage from "../../../assets/Contact-image.png";

export default function ContactFormSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading("Sending message...");

    try {
      const res = await api.post(
        "/contact",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res?.data;

      if (data?.success) {
        toast.success(data.message || "Message sent successfully!", { id: loadingToast });
        setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "General Inquiry", message: "" });
      } else {
        toast.error(data?.message || "Something went wrong. Try again.", { id: loadingToast });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Server error. Please try again later.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white py-20 px-6">
      <h2 className="text-center text-4xl md:text-5xl font-extrabold text-gray-900 mb-16">Send Us a Message</h2>

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <img src={contactImage} alt="Office Building" className="rounded-2xl shadow-xl w-full object-cover" />
        </div>

        <div className="bg-gray-50 p-10 rounded-2xl shadow-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-700 focus:outline-none" required />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-700 focus:outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-700 focus:outline-none" required />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251 912 345 678" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-700 focus:outline-none" />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Subject</label>
              <select name="subject" value={formData.subject} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-700 focus:outline-none">
                <option>General Inquiry</option>
                <option>Booking Support</option>
                <option>Camp Partnership</option>
                <option>Technical Issue</option>
                <option>Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Tell us how we can help you..." className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-700 focus:outline-none" required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-800 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-900 transition">{loading ? "Sending..." : "Send Message"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
