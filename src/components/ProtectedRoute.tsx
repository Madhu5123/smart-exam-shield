
import React, { useEffect } from "react";
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
  // Check if we're in the middle of student registration
  const isAddingStudent = sessionStorage.getItem("isAddingStudent") === "true";

  useEffect(() => {
    // Debug information
    console.log("CurrentUser:", currentUser);
    console.log("UserRole:", userRole);
    console.log("AllowedRoles:", allowedRoles);
    console.log("IsAdminLoggedIn:", isAdminLoggedIn);
    console.log("IsAddingStudent:", isAddingStudent);
    console.log("Current Path:", location.pathname);
  }, [currentUser, userRole, allowedRoles, isAdminLoggedIn, isAddingStudent, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-examblue-600"></div>
      </div>
    );
  }

  // If we're adding a student, allow access to teacher routes temporarily
  if (isAddingStudent && location.pathname.includes("/dashboard")) {
    return <>{children}</>;
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

  // Check if user role is allowed
  if (userRole && (allowedRoles.includes(userRole) || (userRole === "teacher" && allowedRoles.includes("admin")))) {
    // User has allowed role or is a teacher performing teacher actions, permit access
    return <>{children}</>;
  } else if (!isAdminLoggedIn) {
    // Only redirect to unauthorized if user is logged in but doesn't have the right role
    return <Navigate to="/unauthorized" replace />;
  }

  // Default fallback - should not reach here with proper logic
  return <>{children}</>;
};

export default ProtectedRoute;
