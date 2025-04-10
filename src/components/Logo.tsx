
import React from "react";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = "md", 
  withText = true,
  className = ""
}) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <motion.div 
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        whileHover={{ rotate: 15, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Shield className={`text-examblue-600 ${sizeClasses[size]}`} />
      </motion.div>
      {withText && (
        <motion.span 
          className={`font-bold ${textSizeClasses[size]} text-examblue-800`}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          SmartExam<span className="text-examblue-500">Portal</span>
        </motion.span>
      )}
    </motion.div>
  );
};

export default Logo;
