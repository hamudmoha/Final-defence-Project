import React, { useState } from "react";
import { Sidebar } from "./sidebar/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Tent, Menu, X, LogOut, ChevronDown, Settings } from "lucide-react";
import { cn } from "./ui/utils";
import { useUser } from "../context/UserContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import logo from "../assets/logo-icon.png";

export const SystemAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Derive initials from the user's name
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SA";

  const displayName = user?.fullName || "System Admin";
  const displayEmail = user?.email || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 h-16 shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logo} alt="EthioCamp Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-semibold text-lg leading-tight">EthioCampGround</h1>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
            </div>
          </div>

          {/* Language Switcher & Profile Dropdown */}
          <div className="flex items-center gap-4 relative">
            <LanguageSwitcher />
            
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{displayEmail}</p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : initials}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-500 transition-transform duration-200",
                  profileOpen ? "rotate-180" : ""
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden animate-in">
                  {/* Profile Info Section */}
                  <div className="px-4 py-3 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {user?.profilePicture ? (
                          <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          System Admin
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Settings Link */}
                  <div className="p-2 border-b border-gray-100">
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/super-admin/configuration"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-150 font-medium text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Configuration
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150 font-medium text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar sidebarOpen={sidebarOpen} />

        <main
          className={cn(
            "flex-1 transition-all duration-300 min-h-[calc(100vh-64px)]",
            sidebarOpen ? "md:ml-64" : "ml-0"
          )}
        >
          <div className="p-8 lg:p-10 pb-28 md:pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};


