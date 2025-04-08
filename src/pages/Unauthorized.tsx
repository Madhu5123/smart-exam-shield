
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";
import Logo from "@/components/Logo";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-examblue-50 to-examblue-100 p-4">
      <div className="text-center max-w-md">
        <Logo size="lg" className="mx-auto mb-6" />
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <ShieldOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          
          <p className="text-slate-600 mb-6">
            Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error.
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
