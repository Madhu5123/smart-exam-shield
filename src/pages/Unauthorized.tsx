
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAddingStudent = sessionStorage.getItem("isAddingStudent") === "true";
  
  useEffect(() => {
    if (isAddingStudent) {
      toast({
        title: "Session being restored",
        description: "Please wait while we restore your teacher session...",
        duration: 3000,
      });
      
      // If we're adding a student, this was likely a temporary navigation issue
      // Let's try to redirect back to the dashboard
      const timer = setTimeout(() => {
        sessionStorage.removeItem("isAddingStudent");
        navigate("/dashboard");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAddingStudent, navigate, toast]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-examblue-50 to-examblue-100 p-4">
      <div className="text-center max-w-md">
        <Logo size="lg" className="mx-auto mb-6" />
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <ShieldOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          
          <p className="text-slate-600 mb-6">
            {isAddingStudent 
              ? "Redirecting you back to the dashboard... Please wait."
              : "Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error."}
          </p>
          
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/login">Return to Login</Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
