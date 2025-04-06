
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { AlertCircle, ArrowLeft, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
}

interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  startTime: string;
  endTime: string;
  questions: Record<string, Question>;
  termsAndConditions: string;
}

const Exam = () => {
  const { examId } = useParams<{ examId: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [confirmEndExam, setConfirmEndExam] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  const questionIds: string[] = exam ? Object.keys(exam.questions) : [];

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      if (!examId || !currentUser) return;
      
      try {
        const examRef = ref(database, `exams/${examId}`);
        const snapshot = await get(examRef);
        
        if (!snapshot.exists()) {
          toast({
            title: "Exam not found",
            description: "The exam you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        const examData = snapshot.val();
        setExam({
          id: examId,
          ...examData,
        });
        
        // Check if exam is available
        const now = new Date();
        const startTime = new Date(examData.startTime);
        const endTime = new Date(examData.endTime);
        
        if (now < startTime) {
          toast({
            title: "Exam not started yet",
            description: `This exam will be available from ${startTime.toLocaleString()}.`,
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        if (now > endTime) {
          toast({
            title: "Exam ended",
            description: `This exam ended on ${endTime.toLocaleString()}.`,
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        // Check if student already took this exam
        if (examData.results && examData.results[currentUser.uid]) {
          toast({
            title: "Exam already completed",
            description: "You have already taken this exam.",
          });
          
          // Show results
          setScore(examData.results[currentUser.uid].score);
          setShowResults(true);
          setExamEnded(true);
          setShowTerms(false);
          
          // Load student's answers
          setAnswers(examData.results[currentUser.uid].answers || {});
        }
        
        // Set timer
        setTimeLeft(examData.duration * 60);
        
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast({
          title: "Error",
          description: "Failed to load exam. Please try again.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExam();
  }, [examId, currentUser, toast, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || examEnded || !exam) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [examStarted, examEnded, exam]);

  const startExam = () => {
    setShowTerms(false);
    setExamStarted(true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${secs}s`;
  };

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questionIds.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    if (!exam) return 0;
    
    let correctAnswers = 0;
    
    questionIds.forEach((questionId) => {
      if (answers[questionId] === exam.questions[questionId].correctAnswer) {
        correctAnswers++;
      }
    });
    
    return Math.round((correctAnswers / questionIds.length) * 100);
  };

  const endExam = async () => {
    if (!exam || !currentUser) return;
    
    const finalScore = calculateScore();
    setScore(finalScore);
    
    // Save results to Firebase
    try {
      await set(ref(database, `exams/${exam.id}/results/${currentUser.uid}`), {
        score: finalScore,
        answers,
        completedAt: new Date().toISOString(),
      });
      
      setExamEnded(true);
      setShowResults(true);
      
      toast({
        title: "Exam completed",
        description: `Your score: ${finalScore}%`,
      });
    } catch (error) {
      console.error("Error saving exam results:", error);
      toast({
        title: "Error",
        description: "Failed to save your results. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-examblue-600"></div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Exam Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-xl font-bold">Exam Completed!</h2>
              <p className="text-gray-500">{exam?.title}</p>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold mb-2">{score}%</h3>
              <Progress value={score} className="h-3 w-full max-w-md mx-auto" />
              <p className="mt-2 text-sm text-gray-500">
                You answered {Object.keys(answers).length} out of {questionIds.length} questions
              </p>
            </div>
            
            {/* Question review */}
            <div className="space-y-4 mt-8 border-t pt-4">
              <h3 className="text-lg font-medium">Review Questions</h3>
              {questionIds.map((questionId, index) => {
                const question = exam?.questions[questionId];
                const isCorrect = answers[questionId] === question?.correctAnswer;
                
                return (
                  <Card key={questionId} className={`border ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Question {index + 1}</span>
                        {answers[questionId] ? (
                          isCorrect ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Correct
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" /> Incorrect
                            </span>
                          )
                        ) : (
                          <span className="text-amber-600">Not answered</span>
                        )}
                      </div>
                      <p className="mb-3">{question?.text}</p>
                      
                      <div className="space-y-2">
                        {question && Object.entries(question.options).map(([key, value]) => (
                          <div 
                            key={key}
                            className={`p-2 border rounded ${
                              answers[questionId] === key && question.correctAnswer === key
                                ? 'bg-green-100 border-green-300'
                                : answers[questionId] === key && question.correctAnswer !== key
                                ? 'bg-red-100 border-red-300'
                                : question.correctAnswer === key
                                ? 'bg-green-50 border-green-200'
                                : 'border-gray-200'
                            }`}
                          >
                            <span className="font-medium mr-2">{key}:</span>
                            {value}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showTerms) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{exam?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Exam Information</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="font-medium">Subject:</span> {exam?.subject}</li>
                <li><span className="font-medium">Duration:</span> {exam?.duration} minutes</li>
                <li><span className="font-medium">Total Questions:</span> {questionIds.length}</li>
              </ul>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Once you start the exam, the timer will begin. You cannot pause or restart the exam.
              </AlertDescription>
            </Alert>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Terms and Conditions</h3>
              <div className="bg-slate-50 p-4 rounded border text-sm whitespace-pre-line">
                {exam?.termsAndConditions}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={startExam}>
              Start Exam
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main exam view
  const currentQuestionId = questionIds[currentQuestion];
  const currentQuestionData = exam?.questions[currentQuestionId];
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{exam?.title}</CardTitle>
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-slate-500">Question {currentQuestion + 1} of {questionIds.length}</span>
            </div>
            <div className="flex gap-2">
              {questionIds.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                    idx === currentQuestion
                      ? 'bg-examblue-600 text-white'
                      : answers[questionIds[idx]]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  onClick={() => setCurrentQuestion(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          
          <Progress value={(currentQuestion + 1) / questionIds.length * 100} className="h-2" />
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-4">{currentQuestionData?.text}</h3>
            <div className="space-y-3">
              {currentQuestionData && Object.entries(currentQuestionData.options).map(([key, value]) => (
                <div
                  key={key}
                  className={`border p-3 rounded cursor-pointer transition-colors ${
                    answers[currentQuestionId] === key
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => handleAnswer(currentQuestionId, key)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      answers[currentQuestionId] === key
                        ? 'bg-examblue-600 text-white border-examblue-600'
                        : 'border-slate-300'
                    }`}>
                      {key}
                    </div>
                    <span>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          
          {currentQuestion === questionIds.length - 1 ? (
            <Button onClick={() => setConfirmEndExam(true)} className="bg-green-600 hover:bg-green-700">
              Submit Exam
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Confirm End Exam Dialog */}
      <Dialog open={confirmEndExam} onOpenChange={setConfirmEndExam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? You cannot change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500">
              You have answered {Object.keys(answers).length} out of {questionIds.length} questions.
              {Object.keys(answers).length < questionIds.length && (
                <span className="text-amber-600 block mt-2">
                  Warning: You have {questionIds.length - Object.keys(answers).length} unanswered questions.
                </span>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmEndExam(false)}>
              Continue Exam
            </Button>
            <Button onClick={endExam}>
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exam;
