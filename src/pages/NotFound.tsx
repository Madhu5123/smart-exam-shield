
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-examblue-50 via-examblue-100 to-examblue-200 p-4">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="lg" className="mx-auto mb-6" />
        </motion.div>
        
        <motion.div 
          className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-examblue-100"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div 
            className="mx-auto w-20 h-20 bg-examblue-50 rounded-full flex items-center justify-center mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <FileQuestion className="w-10 h-10 text-examblue-600" />
          </motion.div>
          
          <motion.h1 
            className="text-7xl font-bold text-examblue-800 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            404
          </motion.h1>
          
          <motion.p 
            className="text-xl text-examblue-600 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Page not found
          </motion.p>
          
          <motion.p 
            className="text-slate-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            The page you are looking for doesn't exist or has been moved.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <Button asChild className="gap-2 bg-examblue-600 hover:bg-examblue-700 transition-all duration-300">
              <Link to="/">
                <Home className="w-4 h-4" />
                Return to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="gap-2 border-examblue-200 hover:bg-examblue-50 transition-all duration-300">
              <Link to="/login">
                <ArrowLeft className="w-4 h-4" />
                Go to Login
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
