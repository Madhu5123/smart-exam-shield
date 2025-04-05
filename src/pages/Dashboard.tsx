
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import Logo from "@/components/Logo";

// Import role-specific dashboards
import AdminDashboard from "./dashboards/AdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";

const Dashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Render the appropriate dashboard based on user role
  const renderRoleDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "student":
        return <StudentDashboard />;
      default:
        return (
          <div className="text-center p-8">
            <p>Role not recognized. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          
          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <p className="font-medium">{currentUser?.displayName}</p>
              <p className="text-sm text-slate-500 capitalize">{userRole}</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">
              Welcome, {currentUser?.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              {userRole === "admin" && "Manage teachers and monitor the examination portal."}
              {userRole === "teacher" && "Manage students, create exams, and monitor student performance."}
              {userRole === "student" && "View and take your assigned exams."}
            </p>
          </CardContent>
        </Card>

        {/* Role-specific dashboard */}
        {renderRoleDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;
