
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, push, get, set } from "firebase/database";
import { Trash2, Clock, Plus, HelpCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Branch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
}

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
  subjectId: string;
  branch: string;
  semester: string;
  duration: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  createdBy: string;
  questions: Record<string, Question>;
  termsAndConditions: string;
}

const ExamCreator: React.FC = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default 1 week from now
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. No electronic devices allowed except the test device.\n" +
    "2. No talking or communication with others during the exam.\n" +
    "3. You may not leave the page once the exam has started.\n" +
    "4. Attempting to cheat will result in automatic disqualification."
  );
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      text: "",
      options: {
        A: "",
        B: "",
        C: "",
        D: "",
      },
      correctAnswer: "A",
    },
  ]);

  // Fetch branches and subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch branches
        const branchesRef = ref(database, "branches");
        const branchesSnapshot = await get(branchesRef);
        if (branchesSnapshot.exists()) {
          const branchesData = branchesSnapshot.val();
          const branchesArray: Branch[] = [];
          
          Object.keys(branchesData).forEach((key) => {
            branchesArray.push({
              id: key,
              name: branchesData[key].name,
            });
          });
          
          setBranches(branchesArray);
        }
        
        // Fetch subjects
        const subjectsRef = ref(database, "subjects");
        const subjectsSnapshot = await get(subjectsRef);
        if (subjectsSnapshot.exists()) {
          const subjectsData = subjectsSnapshot.val();
          const subjectsArray: Subject[] = [];
          
          Object.keys(subjectsData).forEach((key) => {
            subjectsArray.push({
              id: key,
              name: subjectsData[key].name,
              code: subjectsData[key].code,
              semester: subjectsData[key].semester,
            });
          });
          
          setSubjects(subjectsArray);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load branches and subjects.",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
  }, [toast]);

  // Fetch existing exams
  useEffect(() => {
    setLoading(true);
    const examsRef = ref(database, "exams");
    
    const unsubscribe = get(examsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const examsList: Exam[] = [];
        
        Object.keys(data).forEach((key) => {
          examsList.push({
            id: key,
            ...data[key],
          });
        });
        
        // Sort by creation date descending
        examsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setExams(examsList);
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching exams:", error);
      setLoading(false);
    });
    
    return () => {
      // No unsubscribe needed as we're using get, not onValue
    };
  }, []);

  const handleAddQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([
      ...questions,
      {
        id: newId,
        text: "",
        options: {
          A: "",
          B: "",
          C: "",
          D: "",
        },
        correctAnswer: "A",
      },
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast({
        title: "Error",
        description: "Exam must have at least one question",
        variant: "destructive",
      });
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: string, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          if (field === "text") {
            return { ...q, text: value };
          } else if (field.startsWith("option")) {
            const option = field.split("-")[1] as "A" | "B" | "C" | "D";
            return {
              ...q,
              options: {
                ...q.options,
                [option]: value,
              },
            };
          } else if (field === "correctAnswer") {
            return { ...q, correctAnswer: value as "A" | "B" | "C" | "D" };
          }
        }
        return q;
      })
    );
  };

  const validateExam = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the exam",
        variant: "destructive",
      });
      return false;
    }
    
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive",
      });
      return false;
    }
    
    if (!startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please set start and end times",
        variant: "destructive",
      });
      return false;
    }
    
    if (startTime >= endTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }
    
    if (duration <= 0) {
      toast({
        title: "Error",
        description: "Duration must be greater than 0",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate questions
    let isValid = true;
    questions.forEach((q, index) => {
      if (!q.text.trim()) {
        toast({
          title: "Error",
          description: `Question ${index + 1} is empty`,
          variant: "destructive",
        });
        isValid = false;
      }
      
      Object.entries(q.options).forEach(([key, value]) => {
        if (!value.trim()) {
          toast({
            title: "Error",
            description: `Option ${key} for question ${index + 1} is empty`,
            variant: "destructive",
          });
          isValid = false;
        }
      });
    });
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateExam() || !currentUser) return;
    
    try {
      setLoading(true);
      
      // Format questions for Firebase
      const questionsObj: Record<string, Question> = {};
      questions.forEach((q) => {
        questionsObj[q.id] = q;
      });
      
      // Get subject name
      const subjectObj = subjects.find((s) => s.id === selectedSubject);
      if (!subjectObj) {
        toast({
          title: "Error",
          description: "Selected subject not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Create exam object
      const newExam = {
        title,
        description,
        subject: subjectObj.name,
        subjectId: selectedSubject,
        branch: selectedBranch,
        semester: selectedSemester,
        duration,
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        questions: questionsObj,
        termsAndConditions,
      };
      
      // Save to Firebase
      const examsRef = ref(database, "exams");
      const newExamRef = push(examsRef);
      await set(newExamRef, newExam);
      
      toast({
        title: "Success",
        description: "Exam created successfully!",
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedSubject("");
      setSelectedBranch("");
      setSelectedSemester("");
      setDuration(60);
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setQuestions([
        {
          id: "1",
          text: "",
          options: {
            A: "",
            B: "",
            C: "",
            D: "",
          },
          correctAnswer: "A",
        },
      ]);
      setCreating(false);
      
      // Refresh exams list
      const updatedExamsSnapshot = await get(examsRef);
      if (updatedExamsSnapshot.exists()) {
        const data = updatedExamsSnapshot.val();
        const examsList: Exam[] = [];
        
        Object.keys(data).forEach((key) => {
          examsList.push({
            id: key,
            ...data[key],
          });
        });
        
        // Sort by creation date descending
        examsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setExams(examsList);
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Exams</h2>
        <Button onClick={() => setCreating(true)}>
          Create New Exam
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-examblue-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Clock className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No exams created yet</p>
            <Button 
              variant="link" 
              onClick={() => setCreating(true)}
              className="mt-2"
            >
              Create your first exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Branch/Semester</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Questions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>
                    {exam.branch ? (
                      <>
                        {branches.find(b => b.id === exam.branch)?.name || exam.branch}
                        {exam.semester && `, Semester ${exam.semester}`}
                      </>
                    ) : (
                      "All branches"
                    )}
                  </TableCell>
                  <TableCell>{exam.duration} minutes</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Start: {formatDate(exam.startTime)}</div>
                      <div>End: {formatDate(exam.endTime)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{Object.keys(exam.questions).length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Exam Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
            <DialogDescription>
              Create a new exam with custom questions and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Midterm Examination"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description about the exam"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger id="semester">
                      <SelectValue placeholder="All semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All semesters</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <DateTimePicker
                    date={startTime}
                    setDate={setStartTime}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <DateTimePicker
                    date={endTime}
                    setDate={setEndTime}
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="terms">Terms and Conditions</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80 text-sm">
                        These terms will be displayed to students before they start the exam.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="terms"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={4}
              />
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Questions</h3>
                <Button onClick={handleAddQuestion} variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <Card key={question.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Question {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                      <Textarea
                        id={`question-${question.id}`}
                        value={question.text}
                        onChange={(e) => handleQuestionChange(question.id, "text", e.target.value)}
                        placeholder="Write your question here"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["A", "B", "C", "D"].map((option) => (
                        <div key={option} className="space-y-2">
                          <Label htmlFor={`question-${question.id}-option-${option}`}>
                            Option {option}
                          </Label>
                          <Input
                            id={`question-${question.id}-option-${option}`}
                            value={question.options[option as "A" | "B" | "C" | "D"]}
                            onChange={(e) => handleQuestionChange(question.id, `option-${option}`, e.target.value)}
                            placeholder={`Option ${option}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`question-${question.id}-answer`}>Correct Answer</Label>
                      <Select
                        value={question.correctAnswer}
                        onValueChange={(value) => handleQuestionChange(question.id, "correctAnswer", value)}
                      >
                        <SelectTrigger id={`question-${question.id}-answer`}>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {["A", "B", "C", "D"].map((option) => (
                            <SelectItem key={option} value={option}>
                              Option {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                  Creating...
                </span>
              ) : "Create Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamCreator;
