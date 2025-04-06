
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  CheckCircle,
  CalendarCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { ref, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  status: "upcoming" | "available" | "completed";
  score?: number;
  totalQuestions: number;
  startTime?: string;
  endTime?: string;
  branch?: string;
  semester?: string;
  createdBy?: string;
}

const StudentDashboard = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch exams data from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchStudentInfo = async () => {
      try {
        // First get student's branch and semester
        const studentRef = ref(database, `students/${currentUser.uid}`);
        const studentSnapshot = await get(studentRef);
        
        if (!studentSnapshot.exists()) {
          console.error("Student data not found");
          setLoading(false);
          return;
        }
        
        const studentData = studentSnapshot.val();
        const studentBranch = studentData.branch || "";
        const studentSemester = studentData.semester || "";
        
        // Then fetch all exams
        const examsRef = ref(database, "exams");
        const unsubscribe = onValue(examsRef, (snapshot) => {
          const data = snapshot.val();
          const examsList: Exam[] = [];
          
          if (data) {
            Object.keys(data).forEach((key) => {
              const exam = data[key];
              // Only include exams for this student's branch and semester
              if ((exam.branch === studentBranch || !exam.branch) && 
                  (exam.semester === studentSemester || !exam.semester)) {
                
                // Determine exam status
                let status: "upcoming" | "available" | "completed" = "upcoming";
                const now = new Date();
                const startTime = exam.startTime ? new Date(exam.startTime) : null;
                const endTime = exam.endTime ? new Date(exam.endTime) : null;
                
                if (startTime && endTime) {
                  if (now < startTime) {
                    status = "upcoming";
                  } else if (now >= startTime && now <= endTime) {
                    status = "available";
                  } else {
                    status = "completed";
                  }
                }
                
                // Check if student has already completed this exam
                let score = undefined;
                if (exam.results && exam.results[currentUser.uid]) {
                  status = "completed";
                  score = exam.results[currentUser.uid].score;
                }
                
                examsList.push({
                  id: key,
                  title: exam.title,
                  subject: exam.subject,
                  duration: exam.duration,
                  status: status,
                  totalQuestions: exam.questions ? Object.keys(exam.questions).length : 0,
                  startTime: exam.startTime,
                  endTime: exam.endTime,
                  branch: exam.branch,
                  semester: exam.semester,
                  score: score,
                  createdBy: exam.createdBy
                });
              }
            });
          }
          
          setExams(examsList);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching exams:", error);
        setLoading(false);
      }
    };
    
    fetchStudentInfo();
  }, [currentUser]);

  // Helper function to format date
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
    navigate(`/exam/${examId}`);
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
                  {getStatusBadge(exam.status)}
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
                      <span className="text-sm font-medium">Score: {exam.score}%</span>
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
