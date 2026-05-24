import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loadingUser } = useUser();
  const location = useLocation();

  if (loadingUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Banned or suspended users go straight to the restricted page — no exceptions
  if ((user.status === "banned" || user.status === "suspended") && location.pathname !== "/banned") {
    return <Navigate to="/banned" replace />;
  }

  // Helper mapping function to handle variations in role names across the application
  const normalizeRoles = (rolesArray) => {
    return rolesArray.flatMap(role => {
      if (["admin", "system_admin", "super_admin"].includes(role)) {
        return ["admin", "system_admin", "super_admin"];
      }
      if (["manager", "camp_manager"].includes(role)) {
        return ["manager", "camp_manager"];
      }
      return [role];
    });
  };

  if (allowedRoles.length > 0) {
    const validRoles = normalizeRoles(allowedRoles);
    
    if (!validRoles.includes(user.role)) {
      console.warn(`User role "${user.role}" is not allowed for this route. Required one of: ${allowedRoles.join(", ")}`);
      
      // Dynamic fallback instead of hitting the landing page loop
      switch (user.role) {
        case "camper":
          return <Navigate to="/camper-dashboard" replace />;
        case "manager":
        case "camp_manager":
          return <Navigate to="/manager-dashboard/dashboard" replace />;
        case "ticket_officer":
          return <Navigate to="/ticket-dashboard" replace />;
        case "admin":
        case "system_admin":
        case "super_admin":
          return <Navigate to="/super-admin" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;