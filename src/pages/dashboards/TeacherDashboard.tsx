
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusCircle, 
  User, 
  Users, 
  BookOpen,
  CalendarCheck,
  BarChart,
  Clock,
  Trash2,
  Plus
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { get, ref, set, remove, onValue, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  semester?: string;
  subjects?: string[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

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
  status: "draft" | "published";
  questions: Question[];
  createdBy: string;
  createdAt: string;
}

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // For creating exams
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDuration, setExamDuration] = useState(60);
  const [examTotalMarks, setExamTotalMarks] = useState(100);
  const [examPassingMarks, setExamPassingMarks] = useState(40);
  const [examInstructions, setExamInstructions] = useState("");
  const [examStartTime, setExamStartTime] = useState("");
  const [examEndTime, setExamEndTime] = useState("");
  const [examSemester, setExamSemester] = useState("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const { currentUser, studentRegister } = useAuth();
  const { toast } = useToast();

  // Load students from database
  useEffect(() => {
    const studentsRef = ref(database, "students");
    
    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const studentsList: Student[] = [];
      
      Object.keys(data).forEach((key) => {
        studentsList.push({
          id: key,
          name: data[key].name,
          registrationNumber: data[key].registrationNumber,
          semester: data[key].semester || '',
          subjects: data[key].subjects || []
        });
      });
      
      setStudents(studentsList);
    });
    
    return () => unsubscribe();
  }, []);

  // Load subjects from database
  useEffect(() => {
    const subjectsRef = ref(database, "subjects");
    
    const unsubscribe = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const subjectsList: Subject[] = [];
      
      Object.keys(data).forEach((key) => {
        subjectsList.push({
          id: key,
          name: data[key].name,
          code: data[key].code,
          semester: data[key].semester
        });
      });
      
      setSubjects(subjectsList);
    });
    
    return () => unsubscribe();
  }, []);

  // Load exams from database
  useEffect(() => {
    const examsRef = ref(database, "exams");
    
    const unsubscribe = onValue(examsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const examsList: Exam[] = [];
      
      Object.keys(data).forEach((key) => {
        examsList.push({
          id: key,
          ...data[key],
        });
      });
      
      setExams(examsList);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check if registration number already exists
      const studentsRef = ref(database, "students");
      const snapshot = await get(studentsRef);
      const data = snapshot.val();
      
      if (data) {
        const exists = Object.values(data).some((student: any) => 
          student.registrationNumber === regNumber
        );
        
        if (exists) {
          throw new Error("A student with this registration number already exists.");
        }
      }
      
      // Register student with Firebase Auth
      await studentRegister(regNumber, password, name);
      
      // Update student with semester and subjects
      const userQuery = await get(ref(database, "users"));
      const users = userQuery.val();
      
      // Find the student's UID
      let studentUid = null;
      Object.keys(users).forEach(uid => {
        if (users[uid].role === 'student' && users[uid].name === name) {
          studentUid = uid;
        }
      });
      
      if (studentUid) {
        // Add semester and subjects to the student
        await set(ref(database, `students/${studentUid}/semester`), semester);
        if (selectedSubjects.length > 0) {
          await set(ref(database, `students/${studentUid}/subjects`), selectedSubjects);
        }
      }
      
      toast({
        title: "Student added successfully",
        description: `${name} has been added with registration number ${regNumber}.`,
      });
      
      // Reset form
      setName("");
      setRegNumber("");
      setPassword("");
      setSemester("");
      setSelectedSubjects([]);
      setIsAddingStudent(false);
    } catch (error: any) {
      toast({
        title: "Failed to add student",
        description: error.message || "An error occurred while adding the student.",
        variant: "destructive",
      });
      console.error("Error adding student:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const subjectName = formData.get('subjectName') as string;
    const subjectCode = formData.get('subjectCode') as string;
    const subjectSemester = formData.get('subjectSemester') as string;
    
    try {
      setLoading(true);
      
      // Check if subject code already exists
      const subjectsRef = ref(database, "subjects");
      const snapshot = await get(subjectsRef);
      const data = snapshot.val();
      
      if (data) {
        const exists = Object.values(data).some((subject: any) => 
          subject.code === subjectCode
        );
        
        if (exists) {
          throw new Error("A subject with this code already exists.");
        }
      }
      
      // Add subject to database
      const newSubjectRef = push(ref(database, "subjects"));
      await set(newSubjectRef, {
        name: subjectName,
        code: subjectCode,
        semester: subjectSemester
      });
      
      toast({
        title: "Subject added successfully",
        description: `${subjectName} has been added with code ${subjectCode}.`,
      });
      
      // Reset form
      form.reset();
      setIsAddingSubject(false);
    } catch (error: any) {
      toast({
        title: "Failed to add subject",
        description: error.message || "An error occurred while adding the subject.",
        variant: "destructive",
      });
      console.error("Error adding subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substring(2, 9),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (questions.length === 0) {
        throw new Error("At least one question is required.");
      }
      
      // Validate all questions have a question text, 4 options, and a correct answer
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].question.trim()) {
          throw new Error(`Question ${i + 1} text is required.`);
        }
        
        for (let j = 0; j < questions[i].options.length; j++) {
          if (!questions[i].options[j].trim()) {
            throw new Error(`Option ${j + 1} for Question ${i + 1} is required.`);
          }
        }
      }
      
      // Calculate total marks from questions
      const calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      // Create exam
      const newExamRef = push(ref(database, "exams"));
      const selectedSubjectData = subjects.find(s => s.id === examSubject);
      
      await set(newExamRef, {
        title: examTitle,
        subject: selectedSubjectData?.name || "",
        subjectId: examSubject,
        duration: Number(examDuration),
        totalMarks: calculatedTotalMarks,
        passingMarks: Number(examPassingMarks),
        startTime: examStartTime,
        endTime: examEndTime,
        instructions: examInstructions,
        randomizeQuestions,
        semester: examSemester,
        questions,
        status: "published", // Default to published
        createdBy: currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      
      toast({
        title: "Exam created successfully",
        description: `${examTitle} has been created and published.`,
      });
      
      // Reset form
      setExamTitle("");
      setExamSubject("");
      setExamDuration(60);
      setExamTotalMarks(100);
      setExamPassingMarks(40);
      setExamInstructions("");
      setExamStartTime("");
      setExamEndTime("");
      setExamSemester("");
      setRandomizeQuestions(false);
      setQuestions([]);
      setIsAddingExam(false);
    } catch (error: any) {
      toast({
        title: "Failed to create exam",
        description: error.message || "An error occurred while creating the exam.",
        variant: "destructive",
      });
      console.error("Error creating exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        // In a real app, you'd need to delete the user from Firebase Auth as well
        // This would typically be done through a Cloud Function for security
        
        // For now, we'll just remove from the database
        await remove(ref(database, `students/${studentId}`));
        await remove(ref(database, `users/${studentId}`));
        
        toast({
          title: "Student deleted",
          description: `${studentName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete student",
          description: "An error occurred while deleting the student.",
          variant: "destructive",
        });
        console.error("Error deleting student:", error);
      }
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (window.confirm(`Are you sure you want to delete ${subjectName}?`)) {
      try {
        await remove(ref(database, `subjects/${subjectId}`));
        
        toast({
          title: "Subject deleted",
          description: `${subjectName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete subject",
          description: "An error occurred while deleting the subject.",
          variant: "destructive",
        });
        console.error("Error deleting subject:", error);
      }
    }
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (window.confirm(`Are you sure you want to delete ${examTitle}?`)) {
      try {
        await remove(ref(database, `exams/${examId}`));
        
        toast({
          title: "Exam deleted",
          description: `${examTitle} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete exam",
          description: "An error occurred while deleting the exam.",
          variant: "destructive",
        });
        console.error("Error deleting exam:", error);
      }
    }
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Helper function to format date for input
  const formatDateForInput = (date: Date): string => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span>Exams</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Students</h2>
            
            <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Create a new student account. The student will be able to take assigned exams.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <Input
                      id="regNumber"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="REG2025001"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      This will be used for student login.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select onValueChange={setSemester} value={semester}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                        <SelectItem value="4">Semester 4</SelectItem>
                        <SelectItem value="5">Semester 5</SelectItem>
                        <SelectItem value="6">Semester 6</SelectItem>
                        <SelectItem value="7">Semester 7</SelectItem>
                        <SelectItem value="8">Semester 8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Assign Subjects</Label>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-2">
                          No subjects available. Add subjects first.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {subjects
                            .filter(subject => !semester || subject.semester === semester)
                            .map(subject => (
                            <div key={subject.id} className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`subject-${subject.id}`}
                                checked={selectedSubjects.includes(subject.id)}
                                onChange={() => toggleSubjectSelection(subject.id)}
                                className="rounded"
                              />
                              <label htmlFor={`subject-${subject.id}`} className="text-sm">
                                {subject.name} ({subject.code}) - Sem {subject.semester}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a temporary password"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-slate-500">
                      The student will be able to change this password later.
                    </p>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingStudent(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          Adding...
                        </span>
                      ) : "Add Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Students List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Users className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No students added yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddingStudent(true)}
                    className="mt-2"
                  >
                    Add your first student
                  </Button>
                </CardContent>
              </Card>
            ) : (
              students.map((student) => (
                <Card key={student.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Reg. No: {student.registrationNumber}</p>
                    <p className="text-sm text-slate-500">Semester: {student.semester || 'Not assigned'}</p>
                    
                    {student.subjects && student.subjects.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Subjects:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.subjects.map(subjectId => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <span key={subjectId} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {subject.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">No subjects assigned</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Subjects</h2>
            
            <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject for student registration and exams.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddSubject} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      name="subjectName"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subjectCode">Subject Code</Label>
                    <Input
                      id="subjectCode"
                      name="subjectCode"
                      placeholder="e.g., MATH101"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subjectSemester">Semester</Label>
                    <Select name="subjectSemester" defaultValue="1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                        <SelectItem value="4">Semester 4</SelectItem>
                        <SelectItem value="5">Semester 5</SelectItem>
                        <SelectItem value="6">Semester 6</SelectItem>
                        <SelectItem value="7">Semester 7</SelectItem>
                        <SelectItem value="8">Semester 8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingSubject(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          Adding...
                        </span>
                      ) : "Add Subject"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Subjects List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No subjects added yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddingSubject(true)}
                    className="mt-2"
                  >
                    Add your first subject
                  </Button>
                </CardContent>
              </Card>
            ) : (
              subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Code: {subject.code}</p>
                    <p className="text-sm text-slate-500">Semester: {subject.semester}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Exams</h2>
            
            <Dialog open={isAddingExam} onOpenChange={setIsAddingExam}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Exam</DialogTitle>
                  <DialogDescription>
                    Create a new exam with questions for your students.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddExam} className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="examTitle">Exam Title</Label>
                      <Input
                        id="examTitle"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="e.g., Midterm Examination"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examSubject">Subject</Label>
                      <Select 
                        value={examSubject} 
                        onValueChange={setExamSubject}
                        required
                      >
                        <SelectTrigger id="examSubject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examSemester">Semester</Label>
                      <Select 
                        value={examSemester} 
                        onValueChange={setExamSemester}
                        required
                      >
                        <SelectTrigger id="examSemester">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Semester 1</SelectItem>
                          <SelectItem value="2">Semester 2</SelectItem>
                          <SelectItem value="3">Semester 3</SelectItem>
                          <SelectItem value="4">Semester 4</SelectItem>
                          <SelectItem value="5">Semester 5</SelectItem>
                          <SelectItem value="6">Semester 6</SelectItem>
                          <SelectItem value="7">Semester 7</SelectItem>
                          <SelectItem value="8">Semester 8</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examDuration">Duration (minutes)</Label>
                      <Input
                        id="examDuration"
                        type="number"
                        min="1"
                        value={examDuration}
                        onChange={(e) => setExamDuration(Number(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examPassingMarks">Passing Marks</Label>
                      <Input
                        id="examPassingMarks"
                        type="number"
                        min="1"
                        value={examPassingMarks}
                        onChange={(e) => setExamPassingMarks(Number(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examStartTime">Start Time</Label>
                      <Input
                        id="examStartTime"
                        type="datetime-local"
                        value={examStartTime}
                        onChange={(e) => setExamStartTime(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examEndTime">End Time</Label>
                      <Input
                        id="examEndTime"
                        type="datetime-local"
                        value={examEndTime}
                        onChange={(e) => setExamEndTime(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-full">
                      <Label htmlFor="examInstructions">Instructions</Label>
                      <Textarea
                        id="examInstructions"
                        placeholder="Enter exam instructions for students..."
                        value={examInstructions}
                        onChange={(e) => setExamInstructions(e.target.value)}
                        className="h-20"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="randomizeQuestions"
                        checked={randomizeQuestions}
                        onCheckedChange={setRandomizeQuestions}
                      />
                      <Label htmlFor="randomizeQuestions">Randomize question order</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Questions</h3>
                      <Button 
                        type="button" 
                        onClick={handleAddQuestion}
                        variant="outline"
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Question
                      </Button>
                    </div>
                    
                    {questions.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No questions added yet</p>
                        <Button 
                          variant="link" 
                          onClick={handleAddQuestion}
                          className="mt-2"
                        >
                          Add your first question
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {questions.map((question, index) => (
                          <Card key={question.id} className="relative">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteQuestion(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                            
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Question {index + 1}</CardTitle>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`question-${index}`}>Question</Label>
                                <Textarea
                                  id={`question-${index}`}
                                  value={question.question}
                                  onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                                  placeholder="Enter your question here..."
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Options</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center space-x-2">
                                      <Input
                                        value={option}
                                        onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                        required
                                      />
                                      <Checkbox
                                        checked={question.correctAnswer === optionIndex}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            handleUpdateQuestion(index, 'correctAnswer', optionIndex);
                                          }
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-500">
                                  Check the box next to the correct answer.
                                </p>
                              </div>
                              
                              <div className="w-32">
                                <Label htmlFor={`marks-${index}`}>Marks</Label>
                                <Input
                                  id={`marks-${index}`}
                                  type="number"
                                  min="1"
                                  value={question.marks}
                                  onChange={(e) => handleUpdateQuestion(index, 'marks', Number(e.target.value))}
                                  required
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingExam(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          Creating Exam...
                        </span>
                      ) : "Create Exam"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Exams List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <CalendarCheck className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No exams created yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddingExam(true)}
                    className="mt-2"
                  >
                    Create your first exam
                  </Button>
                </CardContent>
              </Card>
            ) : (
              exams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Subject: {exam.subject}</p>
                    <p className="text-sm text-slate-500">Semester: {exam.semester}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration} minutes</span>
                    </div>
                    
                    <p className="text-sm text-slate-500 mt-2">
                      {new Date(exam.startTime).toLocaleString()} to {new Date(exam.endTime).toLocaleString()}
                    </p>
                    
                    <div className="mt-2">
                      <p className="text-sm">
                        <span className="font-medium">{exam.questions?.length || 0}</span> Questions | 
                        <span className="font-medium"> {exam.totalMarks}</span> Total Marks
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab - Placeholder for now */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View student performance analytics here. (This section will be implemented later)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
