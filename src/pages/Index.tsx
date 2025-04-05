
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { ShieldCheck, Users, Award, Lock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Logo size="md" />
          
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="bg-examblue-600 hover:bg-examblue-700">
              <Link to="/admin-register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-examblue-50 to-examblue-100">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-examblue-800 mb-4 leading-tight">
              Secure Online Examination Platform
            </h1>
            <p className="text-lg text-examblue-600 mb-8 max-w-lg">
              SmartExamShield provides a secure, monitored environment for conducting online exams with advanced proctoring features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-examblue-600 hover:bg-examblue-700">
                <Link to="/admin-register">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-4 -left-4 w-full h-full bg-examblue-300 rounded-lg"></div>
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-examblue-500 rounded-lg"></div>
              <div className="relative bg-white p-6 rounded-lg shadow-lg z-10">
                <div className="aspect-video bg-examblue-50 rounded-md flex items-center justify-center">
                  <ShieldCheck className="h-24 w-24 text-examblue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-examblue-100 text-examblue-600 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Proctoring</h3>
              <p className="text-slate-600">
                AI-powered face detection technology to prevent cheating and ensure exam integrity.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-examblue-100 text-examblue-600 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
              <p className="text-slate-600">
                Separate dashboards for administrators, teachers, and students with appropriate permissions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-examblue-100 text-examblue-600 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
              <p className="text-slate-600">
                Comprehensive analytics and reports to track student performance and identify areas for improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-examblue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of institutions that trust SmartExamShield for secure and reliable online examinations.
          </p>
          <Button asChild size="lg" className="bg-examblue-600 hover:bg-examblue-700">
            <Link to="/admin-register">Register Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-examblue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <Logo size="md" className="text-white" />
              <p className="mt-4 max-w-xs text-examblue-100">
                Secure, reliable, and user-friendly examination platform for educational institutions.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Security</a></li>
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-examblue-200 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-examblue-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-examblue-300">© 2025 SmartExamShield. All rights reserved.</p>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-examblue-300 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>

              <a href="#" className="text-examblue-300 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
