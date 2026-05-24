import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import api from "../services/api";
import i18n from "../i18n";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    // Safety Guard: If there is no token, don't parse old user data from storage
    if (!token) {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      return null;
    }

    try {
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && parsed.languagePreference && i18n.language !== parsed.languagePreference) {
        i18n.changeLanguage(parsed.languagePreference);
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [loadingUser, setLoadingUser] = useState(!user); // Optimize: No loading spinner if local storage already has valid user metadata
  const [fetchError, setFetchError] = useState(null);
  const fetchingRef = useRef(false);

  const fetchUser = async () => {
    // Guard: only one fetch at a time
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      setFetchError(null);
      fetchingRef.current = false;
      return;
    }

    try {
      setFetchError(null);
      const res = await api.get("/auth/profile", { timeout: 10000 });

      const profile = res.data?.data || res.data?.user || null;
      if (profile) {
        // Normalize for consistent frontend use
        const normalized = {
          ...profile,
          name: profile.fullName || profile.name || profile.email,
          profilePicture: profile.profilePicture || profile.profileImage || profile.photo || null
        };

        setUser(normalized);
        localStorage.setItem("user", JSON.stringify(normalized));
        localStorage.setItem("role", normalized.role || "");

        if (normalized.languagePreference && i18n.language !== normalized.languagePreference) {
          i18n.changeLanguage(normalized.languagePreference);
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    } catch (err) {
      console.error("User fetch failed", err);
      setFetchError(err.message);

      // Crucial Fix: Only clear user state if the token is completely invalid (401/403)
      // Otherwise, don't drop the active session state if it's just a temporary 500 server lag or internet dropout.
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("refreshToken");
      }
    } finally {
      setLoadingUser(false);
      fetchingRef.current = false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("pendingRedirect");
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loadingUser,
        refreshUser: fetchUser,
        fetchError,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};