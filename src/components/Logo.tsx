
import React from "react";
import { Shield } from "lucide-react";

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
    <div className={`flex items-center gap-2 ${className}`}>
      <Shield className={`text-examblue-600 ${sizeClasses[size]}`} />
      {withText && (
        <span className={`font-bold ${textSizeClasses[size]} text-examblue-800`}>
          SmartExam<span className="text-examblue-500">Shield</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
