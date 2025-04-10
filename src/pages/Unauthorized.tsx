
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-examblue-50 to-examblue-100 p-4">
      <div className="text-center max-w-md w-full">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Logo size="lg" className="mx-auto mb-8" />
        </motion.div>
        
        <motion.div 
          className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-examblue-100"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            className="flex justify-center"
          >
            <div className="bg-red-50 p-4 rounded-full mb-5">
              <ShieldOff className="h-16 w-16 text-red-500" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-2xl font-bold text-red-600 mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Access Denied
          </motion.h1>
          
          <motion.p 
            className="text-slate-600 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </motion.p>
          
          <motion.div 
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Button asChild className="gap-2 w-full sm:w-auto bg-examblue-600 hover:bg-examblue-700">
              <Link to="/login">
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
              <Link to="/">
                <Home className="w-4 h-4" />
                Go to Home
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Unauthorized;
