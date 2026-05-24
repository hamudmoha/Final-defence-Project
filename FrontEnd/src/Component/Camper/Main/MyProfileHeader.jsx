import React from "react";
import { FiSave } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";

const MyProfileHeader = ({ onSave, loading, user }) => {
  const { user: contextUser } = useUser();
  const displayName = contextUser?.firstName || "User";

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 py-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {displayName}'s Profile
          </h1>
          <p className="text-sm text-gray-500">
            Manage your personal information and security settings
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onSave}
            disabled={loading}
            className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-md hover:shadow-lg ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiSave size={18} />
            )}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfileHeader;
