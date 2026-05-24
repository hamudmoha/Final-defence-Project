import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ChangePassword = () => {
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength(form.newPassword);
  const strengthText =
    strength <= 1 ? "Weak" : strength === 2 ? "Medium" : "Strong";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const canSubmit =
    form.currentPassword &&
    form.newPassword &&
    form.newPassword === form.confirmPassword &&
    strength >= 2;

  const handleSubmit = () => {
    // 🔗 API CALL HERE
    console.log("Password updated", form);
  };

  return (
    <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl p-8">

      {/* Current Password */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <div className="relative">
          <input
            type={show.current ? "text" : "password"}
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <button
            type="button"
            onClick={() =>
              setShow({ ...show, current: !show.current })
            }
            className="absolute right-3 top-3 text-gray-400"
          >
            {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* New + Confirm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={show.new ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <button
              type="button"
              onClick={() => setShow({ ...show, new: !show.new })}
              className="absolute right-3 top-3 text-gray-400"
            >
              {show.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={show.confirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setShow({ ...show, confirm: !show.confirm })
              }
              className="absolute right-3 top-3 text-gray-400"
            >
              {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Strength Meter */}
      <div className="mt-6">
        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                strength >= i
                  ? strength <= 2
                    ? "bg-yellow-500"
                    : "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">
          Password strength:{" "}
          <span className="font-medium">{strengthText}</span>
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end mt-8">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`px-6 py-3 rounded-xl font-semibold text-white transition
            ${
              canSubmit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }
          `}
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
