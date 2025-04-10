
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft, Home, AlertTriangle } from "lucide-react";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

const Unauthorized = () => {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-examblue-50 via-examblue-100 to-examblue-200 p-4">
      <motion.div 
        className="text-center max-w-lg w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Logo size="lg" className="mx-auto mb-8" />
        </motion.div>
        
        <motion.div 
          className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-examblue-100"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          variants={container}
        >
          <motion.div
            className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20, 
              delay: 0.5 
            }}
          >
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </motion.div>
          
          <motion.h1 
            className="text-2xl font-bold text-red-600 mb-3"
            variants={item}
          >
            Access Denied
          </motion.h1>
          
          <motion.p 
            className="text-slate-600 mb-6"
            variants={item}
          >
            Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </motion.p>
          
          <motion.div 
            className="relative py-5 px-4 mb-6 bg-amber-50 border-l-4 border-amber-400 rounded"
            variants={item}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldOff className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 text-left">
                  Your current role doesn't have the necessary permissions to view this resource. Please use an account with appropriate access rights.
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            variants={item}
          >
            <Button asChild className="gap-2 w-full sm:w-auto bg-examblue-600 hover:bg-examblue-700 transition-all duration-300">
              <Link to="/login">
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="gap-2 w-full sm:w-auto border-examblue-200 hover:bg-examblue-50 transition-all duration-300">
              <Link to="/">
                <Home className="w-4 h-4" />
                Go to Home
              </Link>
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.p 
          className="text-examblue-700 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          &copy; {new Date().getFullYear()} SmartExamPortal. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
