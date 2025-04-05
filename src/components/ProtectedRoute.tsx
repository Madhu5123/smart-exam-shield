
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();
  
  // Check if admin is logged in via localStorage
  const isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-examblue-600"></div>
      </div>
    );
  }

  // Allow access if admin is logged in and admin role is allowed
  if (isAdminLoggedIn && allowedRoles.includes("admin")) {
    return <>{children}</>;
  }

  // For non-admin users, check Firebase auth
  if (!currentUser && !isAdminLoggedIn) {
    // Redirect to login page if not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Debug information
  console.log("CurrentUser:", currentUser);
  console.log("UserRole:", userRole);
  console.log("AllowedRoles:", allowedRoles);

  // Check if user role is allowed
  const hasAllowedRole = userRole && allowedRoles.includes(userRole);
  
  if (!hasAllowedRole && !isAdminLoggedIn) {
    // Redirect to unauthorized page if not authorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
