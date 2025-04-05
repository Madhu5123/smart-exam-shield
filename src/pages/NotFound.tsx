
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Logo from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-examblue-50 to-examblue-100 p-4">
      <div className="text-center max-w-md">
        <Logo size="lg" className="mx-auto mb-6" />
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-7xl font-bold text-examblue-800 mb-2">404</h1>
          <p className="text-xl text-examblue-600 mb-6">Oops! Page not found</p>
          <p className="text-slate-600 mb-8">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full bg-examblue-600 hover:bg-examblue-700">
              <Link to="/">Return to Home</Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
