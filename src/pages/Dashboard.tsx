
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LogOut, 
  User, 
  Bell, 
  Settings, 
  HelpCircle,
  Calendar,
  BookOpen,
  LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

// Import role-specific dashboards
import AdminDashboard from "./dashboards/AdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";

const Dashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Check if admin is logged in via localStorage
  const isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

  useEffect(() => {
    if (!currentUser && !isAdminLoggedIn) {
      navigate("/login");
    }
  }, [currentUser, isAdminLoggedIn, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Determine which dashboard to render and which user info to display
  const renderRoleDashboard = () => {
    if (isAdminLoggedIn) {
      return <AdminDashboard />;
    }
    
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
  
  // Get the user display name
  const displayName = isAdminLoggedIn ? "Administrator" : currentUser?.displayName;
  
  // Get the user role for display
  const displayRole = isAdminLoggedIn ? "admin" : userRole;

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-examblue-50 to-white">
      {/* Header */}
      <motion.header 
        className="bg-white border-b border-examblue-100 sticky top-0 z-10 shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo />
          
          <div className="flex items-center gap-4">
            <motion.div
              className="hidden md:flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-examblue-700 hover:text-examblue-800 hover:bg-examblue-100"
              >
                <Bell className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-examblue-700 hover:text-examblue-800 hover:bg-examblue-100"
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-examblue-700 hover:text-examblue-800 hover:bg-examblue-100"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="hidden sm:block text-right">
                <p className="font-medium text-examblue-800">{displayName}</p>
                <p className="text-sm text-examblue-600 capitalize">{displayRole}</p>
              </div>
              
              <div className="flex gap-2 items-center">
                <div className="bg-examblue-100 h-10 w-10 rounded-full flex items-center justify-center text-examblue-700">
                  <User className="h-5 w-5" />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1 border-examblue-200 text-examblue-700 hover:bg-examblue-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleLogout}
                  className="sm:hidden text-examblue-700 border-examblue-200 hover:bg-examblue-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Desktop Layout with Sidebar and Main Content */}
      <div className="container mx-auto flex flex-col md:flex-row gap-5 px-4 py-5">
        {/* Sidebar - visible on medium and larger screens */}
        <motion.div 
          className="hidden md:block w-64 shrink-0"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-white rounded-xl shadow-sm border border-examblue-100 p-4 sticky top-20">
            <motion.div 
              className="space-y-1"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={item}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-examblue-700 hover:text-examblue-800 hover:bg-examblue-50">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Button>
              </motion.div>
              
              <motion.div variants={item}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-examblue-700 hover:text-examblue-800 hover:bg-examblue-50">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </Button>
              </motion.div>
              
              <motion.div variants={item}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-examblue-700 hover:text-examblue-800 hover:bg-examblue-50">
                  <BookOpen className="h-5 w-5" />
                  Exams
                </Button>
              </motion.div>
              
              <motion.div variants={item}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-examblue-700 hover:text-examblue-800 hover:bg-examblue-50">
                  <User className="h-5 w-5" />
                  Profile
                </Button>
              </motion.div>
              
              <motion.div variants={item}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-examblue-700 hover:text-examblue-800 hover:bg-examblue-50">
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.main 
          className="flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="mb-6 border-examblue-100 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl text-examblue-800 flex items-center gap-2">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <LayoutDashboard className="h-6 w-6 text-examblue-600" />
                  </motion.div>
                  Welcome, {displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  {isAdminLoggedIn && "Manage teachers and monitor the examination portal. Track student progress and system performance."}
                  {userRole === "admin" && "Manage teachers and monitor the examination portal. Track student progress and system performance."}
                  {userRole === "teacher" && "Manage students, create exams, and monitor student performance. Review statistics and grades."}
                  {userRole === "student" && "View and take your assigned exams. Track your performance and upcoming exam schedule."}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role-specific dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {renderRoleDashboard()}
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default Dashboard;
