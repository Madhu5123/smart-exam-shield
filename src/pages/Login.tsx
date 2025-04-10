import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, MailIcon, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check for admin credentials
      if (email === "admin@examportal.com" && password === "adminexamportal") {
        // Hard-coded admin login without using Firebase authentication
        toast({
          title: "Admin login successful",
          description: "Welcome to the Examination Portal",
        });
        
        // Store admin info in localStorage to persist login state
        localStorage.setItem("adminLoggedIn", "true");
        
        // Redirect to admin dashboard
        navigate("/dashboard");
        return;
      }
      
      // For non-admin users, use Firebase authentication
      await login(email, password);
      
      // Successful login
      toast({
        title: "Login successful",
        description: "Welcome to the Examination Portal",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-examblue-50 via-examblue-100 to-examblue-200 p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <motion.div 
          className="mb-10 text-center flex flex-col items-center"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Logo size="lg" />
          <motion.p 
            className="mt-3 text-examblue-700 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Where Excellence Meets Education
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full"
        >
          <Card className="w-full shadow-lg border-examblue-100 backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-examblue-800">
                Sign In
              </CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-examblue-700">Email or Registration Number</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-examblue-400">
                      <MailIcon className="h-5 w-5" />
                    </div>
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-examblue-200 focus:border-examblue-400 transition-all duration-300"
                      placeholder="email@example.com or REG2025001"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Students can login with their registration number
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-examblue-700">Password</Label>
                    <Link to="/login" className="text-xs text-examblue-600 hover:text-examblue-800 hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-examblue-400">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-examblue-200 focus:border-examblue-400 transition-all duration-300"
                      placeholder="Your password"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-examblue-600 to-examblue-700 hover:from-examblue-700 hover:to-examblue-800 transition-all duration-300 py-6"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-center text-sm text-gray-500">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span>Demo Admin: </span>
                  <span className="font-medium text-examblue-600">admin@examportal.com / adminexamportal</span>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="mt-8 text-center text-examblue-600 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        &copy; {new Date().getFullYear()} SmartExamPortal. All rights reserved.
      </motion.div>
    </div>
  );
};

export default Login;
