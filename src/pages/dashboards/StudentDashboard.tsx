
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  CalendarCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";

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
        return <Badge variant="outline" className="bg-slate-100">Upcoming</Badge>;
      case "available":
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-examblue-600" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                exams.filter(exam => exam.status === "upcoming").length
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Available Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                exams.filter(exam => exam.status === "available").length
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-slate-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                exams.filter(exam => exam.status === "completed").length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8">Your Exams</h2>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
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
          ))}
        </div>
      ) : exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No exams available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{exam.title}</CardTitle>
                  {getStatusBadge(exam.status || "upcoming")}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-slate-500 mb-2">
                  Subject: {exam.subject}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{exam.duration} minutes</span>
                </div>
                
                {exam.startTime && exam.endTime && (
                  <p className="text-sm text-slate-500 mb-3">
                    Scheduled: {formatDate(exam.startTime)} to {formatDate(exam.endTime)}
                  </p>
                )}
                
                {exam.status === "completed" && exam.score !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Score: {exam.score.toFixed(1)}%</span>
                    </div>
                    <Progress value={exam.score} />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {exam.status === "available" ? (
                  <Button 
                    onClick={() => startExam(exam.id)}
                    className="bg-examblue-600 hover:bg-examblue-700"
                  >
                    Start Exam
                  </Button>
                ) : exam.status === "upcoming" ? (
                  <Button variant="outline" disabled>
                    Not Available Yet
                  </Button>
                ) : (
                  <Button variant="outline">
                    View Results
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
