
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  CalendarCheck,
  Award,
  BookMarked,
  Timer,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";
import { motion } from "framer-motion";

interface Exam {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  startTime: string;
  endTime: string;
  instructions: string;
  randomizeQuestions: boolean;
  semester: string;
  status?: "upcoming" | "available" | "completed";
  score?: number;
  questions: any[];
  createdBy: string;
  createdAt: string;
}

interface StudentExamResult {
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  completedAt: string;
}

const StudentDashboard = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Fetch student's semester and subjects
  useEffect(() => {
    if (!currentUser) return;

    const studentRef = ref(database, `students/${currentUser.uid}`);
    
    const unsubscribe = onValue(studentRef, (snapshot) => {
      const studentData = snapshot.val();
      if (!studentData) {
        setLoading(false);
        return;
      }
      
      // Fetch exams based on student's semester and subjects
      fetchExams(studentData.semester, studentData.subjects || []);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch student's completed exams
  useEffect(() => {
    if (!currentUser) return;

    const resultsRef = ref(database, 'examResults');
    
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const studentResults: StudentExamResult[] = [];
      
      Object.keys(data).forEach((key) => {
        if (data[key].studentId === currentUser.uid) {
          studentResults.push({
            ...data[key],
            id: key
          });
        }
      });
      
      setResults(studentResults);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  const fetchExams = async (semester: string, subjects: string[]) => {
    try {
      // Get all exams
      const examsRef = ref(database, "exams");
      const snapshot = await get(examsRef);
      const data = snapshot.val();
      
      if (!data) {
        setLoading(false);
        return;
      }
      
      const now = new Date();
      const allExams: Exam[] = [];
      
      Object.keys(data).forEach((key) => {
        const exam = {
          id: key,
          ...data[key]
        };
        
        // Only include exams from the student's semester or subjects
        if (exam.semester === semester || subjects.includes(exam.subjectId)) {
          // Determine exam status
          const startTime = new Date(exam.startTime);
          const endTime = new Date(exam.endTime);
          
          // Check if exam is completed by the student
          const isCompleted = results.some(result => result.examId === exam.id);
          
          if (isCompleted) {
            exam.status = "completed";
            // Get score from results
            const result = results.find(result => result.examId === exam.id);
            if (result) {
              exam.score = (result.score / result.totalMarks) * 100;
            }
          } else if (now < startTime) {
            exam.status = "upcoming";
          } else if (now >= startTime && now <= endTime) {
            exam.status = "available";
          } else {
            // Exam time has passed without completion
            exam.status = "upcoming"; // We'll hide it for now
          }
          
          allExams.push(exam);
        }
      });
      
      setExams(allExams);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Upcoming</Badge>;
      case "available":
        return <Badge className="bg-green-500 hover:bg-green-600">Available Now</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-examblue-100 text-examblue-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Navigate to exam
  const startExam = (examId: string) => {
    // In a real application, we would navigate to the exam page
    console.log(`Starting exam: ${examId}`);
    toast({
      title: "Starting Exam",
      description: "Redirecting you to the exam page...",
    });
    // navigate(`/exam/${examId}`);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div 
        variants={item}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <Card className="border-examblue-100 shadow-sm hover:shadow transition-all duration-300 bg-gradient-to-br from-white to-examblue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-examblue-800">
              <div className="bg-examblue-100 p-2 rounded-lg text-examblue-600">
                <CalendarCheck className="h-5 w-5" />
              </div>
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-examblue-700">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                exams.filter(exam => exam.status === "upcoming").length
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Scheduled tests</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100 shadow-sm hover:shadow transition-all duration-300 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <BookOpen className="h-5 w-5" />
              </div>
              Available Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                exams.filter(exam => exam.status === "available").length
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Ready to take</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 shadow-sm hover:shadow transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                exams.filter(exam => exam.status === "completed").length
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Finished exams</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-examblue-800">Your Exams</h2>
          <Button variant="outline" className="text-examblue-600 border-examblue-200 hover:bg-examblue-50">
            View All
          </Button>
        </div>
      </motion.div>
      
      <motion.div variants={container} initial="hidden" animate="show">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                variants={item}
                className="animate-pulse"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-9 bg-slate-200 rounded w-1/4"></div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <motion.div variants={item}>
            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <BookMarked className="h-16 w-16 text-slate-300 mb-4" />
                <p className="text-slate-500 mb-2">No exams available yet</p>
                <p className="text-slate-400 text-sm max-w-md text-center">
                  When your teachers schedule exams, they will appear here. Check back soon!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <motion.div 
                key={exam.id}
                variants={item}
              >
                <Card className="transition-all duration-300 hover:shadow-md border-examblue-100 overflow-hidden h-full flex flex-col">
                  <CardHeader className="pb-2 bg-gradient-to-r from-white to-examblue-50 border-b border-examblue-50">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-examblue-800">{exam.title}</CardTitle>
                      {getStatusBadge(exam.status || "upcoming")}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Award className="h-4 w-4 text-examblue-500" />
                        <span className="font-medium">Subject:</span> {exam.subject}
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-700">
                        <Timer className="h-4 w-4 text-examblue-500" />
                        <span className="font-medium">Duration:</span> {exam.duration} minutes
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-700">
                        <TrendingUp className="h-4 w-4 text-examblue-500" />
                        <span className="font-medium">Total Marks:</span> {exam.totalMarks}
                      </div>
                      
                      {exam.startTime && exam.endTime && (
                        <div className="text-sm text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div>
                              <span className="font-medium">Schedule:</span> <br />
                              <span className="text-slate-500">
                                {formatDate(exam.startTime)} to {formatDate(exam.endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {exam.status === "completed" && exam.score !== undefined && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            Score: <span className="text-examblue-700">{exam.score.toFixed(1)}%</span>
                          </span>
                          <span className="text-xs text-slate-500">
                            {exam.score >= 70 ? "Excellent" : exam.score >= 50 ? "Good" : "Needs Improvement"}
                          </span>
                        </div>
                        <Progress value={exam.score} className="h-2" 
                          style={{
                            color: exam.score >= 70 ? "#22c55e" : exam.score >= 50 ? "#f59e0b" : "#ef4444"
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t border-slate-100 bg-slate-50/50">
                    {exam.status === "available" ? (
                      <Button 
                        onClick={() => startExam(exam.id)}
                        className="bg-gradient-to-r from-examblue-600 to-examblue-700 hover:from-examblue-700 hover:to-examblue-800 transition-all duration-300"
                      >
                        <span className="flex items-center gap-2">
                          Start Exam <ExternalLink className="h-4 w-4" />
                        </span>
                      </Button>
                    ) : exam.status === "upcoming" ? (
                      <Button variant="outline" disabled className="text-slate-500 border-slate-200">
                        Not Available Yet
                      </Button>
                    ) : (
                      <Button variant="outline" className="border-examblue-200 text-examblue-700 hover:bg-examblue-50">
                        View Results
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboard;
